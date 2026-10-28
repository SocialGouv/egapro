import { describe, expect, it, vi } from "vitest";

import {
	buildOpinionsFormValues,
	CLEARED_GAP_FIELDS,
	hydrateOpinionsForm,
	isJustificationOpinionIncomplete,
	normalizeSubmittedOpinions,
} from "../opinionsFormValues";
import type { CseOpinionStep1Data } from "../types";

const REQUIRED_BOTH = {
	firstDeclJustificationRequired: true,
	secondDeclJustificationRequired: true,
};
const REQUIRED_NONE = {
	firstDeclJustificationRequired: false,
	secondDeclJustificationRequired: false,
};

const initialData: CseOpinionStep1Data = {
	firstDeclAccuracyOpinion: "favorable",
	firstDeclAccuracyDate: "2026-01-15",
	firstDeclGapConsulted: true,
	firstDeclGapOpinion: "unfavorable",
	firstDeclGapDate: "2026-01-16",
	secondDeclAccuracyOpinion: "favorable",
	secondDeclAccuracyDate: "2026-02-15",
	secondDeclGapConsulted: false,
	secondDeclGapOpinion: "favorable",
	secondDeclGapDate: "2026-02-16",
};

const accuracy = {
	accuracyOpinion: "favorable" as const,
	accuracyDate: "2026-01-15",
};

describe("buildOpinionsFormValues", () => {
	it("keeps the stored justification opinions when they are required", () => {
		const values = buildOpinionsFormValues(initialData, true, REQUIRED_BOTH);

		expect(values.firstDeclaration).toEqual({
			accuracyOpinion: "favorable",
			accuracyDate: "2026-01-15",
			gapOpinion: "unfavorable",
			gapDate: "2026-01-16",
		});
		expect(values.secondDeclaration?.gapOpinion).toBe("favorable");
		expect(values.secondDeclaration?.gapDate).toBe("2026-02-16");
	});

	it("keeps the justification opinion regardless of the stored consultation flag", () => {
		const values = buildOpinionsFormValues(initialData, true, REQUIRED_BOTH);

		expect(values.secondDeclaration).not.toHaveProperty("gapConsulted");
		expect(values.secondDeclaration?.gapOpinion).toBe("favorable");
	});

	it("clears the justification fields that are not required", () => {
		const values = buildOpinionsFormValues(initialData, true, REQUIRED_NONE);

		expect(values.firstDeclaration).toMatchObject(CLEARED_GAP_FIELDS);
		expect(values.secondDeclaration).toMatchObject(CLEARED_GAP_FIELDS);
	});

	it("omits the second declaration when there is none", () => {
		const values = buildOpinionsFormValues(initialData, false, REQUIRED_BOTH);

		expect(values.secondDeclaration).toBeUndefined();
	});

	it("starts empty without stored opinions", () => {
		const values = buildOpinionsFormValues(undefined, true, REQUIRED_BOTH);

		expect(values.firstDeclaration).toEqual({
			accuracyOpinion: undefined,
			accuracyDate: "",
			gapOpinion: null,
			gapDate: null,
		});
		expect(values.secondDeclaration).toEqual({
			accuracyOpinion: undefined,
			accuracyDate: "",
			gapOpinion: null,
			gapDate: null,
		});
	});
});

describe("normalizeSubmittedOpinions", () => {
	const data = {
		firstDeclaration: {
			...accuracy,
			gapOpinion: "favorable" as const,
			gapDate: "2026-01-16",
		},
		secondDeclaration: {
			...accuracy,
			gapOpinion: "unfavorable" as const,
			gapDate: "2026-02-16",
		},
	};

	it("keeps the justification opinions that are required", () => {
		expect(normalizeSubmittedOpinions(data, REQUIRED_BOTH)).toEqual(data);
	});

	it("clears only the justification opinion that is not required", () => {
		const normalized = normalizeSubmittedOpinions(data, {
			firstDeclJustificationRequired: true,
			secondDeclJustificationRequired: false,
		});

		expect(normalized.firstDeclaration).toEqual(data.firstDeclaration);
		expect(normalized.secondDeclaration).toEqual({
			...accuracy,
			...CLEARED_GAP_FIELDS,
		});
	});

	it("leaves the second declaration out when there is none", () => {
		const normalized = normalizeSubmittedOpinions(
			{ firstDeclaration: data.firstDeclaration },
			REQUIRED_NONE,
		);

		expect(normalized).toEqual({
			firstDeclaration: { ...accuracy, ...CLEARED_GAP_FIELDS },
			secondDeclaration: undefined,
		});
	});
});

describe("isJustificationOpinionIncomplete", () => {
	it.each([
		[{ ...accuracy, gapOpinion: null, gapDate: "2026-01-16" }],
		[{ ...accuracy, gapOpinion: "favorable" as const, gapDate: null }],
		[undefined],
	])("is true when a required opinion lacks its answer or date", (declaration) => {
		expect(isJustificationOpinionIncomplete(declaration, true)).toBe(true);
	});

	it("is false when the required opinion is complete", () => {
		expect(
			isJustificationOpinionIncomplete(
				{ ...accuracy, gapOpinion: "favorable", gapDate: "2026-01-16" },
				true,
			),
		).toBe(false);
	});

	it("is false when the opinion is not required", () => {
		expect(
			isJustificationOpinionIncomplete(
				{ ...accuracy, gapOpinion: null, gapDate: null },
				false,
			),
		).toBe(false);
	});
});

describe("hydrateOpinionsForm", () => {
	const draft = {
		firstDeclaration: {
			accuracyOpinion: "unfavorable" as const,
			accuracyDate: "2026-03-01",
			gapOpinion: "favorable" as const,
			gapDate: "2026-03-02",
		},
		secondDeclaration: {
			accuracyOpinion: "favorable" as const,
			accuracyDate: "2026-03-03",
			gapOpinion: "unfavorable" as const,
			gapDate: "2026-03-04",
		},
	};

	it("restores every drafted field when the justifications are required", () => {
		const setValue = vi.fn();

		hydrateOpinionsForm(setValue, draft, true, REQUIRED_BOTH);

		expect(setValue.mock.calls).toEqual([
			["firstDeclaration.accuracyOpinion", "unfavorable"],
			["firstDeclaration.accuracyDate", "2026-03-01"],
			["firstDeclaration.gapOpinion", "favorable"],
			["firstDeclaration.gapDate", "2026-03-02"],
			["secondDeclaration.accuracyOpinion", "favorable"],
			["secondDeclaration.accuracyDate", "2026-03-03"],
			["secondDeclaration.gapOpinion", "unfavorable"],
			["secondDeclaration.gapDate", "2026-03-04"],
		]);
	});

	it("clears a stale drafted justification that is no longer required", () => {
		const setValue = vi.fn();

		hydrateOpinionsForm(setValue, draft, true, {
			firstDeclJustificationRequired: false,
			secondDeclJustificationRequired: true,
		});

		expect(setValue).toHaveBeenCalledWith("firstDeclaration.gapOpinion", null);
		expect(setValue).toHaveBeenCalledWith("firstDeclaration.gapDate", null);
		expect(setValue).not.toHaveBeenCalledWith(
			"firstDeclaration.gapOpinion",
			"favorable",
		);
		expect(setValue).toHaveBeenCalledWith(
			"secondDeclaration.gapOpinion",
			"unfavorable",
		);
	});

	it("ignores a gapConsulted answer left in an older draft", () => {
		const setValue = vi.fn();
		const legacyDraft = {
			firstDeclaration: { ...draft.firstDeclaration, gapConsulted: false },
		};

		hydrateOpinionsForm(setValue, legacyDraft, false, REQUIRED_BOTH);

		expect(
			setValue.mock.calls.some(([field]) =>
				String(field).includes("Consulted"),
			),
		).toBe(false);
	});

	it("leaves the second declaration untouched when there is none", () => {
		const setValue = vi.fn();

		hydrateOpinionsForm(setValue, draft, false, REQUIRED_NONE);

		expect(
			setValue.mock.calls.some(([field]) =>
				String(field).startsWith("secondDeclaration"),
			),
		).toBe(false);
	});

	it("only clears unrequired fields when nothing was drafted", () => {
		const setValue = vi.fn();

		hydrateOpinionsForm(setValue, {}, true, REQUIRED_NONE);

		expect(setValue.mock.calls).toEqual([
			["firstDeclaration.gapOpinion", null],
			["firstDeclaration.gapDate", null],
			["secondDeclaration.gapOpinion", null],
			["secondDeclaration.gapDate", null],
		]);
	});
});
