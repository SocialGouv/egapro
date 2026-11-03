"use client";

import { DeclarationLockAlert } from "./DeclarationLockAlert";
import { useLockHolderIfLockedOut, useReadOnlyContext } from "./LockContext";
import { LockRetakeStatus } from "./LockRetakeStatus";

export function DeclarationLockAlertGate() {
	const holder = useLockHolderIfLockedOut();
	const { retake } = useReadOnlyContext();
	return (
		<>
			{holder && (
				<DeclarationLockAlert followUp="watchThenRetake" holder={holder} />
			)}
			<LockRetakeStatus holder={holder} retake={retake} />
		</>
	);
}
