import { describe, expect, it } from "vitest";

import { STATUS_LABELS } from "../shared/constants";

describe("STATUS_LABELS", () => {
	it("maps draft to Brouillon", () => {
		expect(STATUS_LABELS.draft).toBe("Brouillon");
	});

	it("maps submitted to Transmise", () => {
		expect(STATUS_LABELS.submitted).toBe("Transmise");
	});
});
