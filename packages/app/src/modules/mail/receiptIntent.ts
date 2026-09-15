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

/**
 * The subset of the Drizzle client a transaction also offers. Typing the
 * parameter this way is what forces callers to pass their `tx` rather than the
 * ambient `db` — an intent written outside the submitting transaction is
 * exactly the race this table exists to close.
 */
type Writer = Pick<typeof db, "insert">;

/**
 * Record, inside the caller's transaction, that a receipt is owed.
 *
 * This is the whole fix for issue #4542: the row commits with the démarche, so
 * there is no window in which the submission is durable and the obligation to
 * acknowledge it is not. Pass the transaction handle, never `db`.
 */
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

/**
 * Hand a freshly recorded intent to the delivery path, right after the
 * transaction commits.
 *
 * `deliverReceiptIntent` drags in the PDF renderer, so it is reached through a
 * dynamic import: a mutation that records no intent — no e-mail on the
 * session, a transition that owes no receipt — must not pay for loading it.
 * Never throws: the démarche is already committed, and a receipt that could
 * not leave stays in the outbox for the retry pass rather than failing the
 * submission the user just made.
 */
export async function deliverRecordedReceipt(id: string | null): Promise<void> {
	if (id === null) return;
	const { deliverReceiptIntent } = await import("./receiptOutbox");
	await deliverReceiptIntent(id);
}
