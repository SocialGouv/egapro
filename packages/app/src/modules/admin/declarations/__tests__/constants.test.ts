import { describe, expect, it } from "vitest";

import { formatDate, formatDateTime, STATUS_LABELS } from "../shared/constants";

describe("STATUS_LABELS", () => {
	it("maps draft to Brouillon", () => {
		expect(STATUS_LABELS.draft).toBe("Brouillon");
	});

	it("maps submitted to Transmise", () => {
		expect(STATUS_LABELS.submitted).toBe("Transmise");
	});
});

describe("formatDate", () => {
	it("formats a date in French locale", () => {
		const result = formatDate(new Date("2024-06-15T10:00:00Z"));
		expect(result).toBe("15/06/2024");
	});

	it("returns dash for null", () => {
		expect(formatDate(null)).toBe("—");
	});

	it("returns dash for undefined", () => {
		expect(formatDate(undefined)).toBe("—");
	});
});

describe("formatDateTime", () => {
	it("formats a date with time in French locale", () => {
		const result = formatDateTime(new Date("2024-06-15T10:30:00Z"));
		expect(result).toMatch(/15\/06\/2024/);
		expect(result).toMatch(/\d{2}:\d{2}/);
	});

	it("returns dash for null", () => {
		expect(formatDateTime(null)).toBe("—");
	});
});
