import { describe, expect, it } from "vitest";

import { buildDeclarationList } from "../buildDeclarationList";

const SIREN = "532847196";

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
			},
			{
				type: "representation",
				siren: SIREN,
				year: 2026,
				status: "to_complete",
				currentStep: 0,
				updatedAt: null,
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
					currentStep: 3,
					updatedAt,
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
			currentStep: 3,
			updatedAt,
		});
		expect(result[1]).toMatchObject({
			type: "representation",
			year: 2026,
			status: "to_complete",
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
					currentStep: 6,
					updatedAt: updatedAt2025,
				},
			],
			2026,
		);

		expect(result).toHaveLength(3);
		expect(result[0]).toMatchObject({
			type: "remuneration",
			year: 2026,
			status: "to_complete",
		});
		expect(result[1]).toMatchObject({
			type: "representation",
			year: 2026,
			status: "to_complete",
		});
		expect(result[2]).toMatchObject({
			year: 2025,
			status: "done",
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
					currentStep: 6,
					updatedAt: null,
				},
				{
					type: "remuneration",
					year: 2025,
					status: "done",
					currentStep: 6,
					updatedAt: null,
				},
				{
					type: "remuneration",
					year: 2024,
					status: "done",
					currentStep: 6,
					updatedAt: null,
				},
			],
			2026,
		);

		expect(result).toHaveLength(5);
		expect(result[0]!.year).toBe(2026);
		expect(result[1]!.year).toBe(2026);
		expect(result[2]!.year).toBe(2025);
		expect(result[3]!.year).toBe(2024);
		expect(result[4]!.year).toBe(2023);
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
					currentStep: 6,
					updatedAt,
				},
				{
					type: "remuneration",
					year: 2025,
					status: "done",
					currentStep: 6,
					updatedAt: null,
				},
			],
			2026,
		);

		expect(result).toHaveLength(3);
		expect(result[0]).toMatchObject({
			type: "remuneration",
			year: 2026,
			status: "done",
		});
		expect(result[1]).toMatchObject({
			type: "representation",
			year: 2026,
			status: "to_complete",
		});
		expect(result[2]).toMatchObject({
			type: "remuneration",
			year: 2025,
			status: "done",
		});
	});
});
