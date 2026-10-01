import type { receiptKindEnum } from "~/server/db/schema";

// Derived from the Postgres enum so the outbox column and the code that fills it cannot drift apart.
export type ReceiptKind = (typeof receiptKindEnum.enumValues)[number];
