import { AUDIT_ACTIONS } from "~/modules/audit";
import { withAuditedRoute } from "~/server/audit/withAuditedRoute";
import { assertGatewaySource } from "~/server/services/gatewaySource";

export const POST = withAuditedRoute(
	{ action: AUDIT_ACTIONS.NOTIFICATION_OUTBOX_REPLAY },
	receiptRetryHandler,
);

// Defense in depth — the Edge middleware already rejects a missing/wrong secret before this route is reached.
async function receiptRetryHandler(request: Request): Promise<Response> {
	const gatewayError = assertGatewaySource(request);
	if (gatewayError) return gatewayError;

	const { replayPendingReceipts } = await import("~/modules/mail/server");

	try {
		const result = await replayPendingReceipts();
		return Response.json({ success: true, ...result });
	} catch (error) {
		console.error("[receipts/retry] Failed:", error);
		return Response.json({ error: "Receipt replay failed" }, { status: 500 });
	}
}
