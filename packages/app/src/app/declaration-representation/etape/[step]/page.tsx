import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import {
	getStepDefinition,
	isValidStep,
	representationDraftSchema,
	StepPageClient,
	stepHref,
	TOTAL_REPRESENTATION_STEPS,
} from "~/modules/declaration-representation";
import { getCurrentYear, getReferenceYearFor } from "~/modules/domain";
import { api } from "~/trpc/server";

type StepPageProps = {
	params: Promise<{ step: string }>;
};

export async function generateMetadata({
	params,
}: StepPageProps): Promise<Metadata> {
	const { step: stepParam } = await params;
	const definition = getStepDefinition(Number.parseInt(stepParam, 10));

	return {
		title: definition
			? `Étape ${stepParam} sur ${TOTAL_REPRESENTATION_STEPS} — ${definition.title}`
			: "Démarche des indicateurs de représentation équilibrée",
	};
}

export default async function RepresentationStepPage({
	params,
}: StepPageProps) {
	const { step: stepParam } = await params;
	const step = Number.parseInt(stepParam, 10);

	if (!isValidStep(step)) {
		notFound();
	}

	const campaignYear = getCurrentYear();
	const year = getReferenceYearFor(campaignYear);

	const { declaration, campaignOpen } = await api.representationDeclaration.get(
		{ year },
	);

	if (!campaignOpen) {
		if (step !== TOTAL_REPRESENTATION_STEPS) {
			redirect(stepHref(TOTAL_REPRESENTATION_STEPS));
		}
	} else {
		const reachableStep = Math.max(declaration?.currentStep ?? 0, 1);
		if (step > reachableStep) {
			redirect(stepHref(reachableStep));
		}
	}

	const parsedDraft = representationDraftSchema.safeParse(declaration?.draft);

	return (
		<StepPageClient
			campaignOpen={campaignOpen}
			campaignYear={campaignYear}
			initialDraft={
				parsedDraft.success ? parsedDraft.data : { currentStep: step }
			}
			step={step}
			year={year}
		/>
	);
}
