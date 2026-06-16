import { describe, expect, it } from "vitest";

import { formatFileSize } from "../uploadConfig";

describe("formatFileSize", () => {
	it("formats bytes under 1 Mo as a French Ko label", () => {
		expect(formatFileSize(63365)).toBe("61,88 Ko");
	});

	it("formats bytes of 1 Mo and above as a French Mo label", () => {
		expect(formatFileSize(5 * 1024 * 1024)).toBe("5 Mo");
		expect(formatFileSize(1024 * 1024 + 512 * 1024)).toBe("1,5 Mo");
	});

	it("returns null for unknown or negative sizes", () => {
		expect(formatFileSize(null)).toBeNull();
		expect(formatFileSize(-1)).toBeNull();
	});
});
