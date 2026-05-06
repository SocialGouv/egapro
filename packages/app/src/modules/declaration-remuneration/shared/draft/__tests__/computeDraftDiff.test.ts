import { describe, expect, it } from "vitest";

import { computeDraftDiff } from "../computeDraftDiff";

describe("computeDraftDiff", () => {
	it("returns {} when all primitives are strictly equal", () => {
		const current = { a: 1, b: "x", c: true };
		const db = { a: 1, b: "x", c: true };
		expect(computeDraftDiff(current, db)).toEqual({});
	});

	it("includes only the differing primitive in the diff", () => {
		const current = { a: 1, b: "x" };
		const db = { a: 2, b: "x" };
		expect(computeDraftDiff(current, db)).toEqual({ a: 1 });
	});

	it("returns {} for arrays of objects with identical content", () => {
		const current = { categories: [{ name: "A", count: 3 }] };
		const db = { categories: [{ name: "A", count: 3 }] };
		expect(computeDraftDiff(current, db)).toEqual({});
	});

	it("keeps the entire array when one cell differs", () => {
		const current = {
			categories: [
				{ name: "A", count: 3 },
				{ name: "B", count: 7 },
			],
		};
		const db = {
			categories: [
				{ name: "A", count: 3 },
				{ name: "B", count: 5 },
			],
		};
		expect(computeDraftDiff(current, db)).toEqual({
			categories: current.categories,
		});
	});

	it("keeps the entire array when length differs", () => {
		const current = { items: [1, 2, 3] };
		const db = { items: [1, 2] };
		expect(computeDraftDiff(current, db)).toEqual({ items: [1, 2, 3] });
	});

	it("returns {} for nested objects with identical content", () => {
		const current = { meta: { a: 1, b: { c: 2 } } };
		const db = { meta: { a: 1, b: { c: 2 } } };
		expect(computeDraftDiff(current, db)).toEqual({});
	});

	it("includes a differing nested object", () => {
		const current = { meta: { a: 1, b: { c: 2 } } };
		const db = { meta: { a: 1, b: { c: 3 } } };
		expect(computeDraftDiff(current, db)).toEqual({ meta: current.meta });
	});

	it("treats null and undefined as equal", () => {
		const current: Record<string, unknown> = { a: null, b: undefined };
		const db: Record<string, unknown> = { a: undefined, b: null };
		expect(computeDraftDiff(current, db)).toEqual({});
	});

	it("treats null vs primitive as different", () => {
		const current: Record<string, unknown> = { a: 0 };
		const db: Record<string, unknown> = { a: null };
		expect(computeDraftDiff(current, db)).toEqual({ a: 0 });
	});

	it("treats array vs object as different", () => {
		const current: Record<string, unknown> = { x: [] };
		const db: Record<string, unknown> = { x: {} };
		expect(computeDraftDiff(current, db)).toEqual({ x: [] });
	});

	it("detects difference when nested object key sets differ", () => {
		const current: Record<string, unknown> = { meta: { a: 1, b: 2 } };
		const db: Record<string, unknown> = { meta: { a: 1 } };
		expect(computeDraftDiff(current, db)).toEqual({ meta: { a: 1, b: 2 } });
	});

	it("detects difference when same key count but distinct keys", () => {
		const current: Record<string, unknown> = { meta: { a: 1, b: 2 } };
		const db: Record<string, unknown> = { meta: { a: 1, c: 2 } };
		expect(computeDraftDiff(current, db)).toEqual({ meta: { a: 1, b: 2 } });
	});
});
