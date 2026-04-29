import { describe, expect, it } from "vitest";
import { updateStep4Schema } from "../schemas";

function makeTable(
	q1: { threshold?: string; women?: number; men?: number },
	q2: { threshold?: string; women?: number; men?: number },
	q3: { threshold?: string; women?: number; men?: number },
	q4: { threshold?: string; women?: number; men?: number },
) {
	return [q1, q2, q3, q4] as [typeof q1, typeof q2, typeof q3, typeof q4];
}

const validTable = makeTable(
	{ threshold: "10000", women: 2, men: 3 },
	{ threshold: "20000", women: 4, men: 5 },
	{ threshold: "30000", women: 6, men: 7 },
	{ women: 8, men: 9 },
);

describe("updateStep4Schema", () => {
	it("accepts valid data with 3 strictly increasing thresholds and Q4 without threshold", () => {
		const result = updateStep4Schema.safeParse({
			annual: validTable,
			hourly: validTable,
		});
		expect(result.success).toBe(true);
	});

	it("rejects when a Q1-Q3 threshold is empty string", () => {
		const table = makeTable(
			{ threshold: "", women: 1, men: 1 },
			{ threshold: "20000", women: 1, men: 1 },
			{ threshold: "30000", women: 1, men: 1 },
			{ women: 1, men: 1 },
		);
		const result = updateStep4Schema.safeParse({
			annual: table,
			hourly: table,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const messages = result.error.issues.map((i) => i.message);
			expect(messages).toContain("Le seuil est obligatoire");
		}
	});

	it("rejects when thresholds are not strictly increasing", () => {
		const table = makeTable(
			{ threshold: "30000", women: 1, men: 1 },
			{ threshold: "25000", women: 1, men: 1 },
			{ threshold: "40000", women: 1, men: 1 },
			{ women: 1, men: 1 },
		);
		const result = updateStep4Schema.safeParse({
			annual: table,
			hourly: table,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const messages = result.error.issues.map((i) => i.message);
			expect(messages).toContain(
				"Les seuils doivent être strictement croissants",
			);
		}
	});

	it("rejects when two thresholds are equal", () => {
		const table = makeTable(
			{ threshold: "20000", women: 1, men: 1 },
			{ threshold: "20000", women: 1, men: 1 },
			{ threshold: "30000", women: 1, men: 1 },
			{ women: 1, men: 1 },
		);
		const result = updateStep4Schema.safeParse({
			annual: table,
			hourly: table,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const messages = result.error.issues.map((i) => i.message);
			expect(messages).toContain(
				"Les seuils doivent être strictement croissants",
			);
		}
	});

	it("rejects when Q4 has a threshold present", () => {
		const table = makeTable(
			{ threshold: "10000", women: 1, men: 1 },
			{ threshold: "20000", women: 1, men: 1 },
			{ threshold: "30000", women: 1, men: 1 },
			{ threshold: "50000", women: 1, men: 1 },
		);
		const result = updateStep4Schema.safeParse({
			annual: table,
			hourly: table,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const messages = result.error.issues.map((i) => i.message);
			expect(messages).toContain("Le 4ème quartile ne doit pas avoir de seuil");
		}
	});

	it("rejects when women count is negative", () => {
		const table = makeTable(
			{ threshold: "10000", women: -1, men: 1 },
			{ threshold: "20000", women: 1, men: 1 },
			{ threshold: "30000", women: 1, men: 1 },
			{ women: 1, men: 1 },
		);
		const result = updateStep4Schema.safeParse({
			annual: table,
			hourly: table,
		});
		expect(result.success).toBe(false);
	});

	it("rejects when tuple has wrong length (3 elements instead of 4)", () => {
		const shortTable = [
			{ threshold: "10000", women: 1, men: 1 },
			{ threshold: "20000", women: 1, men: 1 },
			{ threshold: "30000", women: 1, men: 1 },
		];
		const result = updateStep4Schema.safeParse({
			annual: shortTable,
			hourly: shortTable,
		});
		expect(result.success).toBe(false);
	});
});
