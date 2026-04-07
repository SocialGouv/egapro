import { describe, expect, it } from "vitest";
import { getCurrentYear } from "~/modules/domain";
import { exportFilesQuerySchema } from "../schemas";

describe("exportFilesQuerySchema", () => {
	it("accepts a valid siren and year", () => {
		const result = exportFilesQuerySchema.safeParse({
			siren: "123456789",
			year: "2025",
		});
		expect(result.success).toBe(true);
	});

	it("rejects a year above getCurrentYear() + 1", () => {
		const futureYear = String(getCurrentYear() + 2);
		const result = exportFilesQuerySchema.safeParse({
			siren: "123456789",
			year: futureYear,
		});
		expect(result.success).toBe(false);
	});

	it("rejects a year below FIRST_DECLARATION_YEAR", () => {
		const result = exportFilesQuerySchema.safeParse({
			siren: "123456789",
			year: "2017",
		});
		expect(result.success).toBe(false);
	});

	it("accepts getCurrentYear() + 1 as max valid year", () => {
		const maxYear = String(getCurrentYear() + 1);
		const result = exportFilesQuerySchema.safeParse({
			siren: "123456789",
			year: maxYear,
		});
		expect(result.success).toBe(true);
	});

	it("rejects an invalid siren", () => {
		const result = exportFilesQuerySchema.safeParse({
			siren: "12345",
			year: "2025",
		});
		expect(result.success).toBe(false);
	});
});
