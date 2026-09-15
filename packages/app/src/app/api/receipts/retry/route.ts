import { AUDIT_ACTIONS } from "~/modules/audit";
import { withAuditedRoute } from "~/server/audit/withAuditedRoute";

/**
 * POST /api/receipts/retry
 *
 * Send the acknowledgements whose submitting request died between the commit
 * and the queue (issue #4542). Called by the `receipt-outbox-retry` CronJob.
 *
 * It lives here rather than in `packages/app/scripts/` because replaying a
 * receipt means rendering its PDF and picking its variant — the app's own code
 * path, which a standalone `.mjs` could only duplicate. Same shape as
 * `/api/export/generate`, the other cron-triggered endpoint: reached in-cluster
 * over `http://app:3000`.
 *
 * It takes no input. Every row it touches was written by a committed
 * submission, is delivered to the address that submission recorded, and is
 * claimed exactly once; the pg-boss job id derived from the row makes a
 * concurrent call a no-op rather than a second e-mail. So the endpoint grants
 * no one the power to send anything, and calling it early only does work the
 * app owed anyway.
 */
export const POST = withAuditedRoute(
	{ action: AUDIT_ACTIONS.NOTIFICATION_OUTBOX_REPLAY },
	receiptRetryHandler,
);

async function receiptRetryHandler(): Promise<Response> {
	const { replayPendingReceipts } = await import("~/modules/mail/server");

	try {
		const result = await replayPendingReceipts();
		return Response.json({ success: true, ...result });
	} catch (error) {
		console.error("[receipts/retry] Failed:", error);
		return Response.json({ error: "Receipt replay failed" }, { status: 500 });
	}
}
