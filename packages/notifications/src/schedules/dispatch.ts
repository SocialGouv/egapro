import type { Sql } from "postgres";
import type { ReminderRecipient } from "../eligibility/index.js";
import { markSent, wasSent } from "../eligibility/index.js";
import type {
	NotificationPayloadMap,
	NotificationType,
} from "../mails/types.js";
import { enqueueNotification } from "../publisher.js";

export type DispatchResult = {
	scheduled: number;
	skippedAlreadySent: number;
	enqueued: number;
	enqueueErrors: number;
};

// Shared dispatch loop for all reminder schedules.
// Iterates over the recipients returned by an eligibility query, skips
// the ones already sent (via the dedup table), enqueues a notification job
// for the rest, and records each successful enqueue in the dedup table.
//
// Variant matters for `cse_opinion_reminder` (one entry per variant in the
// dedup table — same recipient may receive several variants per year).
export async function dispatchReminder<T extends NotificationType>(params: {
	sql: Sql;
	type: T;
	recipients: ReminderRecipient[];
	payloadFor: (recipient: ReminderRecipient) => NotificationPayloadMap[T];
	variant?: string;
	dedupYearFor?: (recipient: ReminderRecipient) => number;
}): Promise<DispatchResult> {
	const result: DispatchResult = {
		scheduled: params.recipients.length,
		skippedAlreadySent: 0,
		enqueued: 0,
		enqueueErrors: 0,
	};

	for (const recipient of params.recipients) {
		const dedupYear = params.dedupYearFor
			? params.dedupYearFor(recipient)
			: recipient.year;
		const already = await wasSent(params.sql, {
			type: params.type,
			siren: recipient.siren,
			year: dedupYear,
			variant: params.variant,
		});
		if (already) {
			result.skippedAlreadySent += 1;
			continue;
		}
		const payload = params.payloadFor(recipient);
		const enqueueResult = await enqueueNotification({
			type: params.type,
			recipientEmail: recipient.email,
			recipientUserId: recipient.userId,
			siren: recipient.siren,
			payload,
		});
		if (enqueueResult.status === "enqueued") {
			result.enqueued += 1;
			await markSent(params.sql, {
				type: params.type,
				siren: recipient.siren,
				year: dedupYear,
				variant: params.variant,
			});
		} else {
			result.enqueueErrors += 1;
			console.error(
				`[schedules] enqueue failed for ${params.type} siren=${recipient.siren}: ${
					enqueueResult.status === "error"
						? enqueueResult.error
						: enqueueResult.status
				}`,
			);
		}
	}

	return result;
}
