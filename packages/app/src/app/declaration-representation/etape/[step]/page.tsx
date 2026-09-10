import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import {
	getStepDefinition,
	parseStepParam,
	representationDraftFromDeclaration,
	StepPageClient,
	TOTAL_REPRESENTATION_STEPS,
} from "~/modules/declaration-representation";
import { getCurrentYear, getReferenceYearFor } from "~/modules/domain";
import {
	clampRepresentationStep,
	LAST_REPRESENTATION_STEP,
	representationStepHref,
} from "~/modules/routes";
import { api } from "~/trpc/server";

type StepPageProps = {
	params: Promise<{ step: string }>;
};

export async function generateMetadata({
	params,
}: StepPageProps): Promise<Metadata> {
	const { step: stepParam } = await params;
	const step = parseStepParam(stepParam);
	const definition = step === undefined ? undefined : getStepDefinition(step);

	return {
		title: definition
			? `Étape ${step} sur ${TOTAL_REPRESENTATION_STEPS} — ${definition.title}`
			: "Démarche des indicateurs de représentation équilibrée",
	};
}

export default async function RepresentationStepPage({
	params,
}: StepPageProps) {
	const { step: stepParam } = await params;
	const step = parseStepParam(stepParam);

	if (step === undefined) {
		notFound();
	}

	const campaignYear = getCurrentYear();
	const year = getReferenceYearFor(campaignYear);

	const { declaration, campaignOpen } = await api.representationDeclaration.get(
		{ year },
	);

	if (!campaignOpen) {
		if (step !== LAST_REPRESENTATION_STEP) {
			redirect(representationStepHref(LAST_REPRESENTATION_STEP));
		}
	} else {
		const reachableStep = clampRepresentationStep(
			declaration?.currentStep ?? 0,
		);
		if (step > reachableStep) {
			redirect(representationStepHref(reachableStep));
		}
	}

	return (
		<StepPageClient
			campaignOpen={campaignOpen}
			campaignYear={campaignYear}
			initialDraft={representationDraftFromDeclaration(declaration, step)}
			isSubmitted={declaration?.status === "submitted"}
			step={step}
			year={year}
		/>
	);
}
