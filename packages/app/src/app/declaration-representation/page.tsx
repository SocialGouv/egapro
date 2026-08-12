import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
	stepHref,
	TOTAL_REPRESENTATION_STEPS,
} from "~/modules/declaration-representation";
import { getCurrentYear, getReferenceYearFor } from "~/modules/domain";
import { api } from "~/trpc/server";

export const metadata: Metadata = {
	title: "Démarche des indicateurs de représentation équilibrée",
};

export default async function RepresentationHomePage() {
	const campaignYear = getCurrentYear();
	const year = getReferenceYearFor(campaignYear);

	const { declaration, campaignOpen } = await api.representationDeclaration.get(
		{ year },
	);

	if (!campaignOpen) {
		redirect(stepHref(TOTAL_REPRESENTATION_STEPS));
	}

	const currentStep = declaration?.currentStep ?? 0;
	if (currentStep >= 1) {
		redirect(stepHref(currentStep));
	}

	return (
		<>
			<h1 className="fr-h4">
				Démarche des indicateurs de représentation {campaignYear}
			</h1>
			<p>
				Cette démarche concerne les entreprises d'au moins 1 000 salariés. Elle
				porte sur la représentation équilibrée des femmes et des hommes parmi
				les cadres dirigeants et les membres des instances dirigeantes au titre
				de l'année {year}.
			</p>
			<div className="fr-callout">
				<p className="fr-callout__text">
					L'écran d'assujettissement est en construction et sera disponible
					prochainement.
				</p>
			</div>
			<div className="fr-btns-group fr-btns-group--inline fr-btns-group--right fr-mt-6w">
				<Link
					className="fr-btn fr-icon-arrow-right-line fr-btn--icon-right"
					href={stepHref(1)}
				>
					Commencer la démarche
				</Link>
			</div>
		</>
	);
}
