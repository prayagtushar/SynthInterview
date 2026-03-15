export interface QuestionData {
	title: string;
	description: string;
	testCases: { input: string; output: string }[];
	optimalTimeComplexity: string;
	optimalSpaceComplexity: string;
}

export interface ScorecardData {
	scores: Record<string, number>;
	overall_score: number;
	rating: string;
	feedback: string;
	dimension_feedback: Record<string, string>;
	improvement_areas: string[];
	strengths: string[];
}

export interface ExecResult {
	stdout: string;
	stderr: string;
	exitCode: number | null;
	execTime?: number;
}

export interface TestCaseResult {
	label: string;
	passed: boolean;
	actual: string;
	expected: string;
}

export interface RunResult {
	passed: number;
	total: number;
	results: TestCaseResult[];
	error: string | null;
	stdout?: string;
	stderr?: string;
	execTime?: number;
}
