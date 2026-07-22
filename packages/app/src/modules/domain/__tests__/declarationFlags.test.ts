import { describe, expect, it } from "vitest";

import {
	COMPANY_SIZE_ANNUAL_MIN,
	GAP_ALERT_THRESHOLD,
} from "../shared/constants";
import { isComplianceProcessRequired } from "../shared/declarationFlags";

// Composed behavior (nominal, G guard, gap guard, revision boundaries) lives in
// demarcheDecisionTable.test.ts / demarcheRevisionAndStatus.test.ts (#3975);
// only isolated-predicate inputs their composition cannot produce live here.
describe("isComplianceProcessRequired", () => {
	it("returns false when workforce < 100 even if gap is high", () => {
		// Below 100 the matrix always derives hasIndicatorG=false, so it cannot isolate this guard.
		expect(
			isComplianceProcessRequired({
				workforce: 80,
				hasIndicatorG: true,
				gap: 10,
			}),
		).toBe(false);
	});

	it("returns false when workforce is null", () => {
		expect(
			isComplianceProcessRequired({
				workforce: null,
				hasIndicatorG: true,
				gap: 10,
			}),
		).toBe(false);
	});

	it("returns false when gap is null", () => {
		expect(
			isComplianceProcessRequired({
				workforce: 300,
				hasIndicatorG: true,
				gap: null,
			}),
		).toBe(false);
	});

	it("returns true at the exact workforce and gap alert thresholds", () => {
		// Forced hasIndicatorG at exactly 100: pre-2030 the composition derives false there.
		expect(
			isComplianceProcessRequired({
				workforce: COMPANY_SIZE_ANNUAL_MIN,
				hasIndicatorG: true,
				gap: GAP_ALERT_THRESHOLD,
			}),
		).toBe(true);
	});
});
