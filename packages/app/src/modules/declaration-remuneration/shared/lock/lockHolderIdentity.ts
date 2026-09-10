import { DECLARATION_LOCK_CONFLICT_MESSAGE } from "~/modules/domain";

export type LockHolderIdentity = {
	firstName: string | null;
	lastName: string | null;
	email: string | null;
};

export function formatLockHolderIdentity(
	holder: LockHolderIdentity | null,
): string | null {
	if (!holder) return null;
	const fullName = [holder.firstName, holder.lastName]
		.filter(Boolean)
		.join(" ")
		.trim();
	if (fullName && holder.email) return `${fullName} (${holder.email})`;
	if (fullName) return fullName;
	return holder.email ?? null;
}

export function formatLockConflictMessage(
	holder: LockHolderIdentity | null,
): string {
	const identity = formatLockHolderIdentity(holder);
	// Sentinel intentionally kept untouched — useDeclarationLock compares it by strict equality.
	return identity
		? `Déclaration verrouillée par ${identity}.`
		: DECLARATION_LOCK_CONFLICT_MESSAGE;
}
