"use client";

import { DeclarationLockAlert } from "./DeclarationLockAlert";
import { useLockHolderIfLockedOut } from "./LockContext";

export function DeclarationLockAlertGate() {
	const holder = useLockHolderIfLockedOut();
	if (!holder) return null;
	return <DeclarationLockAlert holder={holder} />;
}
