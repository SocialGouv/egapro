import { ImpersonateForm } from "./ImpersonateForm";

/**
 * Backoffice page letting an admin impersonate ("mimoquer") an entreprise
 * by SIREN. Thin server wrapper — interactive pieces live in
 * `ImpersonateForm` and `ImpersonateBanner` (in the `layout` module).
 */
export function ImpersonatePage() {
	return (
		<div className="fr-container fr-py-6w">
			<h1 className="fr-h1">Mimoquer une entreprise</h1>
			<p>
				En tant qu'administrateur, vous pouvez vous faire passer pour le
				référent d'une entreprise en saisissant son SIREN. Vous accéderez alors
				à son tableau de bord et à ses déclarations.
			</p>
			<ImpersonateForm />
		</div>
	);
}
