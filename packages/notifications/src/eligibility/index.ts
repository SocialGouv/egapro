export { getCampaignDeadlines } from "./campaignDeadlines.js";
export {
	__resetAppDbSqlForTests,
	closeAppDbSql,
	getAppDbSql,
} from "./client.js";
export {
	__resetDedupForTests,
	ensureDedupTable,
	markSent,
	purgeSentLog,
	REMINDER_LOG_RETENTION_YEARS,
	type ReminderLogPurgeSummary,
	reminderLogCutoffYear,
	wasSent,
} from "./dedup.js";
export {
	findAwaitingCompliancePathChoiceFirstRound,
	findAwaitingCompliancePathChoiceSecondRound,
	findCompletedPreviousCycle,
	findCorrectiveSecondDeclarationPending,
	findCseOpinionPending,
	findDraftDeclarations,
	findJointEvaluationPendingFirstRound,
	findJointEvaluationPendingSecondRound,
	findOpenCycleRecipients,
	type ReminderRecipient,
} from "./queries.js";
