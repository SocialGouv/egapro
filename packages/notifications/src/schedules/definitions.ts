import type { Sql } from "postgres";
import type { CseOpinionReminderVariant } from "../mails/types.js";
import type { DispatchResult } from "./dispatch.js";
import {
	handleCompliancePathChoiceReminder,
	handleCseOpinionReminder,
	handleCycleOpeningInfo,
	handleDeclarationDeadlineReminder,
	handleJointEvaluationReminder,
	handleNextCycleHandover,
	handleSecondDeclarationReminder,
} from "./handlers.js";

export type ScheduleDefinition = {
	name: string;
	cron: string;
	timeZone: string;
	run: (sql: Sql) => Promise<DispatchResult>;
};

const TZ = "Europe/Paris";

// Cron timing rationale (all in Europe/Paris). The reminder deadlines and
// J-offsets follow the Figma sending plan
// (node 10195:162147 of the "Refonte Egapro" file); the informational mails
// (cycle opening, next-cycle handover) follow the V2 calendar in
// `docs/parcours-utilisateurs.md`.
//
// - Phase 1 cycle (year N):
//   - 1er mars → cycle opening info
//   - 2 mai    → declaration deadline J-30 (before 1er juin)
//   - 22 mai   → declaration deadline J-10 (before 1er juin)
//   - 16 juin  → compliance path choice round 1, J-15 (before 1er juillet)
//   - 2 août   → joint evaluation round 1, J-30 (before 1er septembre)
//   - 17 août  → joint evaluation round 1, J-15 (before 1er septembre)
//   - 1er sept → CSE opinion reminder (fixed date, unified content)
//   - 1er nov  → second declaration J-30 (before 1er décembre)
//   - 16 nov   → second declaration J-15 (before 1er décembre)
//   - 1er déc  → CSE opinion reminder (fixed date, unified content)
//   - 17 déc   → compliance path choice round 2, J-15 (before 1er janvier N+1)
//
// - Phase 1 wrap-up (year N+1):
//   - 30 janv  → joint evaluation round 2, J-30 (before 1er mars N+1)
//   - 1er fév  → CSE opinion reminder (fixed date, unified content)
//   - 14 févr  → joint evaluation round 2, J-15 (before 1er mars N+1)
//   - 2 mars   → next-cycle handover
//
// CSE opinion reminders keep their per-variant eligibility (they target the
// right companies per compliance branch) but now render a single unified
// content; their fixed cron dates already land on 1er sept / 1er déc /
// 1er févr, matching the Figma plan.

const CSE_VARIANT_SCHEDULES: ReadonlyArray<{
	suffix: string;
	cron: string;
	variant: CseOpinionReminderVariant;
}> = [
	{ suffix: "compliance", cron: "0 8 1 2 *", variant: "compliance" },
	{ suffix: "justify-oct", cron: "0 8 1 9 *", variant: "justify_oct" },
	{ suffix: "justify-dec", cron: "0 8 1 12 *", variant: "justify_dec" },
	{ suffix: "corrective", cron: "0 8 1 2 *", variant: "corrective" },
	{ suffix: "joint-eval", cron: "0 8 1 12 *", variant: "joint_eval" },
];

export const SCHEDULES: ScheduleDefinition[] = [
	{
		name: "reminder-cycle-opening-info",
		cron: "0 8 1 3 *",
		timeZone: TZ,
		run: handleCycleOpeningInfo,
	},
	{
		name: "reminder-declaration-deadline-30",
		cron: "0 8 2 5 *",
		timeZone: TZ,
		run: (sql) => handleDeclarationDeadlineReminder(sql, 30),
	},
	{
		name: "reminder-declaration-deadline-10",
		cron: "0 8 22 5 *",
		timeZone: TZ,
		run: (sql) => handleDeclarationDeadlineReminder(sql, 10),
	},
	{
		name: "reminder-compliance-path-choice-r1",
		cron: "0 8 16 6 *",
		timeZone: TZ,
		run: (sql) => handleCompliancePathChoiceReminder(sql, "first"),
	},
	{
		name: "reminder-compliance-path-choice-r2",
		cron: "0 8 17 12 *",
		timeZone: TZ,
		run: (sql) => handleCompliancePathChoiceReminder(sql, "second"),
	},
	{
		name: "reminder-second-declaration-30",
		cron: "0 8 1 11 *",
		timeZone: TZ,
		run: (sql) => handleSecondDeclarationReminder(sql, 30),
	},
	{
		name: "reminder-second-declaration-15",
		cron: "0 8 16 11 *",
		timeZone: TZ,
		run: (sql) => handleSecondDeclarationReminder(sql, 15),
	},
	{
		name: "reminder-joint-evaluation-r1-30",
		cron: "0 8 2 8 *",
		timeZone: TZ,
		run: (sql) => handleJointEvaluationReminder(sql, "first", 30),
	},
	{
		name: "reminder-joint-evaluation-r1-15",
		cron: "0 8 17 8 *",
		timeZone: TZ,
		run: (sql) => handleJointEvaluationReminder(sql, "first", 15),
	},
	{
		name: "reminder-joint-evaluation-r2-30",
		cron: "0 8 30 1 *",
		timeZone: TZ,
		run: (sql) => handleJointEvaluationReminder(sql, "second", 30),
	},
	{
		name: "reminder-joint-evaluation-r2-15",
		cron: "0 8 14 2 *",
		timeZone: TZ,
		run: (sql) => handleJointEvaluationReminder(sql, "second", 15),
	},
	...CSE_VARIANT_SCHEDULES.map(({ suffix, cron, variant }) => ({
		name: `reminder-cse-opinion-${suffix}`,
		cron,
		timeZone: TZ,
		run: (sql: Sql) => handleCseOpinionReminder(sql, variant),
	})),
	{
		name: "reminder-next-cycle-handover",
		cron: "0 8 2 3 *",
		timeZone: TZ,
		run: handleNextCycleHandover,
	},
];
