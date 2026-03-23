import { describe, expect, it } from "vitest";

import { GAP_LEVEL_LABELS, gapBadgeClass } from "../gapBadge";

describe("GAP_LEVEL_LABELS", () => {
	it("maps low to French label", () => {
		expect(GAP_LEVEL_LABELS.low).toBe("faible");
	});

	it("maps high to French label", () => {
		expect(GAP_LEVEL_LABELS.high).toBe("élevé");
	});
});

describe("gapBadgeClass", () => {
	it("returns info badge for low", () => {
		expect(gapBadgeClass("low")).toContain("fr-badge--info");
	});

	it("returns warning badge for high", () => {
		expect(gapBadgeClass("high")).toContain("fr-badge--warning");
	});
});
