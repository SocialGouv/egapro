"use client";

import { DeclarationLockAlert } from "./DeclarationLockAlert";
import { useLockContext } from "./LockContext";

export function DeclarationLockAlertGate() {
	const { holder, isReadOnly } = useLockContext();
	if (!isReadOnly || !holder) return null;
	return <DeclarationLockAlert holder={holder} />;
}
