import { describe, expect, it, vi } from "vitest";
import {
	buildOpinionsFormValues,
	CLEARED_GAP_FIELDS,
	hydrateOpinionsForm,
	isGapConsultationIncomplete,
	normalizeSubmittedOpinions,
} from "../opinionsFormValues";
import type { CseOpinionStep1Data } from "../types";

const initialData: CseOpinionStep1Data = {
	firstDeclAccuracyOpinion: "favorable",
	firstDeclAccuracyDate: "2026-01-15",
	firstDeclGapConsulted: true,
	firstDeclGapOpinion: "favorable",
	firstDeclGapDate: "2026-01-20",
	secondDeclAccuracyOpinion: "unfavorable",
	secondDeclAccuracyDate: "2026-02-01",
	secondDeclGapConsulted: true,
	secondDeclGapOpinion: "unfavorable",
	secondDeclGapDate: "2026-02-02",
};

describe("buildOpinionsFormValues", () => {
	it("keeps second-declaration gap fields when a remaining gap ≥ 5% is present", () => {
		const values = buildOpinionsFormValues(initialData, true, true);

		expect(values.secondDeclaration?.gapConsulted).toBe(true);
		expect(values.secondDeclaration?.gapOpinion).toBe("unfavorable");
		expect(values.secondDeclaration?.gapDate).toBe("2026-02-02");
	});

	it("clears second-declaration gap fields when no remaining gap is ≥ 5%", () => {
		const values = buildOpinionsFormValues(initialData, true, false);

		expect(values.secondDeclaration).toMatchObject({
			accuracyOpinion: "unfavorable",
			accuracyDate: "2026-02-01",
			...CLEARED_GAP_FIELDS,
		});
	});

	it("forces gapConsulted true for the second-round justification path", () => {
		const values = buildOpinionsFormValues(
			{ ...initialData, secondDeclGapConsulted: false },
			true,
			true,
			true,
		);

		expect(values.secondDeclaration?.gapConsulted).toBe(true);
		expect(values.secondDeclaration?.gapOpinion).toBe("unfavorable");
	});

	it("clears gap fields even on the justification path when no remaining gap is ≥ 5%", () => {
		const values = buildOpinionsFormValues(initialData, true, false, true);

		expect(values.secondDeclaration).toMatchObject({
			accuracyOpinion: "unfavorable",
			accuracyDate: "2026-02-01",
			...CLEARED_GAP_FIELDS,
		});
	});

	it("omits secondDeclaration when there is no second declaration", () => {
		const values = buildOpinionsFormValues(initialData, false, false);

		expect(values.secondDeclaration).toBeUndefined();
		expect(values.firstDeclaration.gapConsulted).toBe(true);
	});
});

const submitted = {
	firstDeclaration: {
		accuracyOpinion: "favorable" as const,
		accuracyDate: "2026-01-15",
		gapConsulted: false,
		gapOpinion: null,
		gapDate: null,
	},
	secondDeclaration: {
		accuracyOpinion: "unfavorable" as const,
		accuracyDate: "2026-02-01",
		gapConsulted: true,
		gapOpinion: "favorable" as const,
		gapDate: "2026-02-02",
	},
};

describe("normalizeSubmittedOpinions", () => {
	it("clears second-declaration gap fields when no remaining gap is ≥ 5%", () => {
		expect(
			normalizeSubmittedOpinions(submitted, false, false).secondDeclaration,
		).toMatchObject(CLEARED_GAP_FIELDS);
	});

	it("forces gapConsulted true on the second-round justification path", () => {
		expect(
			normalizeSubmittedOpinions(
				{
					...submitted,
					secondDeclaration: {
						...submitted.secondDeclaration,
						gapConsulted: false,
					},
				},
				true,
				true,
			).secondDeclaration?.gapConsulted,
		).toBe(true);
	});

	it("leaves gap fields unchanged when a remaining gap is ≥ 5% outside the justification path", () => {
		expect(
			normalizeSubmittedOpinions(submitted, true, false).secondDeclaration,
		).toEqual(submitted.secondDeclaration);
	});
});

describe("isGapConsultationIncomplete", () => {
	it("is true when consulted without opinion or date", () => {
		expect(
			isGapConsultationIncomplete({
				...submitted.firstDeclaration,
				gapConsulted: true,
			}),
		).toBe(true);
	});

	it("is false when consulted with opinion and date", () => {
		expect(
			isGapConsultationIncomplete({
				...submitted.firstDeclaration,
				gapConsulted: true,
				gapOpinion: "favorable",
				gapDate: "2026-01-20",
			}),
		).toBe(false);
	});
});

describe("hydrateOpinionsForm", () => {
	it("clears a stale second-declaration draft when no remaining gap is ≥ 5%", () => {
		const setValue = vi.fn() as unknown as Parameters<
			typeof hydrateOpinionsForm
		>[0];
		hydrateOpinionsForm(
			setValue,
			{
				secondDeclaration: {
					accuracyOpinion: "unfavorable",
					accuracyDate: "2026-02-01",
					gapConsulted: true,
					gapOpinion: "favorable",
					gapDate: "2026-02-02",
				},
			},
			true,
			false,
			false,
		);

		expect(setValue).toHaveBeenCalledWith(
			"secondDeclaration.gapConsulted",
			false,
		);
		expect(setValue).toHaveBeenCalledWith("secondDeclaration.gapOpinion", null);
		expect(setValue).toHaveBeenCalledWith("secondDeclaration.gapDate", null);
		expect(setValue).not.toHaveBeenCalledWith(
			"secondDeclaration.gapConsulted",
			true,
		);
	});
});
