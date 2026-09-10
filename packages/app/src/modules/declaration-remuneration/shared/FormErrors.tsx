"use client";

import { DECLARATION_LOCK_CONFLICT_MESSAGE } from "~/modules/domain";
import { useLockHolderIfLockedOut } from "./lock/LockContext";
import { formatLockConflictMessage } from "./lock/lockHolderIdentity";

type FormErrorsProps = {
	mutationError?: string | null;
	validationError?: string | null;
};

export function FormErrors({
	validationError,
	mutationError,
}: FormErrorsProps) {
	const holder = useLockHolderIfLockedOut();
	const resolvedMutationError =
		mutationError === DECLARATION_LOCK_CONFLICT_MESSAGE
			? formatLockConflictMessage(holder)
			: mutationError;

	return (
		<>
			{validationError && (
				<div className="fr-alert fr-alert--error" role="alert">
					<p>{validationError}</p>
				</div>
			)}
			{resolvedMutationError && (
				<div className="fr-alert fr-alert--error" role="alert">
					<p>{resolvedMutationError}</p>
				</div>
			)}
		</>
	);
}
