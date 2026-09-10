import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Confirmation } from "~/modules/declaration-representation";
import {
	getCurrentYear,
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
	const campaignYear = getCurrentYear();
	const year = getReferenceYearFor(campaignYear);

	const [session, { declaration }] = await Promise.all([
		auth(),
		api.representationDeclaration.get({ year }),
	]);

	if (!isRepresentationDeclarationSubmitted(declaration?.status)) {
		redirect(representationStepHref(LAST_REPRESENTATION_STEP));
	}

	return (
		<Confirmation
			campaignYear={campaignYear}
			email={session?.user?.email ?? null}
			referenceYear={year}
		/>
	);
}
