import React from "react";
import {
  CircleDot,
  User,
  Monitor,
  FileText,
  Play,
  Lightbulb,
  Terminal,
  CheckCircle,
  AlertTriangle,
  WifiOff,
} from "lucide-react";

export const LANGUAGES = [
  { id: "javascript", label: "JavaScript", ext: ".js", icon: "JS" },
  { id: "typescript", label: "TypeScript", ext: ".ts", icon: "TS" },
  { id: "python", label: "Python", ext: ".py", icon: "PY" },
  { id: "cpp", label: "C++", ext: ".cpp", icon: "C+" },
  { id: "java", label: "Java", ext: ".java", icon: "JA" },
  { id: "go", label: "Go", ext: ".go", icon: "GO" },
] as const;

export const DEFAULT_CODE: Record<string, string> = {
  javascript:
    "// Your solution here\n\nfunction solve(nums, target) {\n  // Write your code...\n}\n",
  typescript:
    "// Your solution here\n\nfunction solve(nums: number[], target: number): number[] {\n  // Write your code...\n}\n",
  python:
    "# Your solution here\n\ndef solve(nums, target):\n    # Write your code...\n    pass\n",
  cpp: "// Your solution here\n#include <vector>\nusing namespace std;\n\nvector<int> solve(vector<int>& nums, int target) {\n    // Write your code...\n}\n",
  java: "// Your solution here\n\nclass Solution {\n    public int[] solve(int[] nums, int target) {\n        // Write your code...\n    }\n}\n",
  go: "// Your solution here\npackage main\n\nfunc solve(nums []int, target int) []int {\n\t// Write your code...\n\treturn nil\n}\n",
};

export const PISTON_RUNTIMES: Record<
  string,
  { language: string; version: string }
> = {
  javascript: { language: "javascript", version: "18.15.0" },
  typescript: { language: "typescript", version: "5.0.3" },
  python: { language: "python", version: "3.10.0" },
  cpp: { language: "c++", version: "10.2.0" },
  java: { language: "java", version: "15.0.2" },
  go: { language: "go", version: "1.16.2" },
};

export const STATE_COLORS: Record<string, string> = {
  IDLE: "bg-gray-800 text-gray-400",
  GREETING: "bg-blue-900/50 text-blue-300",
  ENV_CHECK: "bg-yellow-900/50 text-yellow-300",
  PROBLEM_DELIVERY: "bg-blue-900/30 text-blue-400",
  THINK_TIME: "bg-sky-900/30 text-sky-400",
  APPROACH_LISTEN: "bg-cyan-900/50 text-cyan-300",
  CODING: "bg-green-900/50 text-green-300",
  HINT_DELIVERY: "bg-orange-900/50 text-orange-300",
  TESTING: "bg-teal-900/50 text-teal-300",
  OPTIMIZATION: "bg-pink-900/50 text-pink-300",
  COMPLETED: "bg-emerald-900/50 text-emerald-300",
  FLAGGED: "bg-red-900/50 text-red-300",
  SCREEN_NOT_VISIBLE: "bg-amber-900/50 text-amber-300",
};

export const STATE_ICONS: Record<string, React.ReactNode> = {
  IDLE: <CircleDot size={12} />,
  GREETING: <User size={12} />,
  ENV_CHECK: <Monitor size={12} />,
  PROBLEM_DELIVERY: <FileText size={12} />,
  THINK_TIME: <span className="text-xs">💭</span>,
  APPROACH_LISTEN: <span className="text-xs">🗣</span>,
  CODING: <Play size={12} />,
  HINT_DELIVERY: <Lightbulb size={12} />,
  TESTING: <Terminal size={12} />,
  OPTIMIZATION: <span className="text-xs">⚡</span>,
  COMPLETED: <CheckCircle size={12} />,
  FLAGGED: <AlertTriangle size={12} />,
  SCREEN_NOT_VISIBLE: <WifiOff size={12} />,
};

export const MANUAL_TRANSITIONS: Record<
  string,
  { label: string; event: string; icon: React.ReactNode; signal?: string }[]
> = {
  GREETING: [
    {
      label: "Share Screen & Mic",
      event: "screen_share_active",
      icon: <Monitor size={12} />,
    },
  ],
  ENV_CHECK: [],
  PROBLEM_DELIVERY: [],
  THINK_TIME: [],
  APPROACH_LISTEN: [],
  CODING: [
    {
      label: "Request Hint",
      event: "hint_requested",
      icon: <Lightbulb size={12} />,
    },
    {
      label: "I'm Done",
      event: "candidate_signal",
      signal:
        "The candidate says they are done coding their solution. Review their code and decide whether to proceed to testing.",
      icon: <CheckCircle size={12} />,
    },
  ],
  TESTING: [
    {
      label: "I'm Done",
      event: "candidate_signal",
      signal:
        "The candidate says they are done with testing. Evaluate and decide whether to move to optimization discussion.",
      icon: <CheckCircle size={12} />,
    },
  ],
  OPTIMIZATION: [
    {
      label: "I'm Done",
      event: "candidate_signal",
      signal:
        "The candidate says they are done discussing optimization. Wrap up if satisfied.",
      icon: <CheckCircle size={12} />,
    },
  ],
  FLAGGED: [
    {
      label: "Acknowledged",
      event: "warning_acknowledged",
      icon: <CheckCircle size={12} />,
    },
  ],
  SCREEN_NOT_VISIBLE: [
    {
      label: "Share Screen Again",
      event: "screen_share_active",
      icon: <Monitor size={12} />,
    },
  ],
};
