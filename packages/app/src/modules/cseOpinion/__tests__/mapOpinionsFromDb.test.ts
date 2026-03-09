import { describe, expect, it } from "vitest";
import { mapOpinionsFromDb } from "../mapOpinionsFromDb";

describe("mapOpinionsFromDb", () => {
	it("returns undefined for empty rows", () => {
		expect(mapOpinionsFromDb([])).toBeUndefined();
	});

	it("maps all 4 opinion rows to CseOpinionStep1Data", () => {
		const rows = [
			{
				declarationNumber: 1,
				type: "accuracy",
				opinion: "favorable",
				opinionDate: "2026-01-15",
				gapConsulted: null,
			},
			{
				declarationNumber: 1,
				type: "gap",
				opinion: "unfavorable",
				opinionDate: "2026-01-20",
				gapConsulted: true,
			},
			{
				declarationNumber: 2,
				type: "accuracy",
				opinion: "unfavorable",
				opinionDate: "2026-02-01",
				gapConsulted: null,
			},
			{
				declarationNumber: 2,
				type: "gap",
				opinion: null,
				opinionDate: null,
				gapConsulted: false,
			},
		];

		expect(mapOpinionsFromDb(rows)).toEqual({
			firstDeclAccuracyOpinion: "favorable",
			firstDeclAccuracyDate: "2026-01-15",
			firstDeclGapConsulted: true,
			firstDeclGapOpinion: "unfavorable",
			firstDeclGapDate: "2026-01-20",
			secondDeclAccuracyOpinion: "unfavorable",
			secondDeclAccuracyDate: "2026-02-01",
			secondDeclGapConsulted: false,
			secondDeclGapOpinion: null,
			secondDeclGapDate: null,
		});
	});

	it("handles partial rows gracefully", () => {
		const rows = [
			{
				declarationNumber: 1,
				type: "accuracy",
				opinion: "favorable",
				opinionDate: "2026-01-15",
				gapConsulted: null,
			},
		];

		const result = mapOpinionsFromDb(rows);
		expect(result?.firstDeclAccuracyOpinion).toBe("favorable");
		expect(result?.firstDeclGapConsulted).toBeNull();
		expect(result?.secondDeclAccuracyOpinion).toBeNull();
	});

	it("rejects invalid opinion values", () => {
		const rows = [
			{
				declarationNumber: 1,
				type: "accuracy",
				opinion: "invalid_value",
				opinionDate: "2026-01-15",
				gapConsulted: null,
			},
		];

		const result = mapOpinionsFromDb(rows);
		expect(result?.firstDeclAccuracyOpinion).toBeNull();
	});
});
