import { describe, expect, it } from "vitest";

import { representationPdfFilename } from "../representationPdfFilename";

describe("representationPdfFilename", () => {
	it("names the file after the siren and the campaign year", () => {
		expect(representationPdfFilename("123456789", 2027)).toBe(
			"representation-equilibree-123456789-2027.pdf",
		);
	});
});
