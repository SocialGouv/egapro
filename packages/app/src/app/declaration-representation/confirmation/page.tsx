import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Confirmation } from "~/modules/declaration-representation";
import {
	getCurrentRepresentationCampaignYear,
	getReferenceYearFor,
	isRepresentationDeclarationSubmitted,
} from "~/modules/domain";
import {
	LAST_REPRESENTATION_STEP,
	representationStepHref,
} from "~/modules/routes";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";

export const metadata: Metadata = {
	title: "Déclaration transmise — Démarche des indicateurs de représentation",
};

export default async function RepresentationConfirmationPage() {
	const campaignYear = getCurrentRepresentationCampaignYear();
	const year = getReferenceYearFor(campaignYear);

	const [session, { declaration }] = await Promise.all([
		auth(),
		api.representationDeclaration.get({ year }),
	]);

	if (
		!declaration ||
		!isRepresentationDeclarationSubmitted(declaration.status)
	) {
		redirect(representationStepHref(LAST_REPRESENTATION_STEP));
	}

	const company = await api.company.get({ siren: declaration.siren });

	return (
		<Confirmation
			campaignYear={campaignYear}
			companyName={company.name}
			email={session?.user?.email ?? null}
			referenceYear={year}
		/>
	);
}
