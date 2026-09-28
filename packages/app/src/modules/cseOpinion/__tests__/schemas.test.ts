import { describe, expect, it } from "vitest";
import { setFileContentTypesSchema } from "../schemas";

describe("setFileContentTypesSchema", () => {
	it("accepts a valid set of associations", () => {
		const result = setFileContentTypesSchema.safeParse({
			associations: [
				{ declarationNumber: 1, type: "accuracy", fileId: "file-1" },
				{ declarationNumber: 2, type: "gap", fileId: "file-2" },
			],
		});

		expect(result.success).toBe(true);
	});

	it("accepts an empty associations array", () => {
		const result = setFileContentTypesSchema.safeParse({ associations: [] });

		expect(result.success).toBe(true);
	});

	it("rejects a declarationNumber below 1", () => {
		const result = setFileContentTypesSchema.safeParse({
			associations: [{ declarationNumber: 0, type: "accuracy", fileId: "f" }],
		});

		expect(result.success).toBe(false);
	});

	it("rejects a declarationNumber above 2", () => {
		const result = setFileContentTypesSchema.safeParse({
			associations: [{ declarationNumber: 3, type: "accuracy", fileId: "f" }],
		});

		expect(result.success).toBe(false);
	});

	it("rejects a non-integer declarationNumber", () => {
		const result = setFileContentTypesSchema.safeParse({
			associations: [{ declarationNumber: 1.5, type: "accuracy", fileId: "f" }],
		});

		expect(result.success).toBe(false);
	});

	it("rejects an unknown content type", () => {
		const result = setFileContentTypesSchema.safeParse({
			associations: [{ declarationNumber: 1, type: "other", fileId: "f" }],
		});

		expect(result.success).toBe(false);
	});

	it("rejects an empty fileId", () => {
		const result = setFileContentTypesSchema.safeParse({
			associations: [{ declarationNumber: 1, type: "accuracy", fileId: "" }],
		});

		expect(result.success).toBe(false);
	});
});
