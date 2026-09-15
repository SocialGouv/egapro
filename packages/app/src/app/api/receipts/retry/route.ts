import { AUDIT_ACTIONS } from "~/modules/audit";
import { withAuditedRoute } from "~/server/audit/withAuditedRoute";

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
