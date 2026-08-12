import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
	SubjectionScreen,
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

	return <SubjectionScreen campaignYear={campaignYear} />;
}
