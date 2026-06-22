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

// Cron timing rationale (all in Europe/Paris, anchored to the V2 calendar
// in `docs/parcours-utilisateurs.md`):
//
// - Phase 1 cycle (year N):
//   - 1er mars → MA   (cycle opening info)
//   - 2 mai    → MR30 (J-30 before declaration deadline 1er juin)
//   - 22 mai   → MR10 (J-10 before declaration deadline 1er juin)
//   - 16 juin  → ME   (J-15 before compliance path choice 1er juillet)
//   - 1er août → MG_E1 (joint-eval report due 1er septembre)
//   - 3 oct    → MSD3 (J-90 before second declaration 1er janvier N+1)
//   - 1er sept → MG_J1 (J-30 before CSE Justify deadline 1er octobre)
//   - 1er déc  → MSD30 (J-30 before second declaration 1er janvier N+1)
//   - 1er déc  → MG_J2 / MG_E2 (CSE Justify late + CSE Joint-eval reminders)
//
// - Phase 1 wrap-up (year N+1):
//   - 1er fév  → MG_B/C / MG_A (J-30 before CSE final 1er mars N+1)
//   - 2 mars   → MI_* (next-cycle handover)

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
		name: "reminder-compliance-path-choice",
		cron: "0 8 16 6 *",
		timeZone: TZ,
		run: handleCompliancePathChoiceReminder,
	},
	{
		name: "reminder-second-declaration-90",
		cron: "0 8 3 10 *",
		timeZone: TZ,
		run: (sql) => handleSecondDeclarationReminder(sql, 90),
	},
	{
		name: "reminder-second-declaration-30",
		cron: "0 8 1 12 *",
		timeZone: TZ,
		run: (sql) => handleSecondDeclarationReminder(sql, 30),
	},
	{
		name: "reminder-joint-evaluation",
		cron: "0 8 1 8 *",
		timeZone: TZ,
		run: handleJointEvaluationReminder,
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
