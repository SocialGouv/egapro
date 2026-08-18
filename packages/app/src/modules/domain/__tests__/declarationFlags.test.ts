import { describe, expect, it } from "vitest";

import { COMPANY_SIZE_ANNUAL_MIN } from "../shared/constants";
import {
	isComplianceProcessRequired,
	isCseOpinionRequired,
	resolveCseReconciliation,
} from "../shared/declarationFlags";

// Composed behavior (nominal, G guard, gap guard, revision boundaries) lives in
// demarcheDecisionTable.test.ts / demarcheRevisionAndStatus.test.ts (#3975);
// only isolated-predicate inputs their composition cannot produce live here.
describe("isComplianceProcessRequired", () => {
	it("returns false when workforce < 100 even if indicator G has a significant gap", () => {
		// Below 100 the matrix always derives hasIndicatorG=false, so it cannot isolate this guard.
		expect(
			isComplianceProcessRequired({
				workforce: 80,
				hasIndicatorG: true,
				hasSignificantIndicatorGGap: true,
			}),
		).toBe(false);
	});

	it("returns false when workforce is null", () => {
		expect(
			isComplianceProcessRequired({
				workforce: null,
				hasIndicatorG: true,
				hasSignificantIndicatorGGap: true,
			}),
		).toBe(false);
	});

	it("returns false when no significant indicator-G gap exists", () => {
		expect(
			isComplianceProcessRequired({
				workforce: 300,
				hasIndicatorG: true,
				hasSignificantIndicatorGGap: false,
			}),
		).toBe(false);
	});

	it("returns true at the exact workforce threshold with a significant G gap", () => {
		// Forced hasIndicatorG at exactly 100: pre-2030 the composition derives false there.
		expect(
			isComplianceProcessRequired({
				workforce: COMPANY_SIZE_ANNUAL_MIN,
				hasIndicatorG: true,
				hasSignificantIndicatorGGap: true,
			}),
		).toBe(true);
	});

	// Rule 3 lock (#4043): a company under 100 employees owes no gap-alert
	// obligation even with a computed indicator G carrying a significant gap. The
	// < 50 and 50-99 bands now file 7 / 6 indicators, but the compliance package
	// still gates at COMPANY_SIZE_ANNUAL_MIN — unchanged behavior, pinned so the
	// arbitrage does not silently pull it below 100.
	it("stays false under 100 employees even with a computed indicator G carrying a significant gap (rule 3)", () => {
		for (const workforce of [30, 75]) {
			expect(
				isComplianceProcessRequired({
					workforce,
					hasIndicatorG: true,
					hasSignificantIndicatorGGap: true,
				}),
			).toBe(false);
		}
	});
});

describe("isCseOpinionRequired", () => {
	it("requires both the size threshold and an actual CSE", () => {
		expect(isCseOpinionRequired({ workforce: 250, hasCse: true })).toBe(true);
	});

	it("returns false above the threshold when the company has no CSE", () => {
		// The #3951 case: a large company without a CSE owes no opinion.
		expect(isCseOpinionRequired({ workforce: 601, hasCse: false })).toBe(false);
	});

	it("treats an unanswered CSE question as no opinion due", () => {
		expect(isCseOpinionRequired({ workforce: 250, hasCse: null })).toBe(false);
	});

	it("returns false below the threshold even with a CSE", () => {
		expect(
			isCseOpinionRequired({
				workforce: COMPANY_SIZE_ANNUAL_MIN - 1,
				hasCse: true,
			}),
		).toBe(false);
	});

	it("owes no opinion for a 50-99 company with a CSE (rule 3, #4043)", () => {
		// The 50-99 band is mandatory yearly since the arbitrage, but the CSE
		// opinion is a compliance-package obligation that still starts at 100.
		expect(isCseOpinionRequired({ workforce: 75, hasCse: true })).toBe(false);
	});

	it("is true at the exact threshold", () => {
		expect(
			isCseOpinionRequired({
				workforce: COMPANY_SIZE_ANNUAL_MIN,
				hasCse: true,
			}),
		).toBe(true);
	});
});

// The reconciliation exists because the CSE requirement is snapshotted at
// submission: when the GIP file later moves a company across the threshold, the
// snapshot goes stale and only this rule says what the démarche owes (#4184).
describe("resolveCseReconciliation", () => {
	const parked = {
		status: "awaiting_cse_opinion",
		storedCseRequired: true,
	} as const;

	it("does nothing while the snapshot still matches the live answer", () => {
		expect(
			resolveCseReconciliation({ ...parked, workforce: 250, hasCse: true }),
		).toBe("none");
	});

	it("releases a démarche parked on the CSE step once the headcount drops", () => {
		expect(
			resolveCseReconciliation({ ...parked, workforce: 87, hasCse: true }),
		).toBe("release");
	});

	it("releases it too when the company left the GIP file", () => {
		// A missing GIP row reads as a 0 headcount upstream, so the absence and a
		// drop below the threshold are the same case — not two.
		expect(
			resolveCseReconciliation({ ...parked, workforce: 0, hasCse: true }),
		).toBe("release");
	});

	it("releases it when the company answers it has no CSE", () => {
		expect(
			resolveCseReconciliation({ ...parked, workforce: 250, hasCse: false }),
		).toBe("release");
	});

	it("keeps the démarche at the exact threshold", () => {
		expect(
			resolveCseReconciliation({
				...parked,
				workforce: COMPANY_SIZE_ANNUAL_MIN,
				hasCse: true,
			}),
		).toBe("none");
	});

	it("only refreshes the snapshot away from the CSE step", () => {
		// Elsewhere the engine reads the snapshot downstream, so realigning the
		// column is enough — no transition to force.
		expect(
			resolveCseReconciliation({
				status: "demarche_completed",
				storedCseRequired: true,
				workforce: 87,
				hasCse: true,
			}),
		).toBe("refresh-snapshot");
	});

	it("refreshes the snapshot when a company becomes subject again", () => {
		// The opposite direction needs no transition: the engine already accepts
		// submit_cse_opinion from demarche_completed.
		expect(
			resolveCseReconciliation({
				status: "demarche_completed",
				storedCseRequired: false,
				workforce: 250,
				hasCse: true,
			}),
		).toBe("refresh-snapshot");
	});

	it("never releases a démarche that still owes its opinion", () => {
		expect(
			resolveCseReconciliation({
				status: "awaiting_cse_opinion",
				storedCseRequired: false,
				workforce: 250,
				hasCse: true,
			}),
		).toBe("refresh-snapshot");
	});
});
