import { describe, expect, it } from "vitest";
import type { QuartileTuple } from "~/modules/declaration-remuneration";
import {
	coherenceWarningLabel,
	deriveCoherenceWarnings,
	deriveErrors,
	hasAnyError,
	type QuartileReferences,
} from "../quartileErrors";

function table(
	women: Array<number | undefined>,
	men: Array<number | undefined>,
): QuartileTuple {
	return [0, 1, 2, 3].map((i) => ({
		threshold: i === 3 ? undefined : "1",
		women: women[i],
		men: men[i],
	})) as QuartileTuple;
}

/** A table whose 8 cells and 3 thresholds are all valid (passes deriveErrors). */
function validTable(
	women: [number, number, number, number],
	men: [number, number, number, number],
): QuartileTuple {
	return [
		{ threshold: "10", women: women[0], men: men[0] },
		{ threshold: "20", women: women[1], men: men[1] },
		{ threshold: "30", women: women[2], men: men[2] },
		{ threshold: undefined, women: women[3], men: men[3] },
	];
}

const NO_REFERENCE: QuartileReferences = {
	annual: {},
	hourly: {},
};

describe("deriveCoherenceWarnings", () => {
	it("warns when the annual sum differs from the annual reference", () => {
		const values = {
			annual: table([10, 10, 10, 10], [5, 5, 5, 5]),
			hourly: table([1, 1, 1, 1], [1, 1, 1, 1]),
		};
		const references: QuartileReferences = {
			annual: { women: 37, men: 33 },
			hourly: { women: 4, men: 4 },
		};
		const warnings = deriveCoherenceWarnings(values, references);
		expect(warnings).toContainEqual({
			table: "annual",
			field: "women",
			expected: 37,
			total: 40,
		});
		expect(warnings).toContainEqual({
			table: "annual",
			field: "men",
			expected: 33,
			total: 20,
		});
	});

	it("warns when the hourly sum differs from the hourly reference", () => {
		const values = {
			annual: table([9, 9, 9, 10], [8, 8, 8, 9]),
			hourly: table([10, 10, 10, 10], [8, 8, 8, 8]),
		};
		const references: QuartileReferences = {
			annual: { women: 37, men: 33 },
			hourly: { women: 34, men: 32 },
		};
		const warnings = deriveCoherenceWarnings(values, references);
		// hourly women 40 ≠ 34, hourly men 32 === 32 (no warning)
		expect(warnings).toContainEqual({
			table: "hourly",
			field: "women",
			expected: 34,
			total: 40,
		});
		expect(
			warnings.some((w) => w.table === "hourly" && w.field === "men"),
		).toBe(false);
	});

	it("never compares the annual and hourly totals to each other", () => {
		// Each table matches its own reference; the two totals differ (37 vs 34)
		// but that cross-table difference must NOT raise a warning.
		const values = {
			annual: validTable([10, 9, 9, 9], [9, 8, 8, 8]),
			hourly: validTable([9, 9, 8, 8], [8, 8, 8, 8]),
		};
		const references: QuartileReferences = {
			annual: { women: 37, men: 33 },
			hourly: { women: 34, men: 32 },
		};
		expect(deriveCoherenceWarnings(values, references)).toEqual([]);
	});

	it("raises no warning when a reference is undefined", () => {
		const values = {
			annual: table([10, 10, 10, 10], [5, 5, 5, 5]),
			hourly: table([10, 10, 10, 10], [5, 5, 5, 5]),
		};
		expect(deriveCoherenceWarnings(values, NO_REFERENCE)).toEqual([]);
	});

	it("raises no warning when the cells are only partially filled", () => {
		const values = {
			annual: table([10, undefined, 10, 10], [5, 5, 5, 5]),
			hourly: table([1, 1, 1, 1], [1, 1, 1, 1]),
		};
		const references: QuartileReferences = {
			annual: { women: 37, men: 20 },
			hourly: { women: 4, men: 4 },
		};
		const warnings = deriveCoherenceWarnings(values, references);
		// annual women incomplete → skipped; annual men complete and matches 20
		expect(
			warnings.some((w) => w.table === "annual" && w.field === "women"),
		).toBe(false);
	});
});

describe("coherenceWarningLabel", () => {
	it("names the table and the reference for a women warning", () => {
		expect(
			coherenceWarningLabel({
				table: "annual",
				field: "women",
				expected: 37,
				total: 40,
			}),
		).toBe(
			"Le total des effectifs de femmes saisis pour la rémunération annuelle (40) ne correspond pas à l'effectif de référence (37).",
		);
	});

	it("names the table and the reference for a men warning", () => {
		expect(
			coherenceWarningLabel({
				table: "hourly",
				field: "men",
				expected: 32,
				total: 30,
			}),
		).toBe(
			"Le total des effectifs d'hommes saisis pour la rémunération horaire (30) ne correspond pas à l'effectif de référence (32).",
		);
	});
});

describe("coherence warnings never block submission", () => {
	it("keeps deriveErrors/hasAnyError clean when only the coherence sums differ", () => {
		const values = {
			annual: validTable([10, 10, 10, 10], [5, 5, 5, 5]),
			hourly: validTable([10, 10, 10, 10], [5, 5, 5, 5]),
		};
		const references: QuartileReferences = {
			annual: { women: 37, men: 33 },
			hourly: { women: 34, men: 32 },
		};
		// Coherence mismatch present…
		expect(deriveCoherenceWarnings(values, references).length).toBeGreaterThan(
			0,
		);
		// …but the blocking validation is unaffected (form stays submittable).
		expect(hasAnyError(deriveErrors(values))).toBe(false);
	});
});
