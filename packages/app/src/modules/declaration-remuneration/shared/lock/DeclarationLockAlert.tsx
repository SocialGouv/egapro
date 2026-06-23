import type { LockHolder } from "./useDeclarationLock";

type DeclarationLockAlertProps = {
	holder: Pick<LockHolder, "firstName" | "lastName" | "email">;
};

export function DeclarationLockAlert({ holder }: DeclarationLockAlertProps) {
	const fullName = [holder.firstName, holder.lastName]
		.filter(Boolean)
		.join(" ")
		.trim();
	const identity = fullName
		? `${fullName}${holder.email ? ` (${holder.email})` : ""}`
		: (holder.email ?? "Un autre utilisateur");

	return (
		<div className="fr-alert fr-alert--warning fr-mb-3w" role="alert">
			<h3 className="fr-alert__title">Déclaration en cours de modification</h3>
			<p>
				{identity} modifie actuellement cette déclaration. Vous pouvez la
				consulter en lecture seule jusqu&apos;à la fin de sa modification.
			</p>
		</div>
	);
}
