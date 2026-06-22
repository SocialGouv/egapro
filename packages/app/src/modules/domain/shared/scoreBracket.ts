export type ScoreBracketId =
	| "lt50"
	| "50-59"
	| "60-69"
	| "70-79"
	| "80-89"
	| "90-99"
	| "100"
	| "nc";

export type ScoreBracket = {
	id: ScoreBracketId;
	label: string;
	min: number | null;
	max: number | null;
};

export const SCORE_BRACKETS: readonly ScoreBracket[] = [
	{ id: "lt50", label: "<50", min: 0, max: 49 },
	{ id: "50-59", label: "50-59", min: 50, max: 59 },
	{ id: "60-69", label: "60-69", min: 60, max: 69 },
	{ id: "70-79", label: "70-79", min: 70, max: 79 },
	{ id: "80-89", label: "80-89", min: 80, max: 89 },
	{ id: "90-99", label: "90-99", min: 90, max: 99 },
	{ id: "100", label: "100", min: 100, max: 100 },
	{ id: "nc", label: "NC", min: null, max: null },
];

export function getScoreBracket(score: number | null): ScoreBracketId {
	if (score === null || !Number.isFinite(score)) return "nc";
	if (score < 50) return "lt50";
	if (score < 60) return "50-59";
	if (score < 70) return "60-69";
	if (score < 80) return "70-79";
	if (score < 90) return "80-89";
	if (score < 100) return "90-99";
	return "100";
}
