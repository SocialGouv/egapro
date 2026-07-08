import type { Sql } from "postgres";
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
} from "../eligibility/index.js";
import type {
	CseOpinionReminderVariant,
	ReminderRound,
} from "../mails/types.js";
import { DEADLINES, getCurrentYear } from "./dates.js";
import { type DispatchResult, dispatchReminder } from "./dispatch.js";

// 2028 is the first cycle that can announce its opening: 2027 is the
// kick-off of EgaPro V2 so there is no prior cohort to notify.
const CYCLE_OPENING_INFO_MIN_YEAR = 2028;

export async function handleCycleOpeningInfo(
	sql: Sql,
): Promise<DispatchResult> {
	await ensureDedupTable(sql);
	const year = getCurrentYear();
	if (year < CYCLE_OPENING_INFO_MIN_YEAR) {
		return {
			scheduled: 0,
			skippedAlreadySent: 0,
			enqueued: 0,
			enqueueErrors: 0,
		};
	}
	const recipients = await findOpenCycleRecipients(sql, year);
	const deadline = DEADLINES.declarationModification(year);
	return dispatchReminder({
		sql,
		type: "cycle_opening_info",
		recipients,
		payloadFor: ({ siren }) => ({ siren, year, deadline }),
	});
}

export async function handleDeclarationDeadlineReminder(
	sql: Sql,
	daysRemaining: 30 | 10,
): Promise<DispatchResult> {
	await ensureDedupTable(sql);
	const year = getCurrentYear();
	const recipients = await findDraftDeclarations(sql, year);
	const deadline = DEADLINES.declarationModification(year);
	return dispatchReminder({
		sql,
		type: "declaration_deadline_reminder",
		recipients,
		payloadFor: ({ siren }) => ({ siren, year, deadline, daysRemaining }),
		variant: `d${daysRemaining}`,
	});
}

// Compliance path choice reminder. Round 1 fires mid-June (J-15 before the
// 1er juillet choice deadline); round 2 fires mid-December (J-15 before the
// 1er janvier N+1 revision deadline). Both run in the campaign year N.
export async function handleCompliancePathChoiceReminder(
	sql: Sql,
	round: ReminderRound,
): Promise<DispatchResult> {
	await ensureDedupTable(sql);
	const year = getCurrentYear();
	const recipients =
		round === "first"
			? await findAwaitingCompliancePathChoiceFirstRound(sql, year)
			: await findAwaitingCompliancePathChoiceSecondRound(sql, year);
	const deadline =
		round === "first"
			? DEADLINES.compliancePathChoice(year)
			: DEADLINES.compliancePathChoiceAfterSecondDeclaration(year);
	return dispatchReminder({
		sql,
		type: "compliance_path_choice_reminder",
		recipients,
		payloadFor: ({ siren }) => ({ siren, year, deadline, round }),
		variant: round,
	});
}

export async function handleSecondDeclarationReminder(
	sql: Sql,
	daysRemaining: 30 | 15,
): Promise<DispatchResult> {
	await ensureDedupTable(sql);
	const year = getCurrentYear();
	const recipients = await findCorrectiveSecondDeclarationPending(sql, year);
	const deadline = DEADLINES.secondDeclaration(year);
	return dispatchReminder({
		sql,
		type: "second_declaration_reminder",
		recipients,
		payloadFor: ({ siren }) => ({ siren, year, deadline, daysRemaining }),
		variant: `d${daysRemaining}`,
	});
}

// Joint evaluation report reminder. Round 1 fires in August (J-30 / J-15
// before the 1er septembre report deadline of campaign N). Round 2 fires in
// January / February of N+1 (J-30 / J-15 before the 1er mars N+1 deadline),
// so — like `handleNextCycleHandover` — the campaign year is the *previous*
// calendar year.
export async function handleJointEvaluationReminder(
	sql: Sql,
	round: ReminderRound,
	daysRemaining: 30 | 15,
): Promise<DispatchResult> {
	await ensureDedupTable(sql);
	const currentYear = getCurrentYear();
	const year = round === "first" ? currentYear : currentYear - 1;
	const recipients =
		round === "first"
			? await findJointEvaluationPendingFirstRound(sql, year)
			: await findJointEvaluationPendingSecondRound(sql, year);
	const deadline =
		round === "first"
			? DEADLINES.jointEvaluationReport(year)
			: DEADLINES.jointEvaluationReportRevised(year);
	return dispatchReminder({
		sql,
		type: "joint_evaluation_reminder",
		recipients,
		payloadFor: ({ siren }) => ({ siren, year, deadline, round }),
		variant: `${round}-d${daysRemaining}`,
	});
}

function deadlineForCseVariant(
	variant: CseOpinionReminderVariant,
	year: number,
): string {
	switch (variant) {
		case "justify_oct":
		case "justify_dec":
			return DEADLINES.cseOpinionJustifyOct(year);
		default:
			return DEADLINES.cseOpinionFinal(year);
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
