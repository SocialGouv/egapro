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
			{/* The alert renders above the page <h1> in every host page (tunnel
			    layouts, my-space panel), so its title must stay out of the heading
			    outline (RGAA 9.1) — the DSFR class keeps the visual unchanged. */}
			<p className="fr-alert__title">Déclaration en cours de modification</p>
			<p>
				{`${identity} modifie actuellement cette déclaration. Vous pouvez la consulter en lecture seule jusqu'à la fin de sa modification.`}
			</p>
		</div>
	);
}
