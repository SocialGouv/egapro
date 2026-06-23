import type { LockHolder } from "./useDeclarationLock";

type DeclarationLockAlertProps = {
	holder: Pick<LockHolder, "firstName" | "lastName" | "email">;
};

export function DeclarationLockAlert({ holder }: DeclarationLockAlertProps) {
	const fullName = [holder.firstName, holder.lastName]
		.filter(Boolean)
		.join(" ")
		.trim();
	const hasEmailSuffix = Boolean(fullName) && Boolean(holder.email);
	const editor = fullName || holder.email || "Un autre utilisateur";
	const emailSuffix = hasEmailSuffix ? ` (${holder.email})` : "";

	return (
		<div className="fr-alert fr-alert--warning fr-alert--sm">
			<p>
				<strong>Déclaration en cours de modification</strong> — {editor}
				{emailSuffix} modifie actuellement cette déclaration. Vous pouvez la
				consulter en lecture seule jusqu'à la fin de sa modification.
			</p>
		</div>
	);
}
