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

// Typed as a subset of the Drizzle client so callers must pass their `tx`, never the ambient `db`.
type Writer = Pick<typeof db, "insert">;

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
	const { deliverReceiptIntent } = await import("./receiptOutbox");
	await deliverReceiptIntent(id);
}
