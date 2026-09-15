import "server-only";
import type { db } from "~/server/db";
import { receiptOutbox } from "~/server/db/schema";
import type { ReceiptKind } from "./receiptKind";

export type ReceiptIntent = {
	kind: ReceiptKind;
	to: string;
	siren: string;
	year: number;
	userId: string | null;
};

// `rollback` only exists on a transaction handle, so this rejects the ambient `db` at compile time.
type Writer = Pick<typeof db, "insert"> & { rollback: () => never };

export async function recordReceiptIntent(
	tx: Writer,
	intent: ReceiptIntent,
): Promise<string> {
	const id = crypto.randomUUID();
	await tx.insert(receiptOutbox).values({
		id,
		kind: intent.kind,
		siren: intent.siren,
		year: intent.year,
		recipientEmail: intent.to,
		userId: intent.userId,
	});
	return id;
}

// Never throws — a receipt that can't leave stays in the outbox for the retry pass instead.
export async function deliverRecordedReceipt(id: string | null): Promise<void> {
	if (id === null) return;
	try {
		const { deliverReceiptIntent } = await import("./receiptOutbox");
		await deliverReceiptIntent(id);
	} catch (error) {
		// Dynamic, not hoisted: a static import would drag `enqueueReceipt`'s Sentry/db/notifications
		// chain into every caller of this file, including ones that never reach a failing delivery.
		const { reportReceiptFailure } = await import("./enqueueReceipt");
		reportReceiptFailure(error, { stage: "delivery", outboxId: id });
	}
}
