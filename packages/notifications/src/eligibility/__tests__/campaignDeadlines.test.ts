import { describe, expect, it } from "vitest";

import { getDefaultReminderDeadlines } from "../../dates.js";
import { getCampaignDeadlines } from "../campaignDeadlines.js";

// Minimal stand-in for the `postgres` tagged-template client: called as
// sql`...`, it ignores the query and resolves the provided rows.
function fakeSql(rows: unknown[]) {
	return (() => Promise.resolve(rows)) as unknown as Parameters<
		typeof getCampaignDeadlines
	>[0];
}

describe("getCampaignDeadlines", () => {
	it("falls back to the domain defaults when no row exists", async () => {
		const result = await getCampaignDeadlines(fakeSql([]), 2027);
		expect(result).toEqual(getDefaultReminderDeadlines(2027));
	});

	it("uses the admin-configured deadlines when a row exists", async () => {
		const result = await getCampaignDeadlines(
			fakeSql([
				{
					decl1: "2027-06-15",
					decl1JointEval: "2027-08-20",
					decl2: "2027-12-10",
					decl2JointEval: "2028-02-05",
				},
			]),
			2027,
		);
		expect(result.decl1Modification).toBe("2027-06-15T00:00:00.000Z");
		expect(result.decl1JointEvaluation).toBe("2027-08-20T00:00:00.000Z");
		expect(result.decl2Modification).toBe("2027-12-10T00:00:00.000Z");
		expect(result.decl2JointEvaluation).toBe("2028-02-05T00:00:00.000Z");
		// Path-choice deadlines are never stored → always the derived defaults.
		const defaults = getDefaultReminderDeadlines(2027);
		expect(result.pathChoiceRound1).toBe(defaults.pathChoiceRound1);
		expect(result.pathChoiceRound2).toBe(defaults.pathChoiceRound2);
	});

	it("falls back per-field when a column is null", async () => {
		const result = await getCampaignDeadlines(
			fakeSql([
				{
					decl1: null,
					decl1JointEval: "2027-08-20",
					decl2: null,
					decl2JointEval: null,
				},
			]),
			2027,
		);
		const defaults = getDefaultReminderDeadlines(2027);
		expect(result.decl1Modification).toBe(defaults.decl1Modification);
		expect(result.decl1JointEvaluation).toBe("2027-08-20T00:00:00.000Z");
		expect(result.decl2Modification).toBe(defaults.decl2Modification);
		expect(result.decl2JointEvaluation).toBe(defaults.decl2JointEvaluation);
	});
});
