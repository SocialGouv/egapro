import { describe, expect, it } from "vitest";

import { jointEvaluationPdfFilename } from "../jointEvaluationPdfFilename";

describe("jointEvaluationPdfFilename", () => {
	it("names the file after the siren and the campaign year", () => {
		expect(jointEvaluationPdfFilename("123456789", 2027)).toBe(
			"evaluation-conjointe-123456789-2027.pdf",
		);
	});
});
