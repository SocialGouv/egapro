import { notFound } from "next/navigation";
import { campaignYearDimension, FunnelStepTracker } from "~/modules/analytics";
import {
	CSE_FUNNEL,
	mapOpinionsFromDb,
	Step1Opinions,
	Step2Upload,
	TOTAL_STEPS,
} from "~/modules/cseOpinion";
import { getCseOpinionPreviousHref } from "~/modules/declaration-remuneration/shared/complianceNavigation";
import { auth } from "~/server/auth";
import { getCampaignDeadlines } from "~/server/db/getCampaignDeadlines";
import { api } from "~/trpc/server";

type StepPageProps = {
	params: Promise<{ step: string }>;
};

export default async function CseOpinionStepPage({ params }: StepPageProps) {
	const { step: stepParam } = await params;
	const step = Number.parseInt(stepParam, 10);

	if (Number.isNaN(step) || step < 1 || step > TOTAL_STEPS) {
		notFound();
	}

	if (step === 1) {
		const [session, { opinions }, declarationData] = await Promise.all([
			auth(),
			api.cseOpinion.get(),
			api.declaration.getOrCreate(),
		]);
		const initialData = mapOpinionsFromDb(opinions);
		const hasSecondDeclaration = declarationData.hasSubmittedSecondDeclaration;
		const campaignDeadlines = await getCampaignDeadlines(
			declarationData.declaration.year,
		);
		const previousHref = getCseOpinionPreviousHref({
			firstDeclarationPathChoice:
				declarationData.declaration.firstDeclarationPathChoice,
			secondDeclarationPathChoice:
				declarationData.declaration.secondDeclarationPathChoice,
			hasSubmittedSecondDeclaration: hasSecondDeclaration,
		});
		return (
			<>
				<FunnelStepTracker
					config={CSE_FUNNEL}
					dimensions={campaignYearDimension(declarationData.declaration.year)}
					step={step}
				/>
				<Step1Opinions
					cseDeadline={campaignDeadlines.decl2JointEvaluationDeadline}
					email={session?.user?.email ?? undefined}
					firstDeclarationPathChoice={
						declarationData.declaration.firstDeclarationPathChoice
					}
					hasSecondDeclaration={hasSecondDeclaration}
					initialData={initialData}
					previousHref={previousHref}
					siren={declarationData.declaration.siren}
					year={declarationData.declaration.year}
				/>
			</>
		);
	}

	if (step === 2) {
		const [declarationData, { files }] = await Promise.all([
			api.declaration.getOrCreate(),
			api.cseOpinion.getFiles(),
		]);
		const hasSecondDeclaration = declarationData.hasSubmittedSecondDeclaration;
		return (
			<>
				<FunnelStepTracker
					config={CSE_FUNNEL}
					dimensions={campaignYearDimension(declarationData.declaration.year)}
					step={step}
				/>
				<Step2Upload
					declarationYear={declarationData.declaration.year}
					existingFiles={files}
					hasSecondDeclaration={hasSecondDeclaration}
					siren={declarationData.declaration.siren}
				/>
			</>
		);
	}

	notFound();
}
