import { describe, expect, it } from "vitest";

import { STATUS_LABELS, statusLabel } from "../shared/constants";

describe("STATUS_LABELS", () => {
	it("maps draft to Brouillon", () => {
		expect(STATUS_LABELS.draft).toBe("Brouillon");
	});

	it("maps awaiting_compliance_path_choice to Transmise", () => {
		expect(STATUS_LABELS.awaiting_compliance_path_choice).toBe("Transmise");
	});
});

describe("statusLabel", () => {
	it("resolves a known status to its label", () => {
		expect(statusLabel("demarche_completed")).toBe("Démarche terminée");
	});

	it("falls back to the raw value for an unknown status", () => {
		expect(statusLabel("some_future_status")).toBe("some_future_status");
	});

	it("falls back to null/undefined unchanged when the status is absent", () => {
		expect(statusLabel(null)).toBeNull();
		expect(statusLabel(undefined)).toBeUndefined();
	});
});
