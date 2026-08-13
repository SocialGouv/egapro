import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
	Confirmation,
	stepHref,
	TOTAL_REPRESENTATION_STEPS,
} from "~/modules/declaration-representation";
import { getCurrentYear, getReferenceYearFor } from "~/modules/domain";
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

	if (declaration?.status !== "submitted") {
		redirect(stepHref(TOTAL_REPRESENTATION_STEPS));
	}

	return (
		<Confirmation
			campaignYear={campaignYear}
			email={session?.user?.email ?? null}
			referenceYear={year}
		/>
	);
}
