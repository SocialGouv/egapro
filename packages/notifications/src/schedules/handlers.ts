import type { Sql } from "postgres";
import {
	CSE_DEADLINES,
	civilDateBefore,
	getCurrentYear,
	getParisCivilDate,
} from "../dates.js";
import {
	ensureDedupTable,
	findAwaitingCompliancePathChoiceFirstRound,
	findAwaitingCompliancePathChoiceSecondRound,
	findCompletedPreviousCycle,
	findCorrectiveSecondDeclarationPending,
	findCseOpinionPending,
	findDraftDeclarations,
	findJointEvaluationPendingFirstRound,
	findJointEvaluationPendingSecondRound,
	findOpenCycleRecipients,
	getCampaignDeadlines,
	type ReminderRecipient,
} from "../eligibility/index.js";
import type {
	CseOpinionReminderVariant,
	NotificationPayloadMap,
	NotificationType,
} from "../mails/types.js";
import { type DispatchResult, dispatchReminder } from "./dispatch.js";

// 2028 is the first cycle that can announce its opening: 2027 is the
// kick-off of EgaPro V2 so there is no prior cohort to notify.
const CYCLE_OPENING_INFO_MIN_YEAR = 2028;

function emptyResult(): DispatchResult {
	return {
		scheduled: 0,
		skippedAlreadySent: 0,
		enqueued: 0,
		enqueueErrors: 0,
	};
}

function addResult(totals: DispatchResult, part: DispatchResult): void {
	totals.scheduled += part.scheduled;
	totals.skippedAlreadySent += part.skippedAlreadySent;
	totals.enqueued += part.enqueued;
	totals.enqueueErrors += part.enqueueErrors;
}

// Runs one deadline-relative reminder: for each offset that is due today
// (`deadline − offset === today`), query the eligible recipients and dispatch.
// Each block is isolated in its own try/catch so a transient failure on one
// reminder never skips the others in the same daily tick.
async function runDeadlineReminder<
	T extends NotificationType,
	O extends number,
>(
	totals: DispatchResult,
	params: {
		sql: Sql;
		today: string;
		year: number;
		type: T;
		deadlineIso: string;
		offsets: readonly O[];
		eligibility: (sql: Sql, year: number) => Promise<ReminderRecipient[]>;
		payloadFor: (
			recipient: ReminderRecipient,
			offset: O,
		) => NotificationPayloadMap[T];
		variantFor: (offset: O) => string;
	},
): Promise<void> {
	for (const offset of params.offsets) {
		if (civilDateBefore(params.deadlineIso, offset) !== params.today) continue;
		try {
			const recipients = await params.eligibility(params.sql, params.year);
			addResult(
				totals,
				await dispatchReminder({
					sql: params.sql,
					type: params.type,
					recipients,
					payloadFor: (recipient) => params.payloadFor(recipient, offset),
					variant: params.variantFor(offset),
				}),
			);
		} catch (error) {
			console.error(
				`[schedules] daily reminder ${params.type} (year=${params.year}, J-${offset}) failed:`,
				error,
			);
		}
	}
}

// Single daily tick for every deadline-relative reminder. Each milestone's
// deadline is resolved from the admin-configured `app_campaign_deadline`
// (falling back to the domain defaults) and the reminder is sent J-30 / J-15 /
// J-10 before it — moving a deadline in the back-office shifts both the timing
// and the date printed in the mail. Both the current and previous campaign
// years are considered so round-2 reminders (deadline in N+1) fire correctly.
export async function handleDailyDeadlineReminders(
	sql: Sql,
	now: Date = new Date(),
): Promise<DispatchResult> {
	await ensureDedupTable(sql);
	const today = getParisCivilDate(now);
	const currentYear = getCurrentYear(now);
	const totals = emptyResult();

	for (const year of [currentYear, currentYear - 1]) {
		let deadlines: Awaited<ReturnType<typeof getCampaignDeadlines>>;
		try {
			deadlines = await getCampaignDeadlines(sql, year);
		} catch (error) {
			console.error(
				`[schedules] getCampaignDeadlines failed for year=${year}:`,
				error,
			);
			continue;
		}

		// Rappel 1 — declaration deadline (J-30 / J-10 before 1er juin).
		await runDeadlineReminder(totals, {
			sql,
			today,
			year,
			type: "declaration_deadline_reminder",
			deadlineIso: deadlines.decl1Modification,
			offsets: [30, 10] as const,
			eligibility: findDraftDeclarations,
			payloadFor: ({ siren }, daysRemaining) => ({
				siren,
				year,
				deadline: deadlines.decl1Modification,
				daysRemaining,
			}),
			variantFor: (offset) => `d${offset}`,
		});

		// Rappel 2 — compliance path choice round 1 (J-15 before 1er juillet).
		await runDeadlineReminder(totals, {
			sql,
			today,
			year,
			type: "compliance_path_choice_reminder",
			deadlineIso: deadlines.pathChoiceRound1,
			offsets: [15] as const,
			eligibility: findAwaitingCompliancePathChoiceFirstRound,
			payloadFor: ({ siren }) => ({
				siren,
				year,
				deadline: deadlines.pathChoiceRound1,
				round: "first",
			}),
			variantFor: () => "first",
		});

		// Rappel 5 — compliance path choice round 2 (J-15 before 1er janvier N+1).
		await runDeadlineReminder(totals, {
			sql,
			today,
			year,
			type: "compliance_path_choice_reminder",
			deadlineIso: deadlines.pathChoiceRound2,
			offsets: [15] as const,
			eligibility: findAwaitingCompliancePathChoiceSecondRound,
			payloadFor: ({ siren }) => ({
				siren,
				year,
				deadline: deadlines.pathChoiceRound2,
				round: "second",
			}),
			variantFor: () => "second",
		});

		// Rappel 3 — second declaration (J-30 / J-15 before 1er décembre).
		await runDeadlineReminder(totals, {
			sql,
			today,
			year,
			type: "second_declaration_reminder",
			deadlineIso: deadlines.decl2Modification,
			offsets: [30, 15] as const,
			eligibility: findCorrectiveSecondDeclarationPending,
			payloadFor: ({ siren }, daysRemaining) => ({
				siren,
				year,
				deadline: deadlines.decl2Modification,
				daysRemaining,
			}),
			variantFor: (offset) => `d${offset}`,
		});

		// Rappel 4 — joint evaluation round 1 (J-30 / J-15 before 1er septembre).
		await runDeadlineReminder(totals, {
			sql,
			today,
			year,
			type: "joint_evaluation_reminder",
			deadlineIso: deadlines.decl1JointEvaluation,
			offsets: [30, 15] as const,
			eligibility: findJointEvaluationPendingFirstRound,
			payloadFor: ({ siren }) => ({
				siren,
				year,
				deadline: deadlines.decl1JointEvaluation,
				round: "first",
			}),
			variantFor: (offset) => `first-d${offset}`,
		});

		// Rappel 6 — joint evaluation round 2 (J-30 / J-15 before 1er mars N+1).
		await runDeadlineReminder(totals, {
			sql,
			today,
			year,
			type: "joint_evaluation_reminder",
			deadlineIso: deadlines.decl2JointEvaluation,
			offsets: [30, 15] as const,
			eligibility: findJointEvaluationPendingSecondRound,
			payloadFor: ({ siren }) => ({
				siren,
				year,
				deadline: deadlines.decl2JointEvaluation,
				round: "second",
			}),
			variantFor: (offset) => `second-d${offset}`,
		});
	}

	return totals;
}

export async function handleCycleOpeningInfo(
	sql: Sql,
): Promise<DispatchResult> {
	await ensureDedupTable(sql);
	const year = getCurrentYear();
	if (year < CYCLE_OPENING_INFO_MIN_YEAR) {
		return emptyResult();
	}
	const recipients = await findOpenCycleRecipients(sql, year);
	const deadlines = await getCampaignDeadlines(sql, year);
	return dispatchReminder({
		sql,
		type: "cycle_opening_info",
		recipients,
		payloadFor: ({ siren }) => ({
			siren,
			year,
			deadline: deadlines.decl1Modification,
		}),
	});
}

function deadlineForCseVariant(
	variant: CseOpinionReminderVariant,
	year: number,
): string {
	switch (variant) {
		case "justify_oct":
		case "justify_dec":
			return CSE_DEADLINES.justifyOct(year);
		default:
			return CSE_DEADLINES.final(year);
	}
}

export async function handleCseOpinionReminder(
	sql: Sql,
	variant: CseOpinionReminderVariant,
): Promise<DispatchResult> {
	await ensureDedupTable(sql);
	const year = getCurrentYear();
	const recipients = await findCseOpinionPending(sql, year, variant);
	const deadline = deadlineForCseVariant(variant, year);
	return dispatchReminder({
		sql,
		type: "cse_opinion_reminder",
		recipients,
		payloadFor: ({ siren }) => ({ siren, year, deadline, variant }),
		variant,
	});
}

export async function handleNextCycleHandover(
	sql: Sql,
): Promise<DispatchResult> {
	await ensureDedupTable(sql);
	const nextYear = getCurrentYear();
	const previousYear = nextYear - 1;
	const recipients = await findCompletedPreviousCycle(sql, previousYear);
	return dispatchReminder({
		sql,
		type: "next_cycle_handover",
		recipients,
		payloadFor: ({ siren }) => ({ siren, previousYear, nextYear }),
		dedupYearFor: () => previousYear,
	});
}
