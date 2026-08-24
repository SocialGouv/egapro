import { describe, expect, it } from "vitest";

import { buildDeclarationList } from "../buildDeclarationList";

const SIREN = "532847196";
const EMPTY_DECLARATION = {
	firstDeclarationPathChoice: null,
	secondDeclarationPathChoice: null,
	hasSubmittedSecondDeclaration: false,
	hasSubmittedCseOpinion: false,
	cseRequired: false,
	hasJointEvaluationFile: false,
	hasPrefillData: false,
};
const PLACEHOLDER_ROW = { ...EMPTY_DECLARATION, fsmStatus: null };

describe("buildDeclarationList", () => {
	it("returns two rows (remuneration + representation) for the current year when no DB records exist", () => {
		const result = buildDeclarationList(SIREN, [], 2026);

		expect(result).toEqual([
			{
				type: "remuneration",
				siren: SIREN,
				year: 2026,
				status: "to_complete",
				currentStep: 0,
				updatedAt: null,
				...PLACEHOLDER_ROW,
			},
			{
				type: "representation",
				siren: SIREN,
				year: 2026,
				status: "to_complete",
				currentStep: 0,
				updatedAt: null,
				...PLACEHOLDER_ROW,
			},
		]);
	});

	it("uses DB data for remuneration when a record exists for the current year", () => {
		const updatedAt = new Date("2026-02-15");
		const result = buildDeclarationList(
			SIREN,
			[
				{
					type: "remuneration",
					year: 2026,
					status: "in_progress",
					fsmStatus: "draft",
					currentStep: 3,
					updatedAt,
					...EMPTY_DECLARATION,
				},
			],
			2026,
		);

		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({
			type: "remuneration",
			siren: SIREN,
			year: 2026,
			status: "in_progress",
			fsmStatus: "draft",
			currentStep: 3,
			updatedAt,
			...EMPTY_DECLARATION,
		});
		expect(result[1]).toMatchObject({
			type: "representation",
			year: 2026,
			status: "to_complete",
			fsmStatus: null,
		});
	});

	it("includes previous year DB records after current year rows", () => {
		const updatedAt2025 = new Date("2025-06-01");
		const result = buildDeclarationList(
			SIREN,
			[
				{
					type: "remuneration",
					year: 2025,
					status: "done",
					fsmStatus: "demarche_completed",
					currentStep: 6,
					updatedAt: updatedAt2025,
					...EMPTY_DECLARATION,
				},
			],
			2026,
		);

		expect(result).toHaveLength(3);
		expect(result[0]).toMatchObject({
			type: "remuneration",
			year: 2026,
			status: "to_complete",
			fsmStatus: null,
		});
		expect(result[1]).toMatchObject({
			type: "representation",
			year: 2026,
			status: "to_complete",
			fsmStatus: null,
		});
		expect(result[2]).toMatchObject({
			year: 2025,
			status: "done",
			fsmStatus: "demarche_completed",
			updatedAt: updatedAt2025,
		});
	});

	it("sorts previous year records by year descending", () => {
		const result = buildDeclarationList(
			SIREN,
			[
				{
					type: "remuneration",
					year: 2023,
					status: "done",
					fsmStatus: "demarche_completed",
					currentStep: 6,
					updatedAt: null,
					...EMPTY_DECLARATION,
				},
				{
					type: "remuneration",
					year: 2025,
					status: "done",
					fsmStatus: "demarche_completed",
					currentStep: 6,
					updatedAt: null,
					...EMPTY_DECLARATION,
				},
				{
					type: "remuneration",
					year: 2024,
					status: "done",
					fsmStatus: "demarche_completed",
					currentStep: 6,
					updatedAt: null,
					...EMPTY_DECLARATION,
				},
			],
			2026,
		);

		expect(result).toHaveLength(5);
		expect(result[0]?.year).toBe(2026);
		expect(result[1]?.year).toBe(2026);
		expect(result[2]?.year).toBe(2025);
		expect(result[3]?.year).toBe(2024);
		expect(result[4]?.year).toBe(2023);
	});

	it("merges current year DB record with expected types", () => {
		const updatedAt = new Date("2026-01-10");
		const result = buildDeclarationList(
			SIREN,
			[
				{
					type: "remuneration",
					year: 2026,
					status: "done",
					fsmStatus: "awaiting_compliance_path_choice",
					currentStep: 6,
					updatedAt,
					...EMPTY_DECLARATION,
				},
				{
					type: "remuneration",
					year: 2025,
					status: "done",
					fsmStatus: "demarche_completed",
					currentStep: 6,
					updatedAt: null,
					...EMPTY_DECLARATION,
				},
			],
			2026,
		);

		expect(result).toHaveLength(3);
		expect(result[0]).toMatchObject({
			type: "remuneration",
			year: 2026,
			status: "done",
			fsmStatus: "awaiting_compliance_path_choice",
		});
		expect(result[1]).toMatchObject({
			type: "representation",
			year: 2026,
			status: "to_complete",
			fsmStatus: null,
		});
		expect(result[2]).toMatchObject({
			type: "remuneration",
			year: 2025,
			status: "done",
			fsmStatus: "demarche_completed",
		});
	});

	it("emits the representation row when visibility is explicitly granted", () => {
		const result = buildDeclarationList(SIREN, [], 2026, new Set(), true);

		expect(result.map((r) => r.type)).toEqual([
			"remuneration",
			"representation",
		]);
	});

	it("omits the current year representation row when visibility is denied", () => {
		const result = buildDeclarationList(SIREN, [], 2026, new Set(), false);

		expect(result).toEqual([
			{
				type: "remuneration",
				siren: SIREN,
				year: 2026,
				status: "to_complete",
				currentStep: 0,
				updatedAt: null,
				...PLACEHOLDER_ROW,
			},
		]);
	});

	it("keeps the remuneration prefill flag when representation is hidden", () => {
		const result = buildDeclarationList(
			SIREN,
			[],
			2026,
			new Set([2026]),
			false,
		);

		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			type: "remuneration",
			hasPrefillData: true,
		});
	});

	it("keeps an existing representation draft visible when visibility is denied", () => {
		const updatedAt = new Date("2026-03-02");
		const result = buildDeclarationList(
			SIREN,
			[
				{
					type: "representation",
					year: 2026,
					status: "in_progress",
					fsmStatus: "draft",
					currentStep: 2,
					updatedAt,
					...EMPTY_DECLARATION,
				},
			],
			2026,
			new Set(),
			false,
		);

		expect(result).toHaveLength(2);
		expect(result[1]).toEqual({
			type: "representation",
			siren: SIREN,
			year: 2026,
			status: "in_progress",
			fsmStatus: "draft",
			currentStep: 2,
			updatedAt,
			...EMPTY_DECLARATION,
		});
	});

	it("keeps a submitted representation declaration visible when visibility is denied", () => {
		const result = buildDeclarationList(
			SIREN,
			[
				{
					type: "representation",
					year: 2026,
					status: "done",
					fsmStatus: "demarche_completed",
					currentStep: 6,
					updatedAt: null,
					...EMPTY_DECLARATION,
				},
			],
			2026,
			new Set(),
			false,
		);

		expect(result).toHaveLength(2);
		expect(result[1]).toMatchObject({
			type: "representation",
			year: 2026,
			status: "done",
			fsmStatus: "demarche_completed",
		});
	});

	it("keeps previous year representation declarations visible when visibility is denied", () => {
		const result = buildDeclarationList(
			SIREN,
			[
				{
					type: "representation",
					year: 2025,
					status: "done",
					fsmStatus: "demarche_completed",
					currentStep: 6,
					updatedAt: null,
					...EMPTY_DECLARATION,
				},
			],
			2026,
			new Set(),
			false,
		);

		expect(result).toHaveLength(2);
		expect(result[0]).toMatchObject({ type: "remuneration", year: 2026 });
		expect(result[1]).toMatchObject({
			type: "representation",
			year: 2025,
			status: "done",
		});
	});

	it("propagates cseRequired from DB records", () => {
		const result = buildDeclarationList(
			SIREN,
			[
				{
					type: "remuneration",
					year: 2026,
					status: "done",
					fsmStatus: "awaiting_cse_opinion",
					currentStep: 6,
					updatedAt: null,
					...EMPTY_DECLARATION,
					cseRequired: true,
				},
			],
			2026,
		);

		expect(result[0]).toMatchObject({
			type: "remuneration",
			year: 2026,
			fsmStatus: "awaiting_cse_opinion",
			cseRequired: true,
		});
	});
});
