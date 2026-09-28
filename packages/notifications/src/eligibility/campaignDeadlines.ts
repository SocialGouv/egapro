import type { Sql } from "postgres";
import {
	getDefaultReminderDeadlines,
	type ReminderDeadlines,
} from "../dates.js";

type DeadlineRow = {
	decl1: string | null;
	decl1JointEval: string | null;
	decl2: string | null;
	decl2JointEval: string | null;
};

function toIso(civilDate: string | null): string | null {
	return civilDate ? `${civilDate}T00:00:00.000Z` : null;
}

// Reads the admin-configured campaign deadlines for a year from
// `app_campaign_deadline` (the source of truth maintained by admins in the
// back-office), falling back per-field to the domain defaults when the row —
// or a column — is absent. A reminder therefore displays the same deadline the
// app would, and moving a date in the back-office shifts the reminders.
//
// Only the milestones a reminder sends on are read (justification deadlines are
// not surfaced by any reminder today). `pathChoice*` are never stored (the
// domain derives them), so they are always the computed defaults. Columns are
// cast to text to receive stable "YYYY-MM-DD" strings regardless of the
// driver's date parsing.
export async function getCampaignDeadlines(
	sql: Sql,
	year: number,
): Promise<ReminderDeadlines> {
	const defaults = getDefaultReminderDeadlines(year);
	const rows = await sql<DeadlineRow[]>`
		SELECT
			decl1_modification_deadline::text AS decl1,
			decl1_joint_evaluation_deadline::text AS "decl1JointEval",
			decl2_modification_deadline::text AS decl2,
			decl2_joint_evaluation_deadline::text AS "decl2JointEval"
		FROM app_campaign_deadline
		WHERE year = ${year}
		LIMIT 1
	`;
	const row = rows[0];
	if (!row) return defaults;
	return {
		decl1Modification: toIso(row.decl1) ?? defaults.decl1Modification,
		decl1JointEvaluation:
			toIso(row.decl1JointEval) ?? defaults.decl1JointEvaluation,
		decl2Modification: toIso(row.decl2) ?? defaults.decl2Modification,
		decl2JointEvaluation:
			toIso(row.decl2JointEval) ?? defaults.decl2JointEvaluation,
		pathChoiceRound1: defaults.pathChoiceRound1,
		pathChoiceRound2: defaults.pathChoiceRound2,
	};
}
