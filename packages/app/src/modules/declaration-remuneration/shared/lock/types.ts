import type { inferRouterOutputs } from "@trpc/server";

import type { declarationLockRouter } from "~/server/api/routers/declarationLock";

type DeclarationLockOutputs = inferRouterOutputs<typeof declarationLockRouter>;

export type LockHolder = NonNullable<
	DeclarationLockOutputs["getLockState"]["holder"]
>;

export type LockHolderDisplay = Pick<
	LockHolder,
	"firstName" | "lastName" | "email"
>;

export type ReadOnlyReason = "impersonation" | "modification_closed" | "lock";

export type DeclarationLockState = {
	isReadOnly: boolean;
	reason: ReadOnlyReason | null;
	holder: LockHolder | null;
	isLoading: boolean;
};
