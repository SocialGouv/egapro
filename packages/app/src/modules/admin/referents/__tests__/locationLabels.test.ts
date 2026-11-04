import { describe, expect, it } from "vitest";

import {
	EMPTY_LOCATION_LABEL,
	formatCountyLabel,
	formatRegionLabel,
} from "../shared/locationLabels";

describe("formatRegionLabel", () => {
	it("shows the region name followed by its code", () => {
		expect(formatRegionLabel("11")).toBe("Île-de-France (11)");
	});

	it("falls back to the raw code for an unknown region", () => {
		expect(formatRegionLabel("99")).toBe("99 (99)");
	});

	it("shows the empty marker without a region", () => {
		expect(formatRegionLabel("")).toBe(EMPTY_LOCATION_LABEL);
	});
});

describe("formatCountyLabel", () => {
	it("shows the county name followed by its code", () => {
		expect(formatCountyLabel("75")).toBe("Paris (75)");
	});

	it("shows the empty marker without a county", () => {
		expect(formatCountyLabel("")).toBe(EMPTY_LOCATION_LABEL);
		expect(formatCountyLabel(null)).toBe(EMPTY_LOCATION_LABEL);
	});
});
