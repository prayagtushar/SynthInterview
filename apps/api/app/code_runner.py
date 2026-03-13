"""
Code execution runner for SynthInterview.
Wraps candidate's solve() function in a test harness and runs it against
structured test cases.

Execution strategy (all local — no external API required):
  - Python     → sys.executable subprocess
  - JavaScript → node subprocess
  - TypeScript → node subprocess (after stripping type annotations)
  - Java/C++/Go → not yet supported locally; returns a clear message
"""

import asyncio
import json
import logging
import os
import shutil
import sys
import tempfile
from typing import Optional

logger = logging.getLogger(__name__)


async def run_code_against_tests(
    code: str,
    language: str,
    question: dict,
) -> dict:
    """
    Run candidate code against the question's structured_tests.
    Returns:
        {
          "passed": int,
          "total": int,
          "results": [{"label": str, "passed": bool, "actual": str, "expected": str}],
          "error": str | None
        }
    """
    structured = question.get("structured_tests")
    if not structured:
        return {
            "passed": 0,
            "total": 0,
            "results": [],
            "error": "No executable test cases for this question.",
        }

    harness = _build_harness(code, language, structured, question.get("sort_compare", False))
    if harness is None:
        return {
            "passed": 0,
            "total": 0,
            "results": [],
            "error": f"Auto-grading is not available for '{language}' yet.",
        }

    if language == "python":
        return await _run_subprocess(harness, structured, cmd=[sys.executable, "{file}"], ext=".py")

    if language in ("javascript", "typescript"):
        node = shutil.which("node")
        if not node:
            return {"passed": 0, "total": len(structured), "results": [],
                    "error": "Node.js is not installed on the server."}
        # TypeScript: strip type annotations so plain node can run it
        src = _strip_ts_types(harness) if language == "typescript" else harness
        return await _run_subprocess(src, structured, cmd=[node, "{file}"], ext=".js")

    return {
        "passed": 0,
        "total": len(structured),
        "results": [],
        "error": f"Auto-grading for '{language}' requires a self-hosted execution environment.",
    }


# ── Local subprocess execution ───────────────────────────────────────────────

async def _run_subprocess(harness: str, tests: list, cmd: list[str], ext: str) -> dict:
    """Write harness to a temp file, run it with the given command, parse output."""
    tmp = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=ext, delete=False, encoding="utf-8"
        ) as f:
            f.write(harness)
            tmp = f.name

        resolved_cmd = [tmp if part == "{file}" else part for part in cmd]
        proc = await asyncio.create_subprocess_exec(
            *resolved_cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        try:
            stdout_b, stderr_b = await asyncio.wait_for(proc.communicate(), timeout=10)
        except asyncio.TimeoutError:
            proc.kill()
            await proc.communicate()
            return {"passed": 0, "total": len(tests), "results": [],
                    "error": "Execution timed out (10s limit)."}

        stdout = stdout_b.decode("utf-8", errors="replace")
        stderr = stderr_b.decode("utf-8", errors="replace")
        return _parse_output(stdout, stderr, tests)
    except Exception as e:
        logger.error("Subprocess execution failed: %s", e)
        return {"passed": 0, "total": len(tests), "results": [], "error": str(e)}
    finally:
        if tmp:
            try:
                os.unlink(tmp)
            except OSError:
                pass


def _strip_ts_types(code: str) -> str:
    """Very lightweight TypeScript → JavaScript: remove type annotations so plain node can run it."""
    import re
    # Remove `: Type` annotations on parameters and variable declarations
    code = re.sub(r":\s*[A-Za-z<>\[\]|&\s]+(?=[,)=\n{])", "", code)
    # Remove `as Type` casts
    code = re.sub(r"\s+as\s+\w+", "", code)
    # Remove generic type parameters on function calls  e.g. fn<T>(...)
    code = re.sub(r"<[A-Za-z,\s]+>(?=\()", "", code)
    return code


# ── Harness builders ────────────────────────────────────────────────────────

def _build_harness(code: str, language: str, tests: list, sort_compare) -> Optional[str]:
    tests_json = json.dumps(tests)
    if language == "python":
        return _python_harness(code, tests_json, sort_compare)
    elif language in ("javascript", "typescript"):
        return _js_harness(code, tests_json, sort_compare)
    elif language == "java":
        return _java_harness(code, tests_json)
    elif language == "cpp":
        return _cpp_harness(code, tests_json)
    elif language == "go":
        return _go_harness(code, tests_json)
    return None


def _python_harness(code: str, tests_json: str, sort_compare) -> str:
    if sort_compare == "deep":
        compare = "sorted([sorted(x) for x in _result]) == sorted([sorted(x) for x in _expected]) if hasattr(_result,'__iter__') else False"
    elif sort_compare:
        compare = "sorted(list(_result)) == sorted(list(_expected)) if hasattr(_result,'__iter__') and not isinstance(_result,str) else _result == _expected"
    else:
        compare = "_result == _expected"
    return f"""{code}

# ─── Auto-grader ─────────────────────────────────────────────────────────────
import json as _json
_tests = {tests_json}
_passed = 0
for _i, _tc in enumerate(_tests):
    try:
        _result = solve(*_tc["args"])
        _expected = _tc["expected"]
        _ok = {compare}
        if _ok:
            _passed += 1
        _label = _tc.get("label", f"TC{{_i+1}}")
        print(f"{{_label}}:{{'PASS' if _ok else 'FAIL'}}|GOT:{{_json.dumps(_result)}}|EXP:{{_json.dumps(_expected)}}")
    except Exception as _e:
        _label = _tc.get("label", f"TC{{_i+1}}")
        _expected = _tc["expected"]
        print(f"{{_label}}:FAIL|GOT:ERROR:{{str(_e)[:120]}}|EXP:{{_json.dumps(_expected)}}")
print(f"SUMMARY:{{_passed}}/{{len(_tests)}}")
"""


def _js_harness(code: str, tests_json: str, sort_compare) -> str:
    if sort_compare == "deep":
        compare_fn = """
function _deepEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  const sa = JSON.stringify([...a].map(x => [...x].sort()).sort());
  const sb = JSON.stringify([...b].map(x => [...x].sort()).sort());
  return sa === sb;
}"""
    elif sort_compare:
        compare_fn = """
function _deepEqual(a, b) {
  const sa = JSON.stringify(Array.isArray(a) ? [...a].sort() : a);
  const sb = JSON.stringify(Array.isArray(b) ? [...b].sort() : b);
  return sa === sb;
}"""
    else:
        compare_fn = """
function _deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}"""

    return f"""{code}
{compare_fn}
const _tests = {tests_json};
let _passed = 0;
for (let _i = 0; _i < _tests.length; _i++) {{
  const _tc = _tests[_i];
  const _label = _tc.label || `TC${{_i+1}}`;
  try {{
    const _result = solve(..._tc.args);
    const _ok = _deepEqual(_result, _tc.expected);
    if (_ok) _passed++;
    console.log(`${{_label}}:${{_ok?'PASS':'FAIL'}}|GOT:${{JSON.stringify(_result)}}|EXP:${{JSON.stringify(_tc.expected)}}`);
  }} catch (_e) {{
    console.log(`${{_label}}:FAIL|GOT:ERROR:${{String(_e).slice(0,120)}}|EXP:${{JSON.stringify(_tc.expected)}}`);
  }}
}}
console.log(`SUMMARY:${{_passed}}/${{_tests.length}}`);
"""


def _java_harness(code: str, tests_json: str) -> str:
    # Java is complex — use a wrapper that prints basic output
    # Candidate's code must be a class with a solve() method
    return f"""import java.util.*;
import java.util.stream.*;

{code}

// Auto-grader main
class Main {{
    public static void main(String[] args) {{
        // Java auto-grading requires manual test specification
        System.out.println("SUMMARY:0/0");
        System.out.println("NOTE:Java auto-grading runs code but cannot parse test cases automatically. Please verify output manually.");
    }}
}}
"""


def _cpp_harness(code: str, tests_json: str) -> str:
    return f"""#include <bits/stdc++.h>
using namespace std;

{code}

int main() {{
    // C++ auto-grading: code compiled and run successfully
    cout << "SUMMARY:0/0" << endl;
    cout << "NOTE:C++ auto-grading runs code but cannot parse test cases automatically." << endl;
    return 0;
}}
"""


def _go_harness(code: str, tests_json: str) -> str:
    return f"""{code}

// Auto-grader
func main() {{
    fmt.Println("SUMMARY:0/0")
    fmt.Println("NOTE:Go auto-grading runs code but cannot parse test cases automatically.")
}}
"""


# ── Output parser ────────────────────────────────────────────────────────────

def _parse_output(stdout: str, stderr: str, tests: list) -> dict:
    """Parse harness stdout into structured results."""
    lines = stdout.strip().splitlines()
    results = []
    passed = 0

    for line in lines:
        if line.startswith("SUMMARY:"):
            parts = line[len("SUMMARY:"):].split("/")
            if len(parts) == 2:
                try:
                    passed = int(parts[0])
                except ValueError:
                    pass
            continue

        if line.startswith("NOTE:"):
            continue

        # Format: LABEL:PASS/FAIL|GOT:...|EXP:...
        if "|GOT:" in line and "|EXP:" in line:
            try:
                colon_idx = line.index(":")
                label = line[:colon_idx]
                rest = line[colon_idx + 1:]
                status, rest2 = rest.split("|GOT:", 1)
                actual, expected = rest2.split("|EXP:", 1)
                ok = status.strip() == "PASS"
                results.append({
                    "label": label,
                    "passed": ok,
                    "actual": actual.strip(),
                    "expected": expected.strip(),
                })
            except Exception:
                continue

    # If we couldn't parse anything but have stderr, report it
    runtime_error = None
    if stderr and not results:
        runtime_error = stderr[:500]

    # Fill in unparsed tests
    if not results and tests:
        for i, tc in enumerate(tests):
            results.append({
                "label": tc.get("label", f"TC{i+1}"),
                "passed": False,
                "actual": "No output",
                "expected": json.dumps(tc.get("expected", "?")),
            })

    return {
        "passed": passed,
        "total": len(tests),
        "results": results,
        "error": runtime_error,
    }


def _ext(language: str) -> str:
    return {
        "python": ".py",
        "javascript": ".js",
        "typescript": ".ts",
        "java": ".java",
        "cpp": ".cpp",
        "go": ".go",
    }.get(language, ".txt")
