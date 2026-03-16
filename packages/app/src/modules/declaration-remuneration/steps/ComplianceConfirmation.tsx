import Link from "next/link";
import { DsfrPictogram } from "~/modules/home";
import { ComplianceCompletionTracker } from "../shared/ComplianceCompletionTracker";
import common from "../shared/common.module.scss";

export function ComplianceConfirmation() {
	const currentYear = new Date().getFullYear();

	return (
		<div className={common.flexColumnGap2}>
			<ComplianceCompletionTracker />
			<h1 className="fr-h4 fr-mb-0">
				Parcours de mise en conformité pour l&apos;indicateur par catégorie de
				salariés
			</h1>

			<div className="fr-mt-2w fr-mb-2w">
				<DsfrPictogram
					path="/dsfr/artwork/pictograms/system/success.svg"
					size={64}
				/>
			</div>

			<p className="fr-text--lg fr-text--bold fr-mb-0">
				Votre parcours de mise en conformité {currentYear} est terminé
			</p>

			<p className="fr-mb-0">
				Votre entreprise ne dispose pas de CSE. Aucun avis CSE n&apos;est
				requis.
			</p>

			<div className="fr-mt-4w">
				<Link className="fr-btn" href="/mon-espace">
					Mon espace
				</Link>
			</div>
		</div>
	);
}
