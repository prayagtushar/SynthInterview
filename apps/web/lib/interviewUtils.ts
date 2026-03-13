import { QuestionData } from './types';

export function generateProblemComments(
	q: QuestionData,
	langId: string,
): string {
	const isHash = langId === 'python';
	const lines: string[] = [];

	// Top border
	if (!isHash) {
		lines.push('/*');
		lines.push(
			` * ═══════════════════════════════════════════════════════════`,
		);
	} else {
		lines.push('# ═══════════════════════════════════════════════════════════');
	}

	// Description lines
	const descLines = q.description.split('\n');
	if (!isHash) {
		lines.push(' *');
		for (const dl of descLines) {
			lines.push(` *  ${dl}`);
		}
		lines.push(' *');
	} else {
		lines.push('#');
		for (const dl of descLines) {
			lines.push(`#  ${dl}`);
		}
		lines.push('#');
	}

	// Test cases
	if (q.testCases && q.testCases.length > 0) {
		if (!isHash) {
			lines.push(
				` * ─── Test Cases ───────────────────────────────────────────`,
			);
			for (const tc of q.testCases) {
				lines.push(` *  Input:  ${tc.input}`);
				lines.push(` *  Output: ${tc.output}`);
				lines.push(` *`);
			}
		} else {
			lines.push(
				`# ─── Test Cases ───────────────────────────────────────────`,
			);
			for (const tc of q.testCases) {
				lines.push(`#  Input:  ${tc.input}`);
				lines.push(`#  Output: ${tc.output}`);
				lines.push(`#`);
			}
		}
	}

	// Close comment block
	if (!isHash) {
		lines.push(
			` * ═══════════════════════════════════════════════════════════`,
		);
		lines.push(' */');
	} else {
		lines.push('# ═══════════════════════════════════════════════════════════');
	}

	lines.push(''); // blank separator line
	return lines.join('\n');
}
