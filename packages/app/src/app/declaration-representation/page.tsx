import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SubjectionScreen } from "~/modules/declaration-representation";
import { getCurrentYear, getReferenceYearFor } from "~/modules/domain";
import {
	clampRepresentationStep,
	LAST_REPRESENTATION_STEP,
	representationStepHref,
} from "~/modules/routes";
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
		redirect(representationStepHref(LAST_REPRESENTATION_STEP));
	}

	const currentStep = declaration?.currentStep ?? 0;
	if (currentStep >= 1) {
		redirect(representationStepHref(clampRepresentationStep(currentStep)));
	}

	return (
		<SubjectionScreen
			campaignYear={campaignYear}
			initialAnswer={
				declaration?.status === "not_subject" ? "not_concerned" : undefined
			}
			year={year}
		/>
	);
}
