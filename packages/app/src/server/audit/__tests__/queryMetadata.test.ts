import { describe, expect, it } from "vitest";
import {
	AUDIT_LIST_MAX_ITEMS,
	AUDIT_TEXT_MAX_LENGTH,
	auditList,
	auditQueryMetadata,
	auditText,
} from "../queryMetadata";

describe("auditText", () => {
	it("keeps a short value as is", () => {
		expect(auditText("acme")).toBe("acme");
	});

	it("bounds a long value", () => {
		expect(auditText("x".repeat(5_000))).toHaveLength(AUDIT_TEXT_MAX_LENGTH);
	});

	it("maps a missing value to null", () => {
		expect(auditText(undefined)).toBeNull();
	});
});

describe("auditList", () => {
	it("keeps a short list as is", () => {
		expect(auditList(["11", "75"])).toEqual(["11", "75"]);
	});

	it("bounds the number of items and the length of each", () => {
		const list = auditList(Array.from({ length: 500 }, () => "y".repeat(500)));

		expect(list).toHaveLength(AUDIT_LIST_MAX_ITEMS);
		for (const item of list) {
			expect(item.length).toBeLessThanOrEqual(AUDIT_TEXT_MAX_LENGTH);
		}
	});

	it("maps a missing list to an empty one", () => {
		expect(auditList(undefined)).toEqual([]);
	});
});

describe("auditQueryMetadata", () => {
	it("projects a successful parse", () => {
		expect(
			auditQueryMetadata({ success: true, data: { year: 2027 } }, (data) => ({
				year: data.year,
			})),
		).toEqual({ year: 2027 });
	});

	it("names the first invalid parameter instead of echoing the input", () => {
		expect(
			auditQueryMetadata(
				{ success: false, error: { issues: [{ path: ["year"] }] } },
				() => ({ never: true }),
			),
		).toEqual({ invalidParam: "year" });
	});

	it("names a nested invalid parameter by its top-level key", () => {
		expect(
			auditQueryMetadata(
				{ success: false, error: { issues: [{ path: ["region", 3] }] } },
				() => ({}),
			),
		).toEqual({ invalidParam: "region" });
	});

	it("falls back on a generic marker when the issue has no path", () => {
		expect(
			auditQueryMetadata(
				{ success: false, error: { issues: [{ path: [] }] } },
				() => ({}),
			),
		).toEqual({ invalidParam: "query" });
	});
});
