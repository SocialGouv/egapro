import type { CseOpinionStep1Data, OpinionType } from "./types";

type DbOpinionRow = {
	declarationNumber: number;
	type: string;
	opinion: string | null;
	opinionDate: string | null;
	gapConsulted: boolean | null;
};

function asOpinionType(value: string | null): OpinionType | null {
	if (value === "favorable" || value === "unfavorable") return value;
	return null;
}

export function mapOpinionsFromDb(
	rows: DbOpinionRow[],
): CseOpinionStep1Data | undefined {
	if (rows.length === 0) return undefined;

	const find = (declNum: number, type: string) =>
		rows.find((r) => r.declarationNumber === declNum && r.type === type);

	const firstAccuracy = find(1, "accuracy");
	const firstGap = find(1, "gap");
	const secondAccuracy = find(2, "accuracy");
	const secondGap = find(2, "gap");

	return {
		firstDeclAccuracyOpinion: asOpinionType(firstAccuracy?.opinion ?? null),
		firstDeclAccuracyDate: firstAccuracy?.opinionDate ?? null,
		firstDeclGapConsulted: firstGap?.gapConsulted ?? null,
		firstDeclGapOpinion: asOpinionType(firstGap?.opinion ?? null),
		firstDeclGapDate: firstGap?.opinionDate ?? null,
		secondDeclAccuracyOpinion: asOpinionType(secondAccuracy?.opinion ?? null),
		secondDeclAccuracyDate: secondAccuracy?.opinionDate ?? null,
		secondDeclGapConsulted: secondGap?.gapConsulted ?? null,
		secondDeclGapOpinion: asOpinionType(secondGap?.opinion ?? null),
		secondDeclGapDate: secondGap?.opinionDate ?? null,
	};
}
