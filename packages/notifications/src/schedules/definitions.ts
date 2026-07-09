import type { Sql } from "postgres";
import type { CseOpinionReminderVariant } from "../mails/types.js";
import type { DispatchResult } from "./dispatch.js";
import {
	handleCseOpinionReminder,
	handleCycleOpeningInfo,
	handleDailyDeadlineReminders,
	handleNextCycleHandover,
} from "./handlers.js";

export type ScheduleDefinition = {
	name: string;
	cron: string;
	timeZone: string;
	run: (sql: Sql) => Promise<DispatchResult>;
};

const TZ = "Europe/Paris";

// Scheduling model (all crons in Europe/Paris):
//
// - The six declaration-process reminders (declaration deadline, compliance
//   path choice R1/R2, second declaration, joint evaluation R1/R2) run through
//   a single DAILY tick. Their send date is derived from the campaign deadline
//   configured by admins in `app_campaign_deadline` (J-30 / J-15 / J-10 before
//   it) — so moving a deadline in the back-office shifts the reminders. See
//   `handleDailyDeadlineReminders`.
//
// - The CSE-opinion reminders keep fixed dates (1er sept / 1er déc / 1er févr):
//   they carry no displayed deadline and follow the compliance calendar, one
//   schedule per eligibility branch, all rendering the same unified content.
//
// - `cycle_opening_info` (1er mars) and `next_cycle_handover` (2 mars) are
//   fixed informational milestones. `cycle_opening_info` still reads the admin
//   deadline for the date it prints.

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
		name: "reminder-deadline-daily-tick",
		cron: "0 8 * * *",
		timeZone: TZ,
		run: handleDailyDeadlineReminders,
	},
	{
		name: "reminder-cycle-opening-info",
		cron: "0 8 1 3 *",
		timeZone: TZ,
		run: handleCycleOpeningInfo,
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
