import { describe, expect, it } from "vitest";
import type { QuartileTuple } from "~/modules/declaration-remuneration";
import {
	type CoherenceError,
	coherenceErrorLabel,
	deriveCoherenceErrors,
	type QuartileReferences,
} from "../quartileCoherence";
import { deriveErrors, hasAnyError } from "../quartileErrors";

type Counts = [
	number | undefined,
	number | undefined,
	number | undefined,
	number | undefined,
];

/** A table whose 3 thresholds are valid, so only the counts drive the outcome. */
function table(women: Counts, men: Counts): QuartileTuple {
	return [
		{ threshold: "10", women: women[0], men: men[0] },
		{ threshold: "20", women: women[1], men: men[1] },
		{ threshold: "30", women: women[2], men: men[2] },
		{ threshold: undefined, women: women[3], men: men[3] },
	];
}

/**
 * Step 1 headcount, one pair per pay basis (#4247): 37/33 on the annual base,
 * 34/32 on the hourly one. Distinct on purpose — a table held to the other
 * basis' reference would show up here.
 */
const STEP1_REFERENCES: QuartileReferences = {
	annual: { women: 37, men: 33 },
	hourly: { women: 34, men: 32 },
};

/** Columns summing exactly to the annual reference. */
const MATCHING_WOMEN: Counts = [10, 9, 9, 9];
const MATCHING_MEN: Counts = [9, 8, 8, 8];

/** Columns summing exactly to the hourly reference. */
const HOURLY_MATCHING_WOMEN: Counts = [9, 9, 8, 8];
const HOURLY_MATCHING_MEN: Counts = [8, 8, 8, 8];

describe("deriveCoherenceErrors", () => {
	it("flags only the annual table when the hourly one matches the reference", () => {
		const values = {
			annual: table([10, 10, 10, 10], MATCHING_MEN),
			hourly: table(HOURLY_MATCHING_WOMEN, HOURLY_MATCHING_MEN),
		};
		expect(deriveCoherenceErrors(values, STEP1_REFERENCES)).toEqual([
			{ table: "annual", field: "women", expected: 37, total: 40 },
		]);
	});

	it("flags only the hourly table when the annual one matches the reference", () => {
		const values = {
			annual: table(MATCHING_WOMEN, MATCHING_MEN),
			hourly: table(HOURLY_MATCHING_WOMEN, [8, 8, 7, 7]),
		};
		expect(deriveCoherenceErrors(values, STEP1_REFERENCES)).toEqual([
			{ table: "hourly", field: "men", expected: 32, total: 30 },
		]);
	});

	it("flags both columns of a table when both diverge", () => {
		const values = {
			annual: table([10, 10, 10, 10], [5, 5, 5, 5]),
			hourly: table(HOURLY_MATCHING_WOMEN, HOURLY_MATCHING_MEN),
		};
		expect(deriveCoherenceErrors(values, STEP1_REFERENCES)).toEqual([
			{ table: "annual", field: "women", expected: 37, total: 40 },
			{ table: "annual", field: "men", expected: 33, total: 20 },
		]);
	});

	it("flags all four columns when both tables diverge on both sexes", () => {
		const values = {
			annual: table([10, 10, 10, 10], [5, 5, 5, 5]),
			hourly: table([1, 1, 1, 1], [2, 2, 2, 2]),
		};
		expect(deriveCoherenceErrors(values, STEP1_REFERENCES)).toEqual([
			{ table: "annual", field: "women", expected: 37, total: 40 },
			{ table: "annual", field: "men", expected: 33, total: 20 },
			{ table: "hourly", field: "women", expected: 34, total: 4 },
			{ table: "hourly", field: "men", expected: 32, total: 8 },
		]);
	});

	it("returns no error when both tables match the reference", () => {
		const values = {
			annual: table(MATCHING_WOMEN, MATCHING_MEN),
			hourly: table(HOURLY_MATCHING_WOMEN, HOURLY_MATCHING_MEN),
		};
		expect(deriveCoherenceErrors(values, STEP1_REFERENCES)).toEqual([]);
	});

	it("holds each table to its own pay basis, never to the other one", () => {
		// The hourly table carries the annual headcount (37/33) instead of its own.
		const values = {
			annual: table(MATCHING_WOMEN, MATCHING_MEN),
			hourly: table(MATCHING_WOMEN, MATCHING_MEN),
		};
		expect(deriveCoherenceErrors(values, STEP1_REFERENCES)).toEqual([
			{ table: "hourly", field: "women", expected: 34, total: 37 },
			{ table: "hourly", field: "men", expected: 32, total: 33 },
		]);
	});

	it("returns no error when the reference is unknown on both sexes", () => {
		const values = {
			annual: table([10, 10, 10, 10], [5, 5, 5, 5]),
			hourly: table([10, 10, 10, 10], [5, 5, 5, 5]),
		};
		expect(deriveCoherenceErrors(values, { annual: {}, hourly: {} })).toEqual(
			[],
		);
	});

	it("controls only the sex whose reference is known", () => {
		const values = {
			annual: table([10, 10, 10, 10], [5, 5, 5, 5]),
			hourly: table(HOURLY_MATCHING_WOMEN, [5, 5, 5, 5]),
		};
		expect(
			deriveCoherenceErrors(values, {
				annual: { women: 37 },
				hourly: {},
			}),
		).toEqual([{ table: "annual", field: "women", expected: 37, total: 40 }]);
	});

	it("returns no error while a column is still incomplete", () => {
		const values = {
			annual: table([10, undefined, 10, 10], MATCHING_MEN),
			hourly: table(HOURLY_MATCHING_WOMEN, HOURLY_MATCHING_MEN),
		};
		expect(deriveCoherenceErrors(values, STEP1_REFERENCES)).toEqual([]);
	});

	it("still flags the complete column of a partially filled table", () => {
		const values = {
			annual: table([10, undefined, 10, 10], [5, 5, 5, 5]),
			hourly: table(HOURLY_MATCHING_WOMEN, HOURLY_MATCHING_MEN),
		};
		expect(deriveCoherenceErrors(values, STEP1_REFERENCES)).toEqual([
			{ table: "annual", field: "men", expected: 33, total: 20 },
		]);
	});

	it("returns no error when a matching total is zero on both sexes", () => {
		const values = {
			annual: table([0, 0, 0, 0], [0, 0, 0, 0]),
			hourly: table([0, 0, 0, 0], [0, 0, 0, 0]),
		};
		expect(
			deriveCoherenceErrors(values, {
				annual: { women: 0, men: 0 },
				hourly: { women: 0, men: 0 },
			}),
		).toEqual([]);
	});
});

describe("coherenceErrorLabel", () => {
	it.each([
		[
			"annual" as const,
			"women" as const,
			37,
			"Le nombre total de femmes renseigné ne correspond pas au nombre indiqué dans le tableau « Effectifs physiques pris en compte pour le calcul des indicateurs » (nombre total annuel : 37).",
		],
		[
			"annual" as const,
			"men" as const,
			33,
			"Le nombre total d'hommes renseigné ne correspond pas au nombre indiqué dans le tableau « Effectifs physiques pris en compte pour le calcul des indicateurs » (nombre total annuel : 33).",
		],
		[
			"hourly" as const,
			"women" as const,
			37,
			"Le nombre total de femmes renseigné ne correspond pas au nombre indiqué dans le tableau « Effectifs physiques pris en compte pour le calcul des indicateurs » (nombre total horaire : 37).",
		],
		[
			"hourly" as const,
			"men" as const,
			33,
			"Le nombre total d'hommes renseigné ne correspond pas au nombre indiqué dans le tableau « Effectifs physiques pris en compte pour le calcul des indicateurs » (nombre total horaire : 33).",
		],
	])("names the sex and the %s table reference for %s", (t, field, expected, label) => {
		const error: CoherenceError = { table: t, field, expected, total: 99 };
		expect(coherenceErrorLabel(error)).toBe(label);
	});
});

describe("coherence versus per-field validation", () => {
	it("leaves the per-field validation clean when only the totals diverge", () => {
		const values = {
			annual: table([10, 10, 10, 10], [5, 5, 5, 5]),
			hourly: table([10, 10, 10, 10], [5, 5, 5, 5]),
		};
		expect(deriveCoherenceErrors(values, STEP1_REFERENCES).length).toBe(4);
		// The two axes stay independent: blocking the submit is the form's job,
		// which is why `deriveErrors` reports nothing here.
		expect(hasAnyError(deriveErrors(values))).toBe(false);
	});
});
