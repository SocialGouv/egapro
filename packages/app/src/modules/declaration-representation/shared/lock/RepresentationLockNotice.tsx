"use client";

import { DeclarationLockAlert } from "~/modules/declaration-remuneration/shared/lock/DeclarationLockAlert";
import { useRepresentationLock } from "./RepresentationLockContext";

export function RepresentationLockNotice() {
	const { holder, isLoading, isReadOnly, isUnavailable } =
		useRepresentationLock();
	if (!isReadOnly || isLoading) return null;
	if (holder) return <DeclarationLockAlert holder={holder} />;
	if (!isUnavailable) return null;
	return (
		<div className="fr-alert fr-alert--error fr-mb-3w" role="alert">
			<p className="fr-alert__title">Vérification du verrou impossible</p>
			<p>
				Le parcours reste en lecture seule pendant que nous vérifions si vous
				pouvez le modifier. La vérification est relancée automatiquement.
			</p>
		</div>
	);
}
