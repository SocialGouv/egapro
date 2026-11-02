import { notFound } from "next/navigation";
import { campaignYearDimension, FunnelStepTracker } from "~/modules/analytics";
import {
	CSE_FUNNEL,
	computeContentTypeColumns,
	computeJustificationRequirements,
	getSubmissionBannerState,
	mapOpinionsFromDb,
	Step1Opinions,
	Step2Upload,
} from "~/modules/cseOpinion";
import { computeGapHighFlags } from "~/modules/domain";
import { toCseOpinionStep } from "~/modules/routes";
import { auth } from "~/server/auth";
import { getCampaignDeadlines } from "~/server/db/getCampaignDeadlines";
import { api } from "~/trpc/server";

type StepPageProps = {
	params: Promise<{ step: string }>;
};

export const metadata = { title: "Déclaration d'un avis du CSE" };

type DeclarationData = Awaited<ReturnType<typeof api.declaration.getOrCreate>>;

function getJustificationRequirements({
	declaration,
	employeeCategories,
}: DeclarationData) {
	return computeJustificationRequirements({
		firstDeclarationGapJustification:
			declaration.firstDeclarationGapJustification,
		secondDeclarationGapJustification:
			declaration.secondDeclarationGapJustification,
		...computeGapHighFlags(employeeCategories),
	});
}

export default async function CseOpinionStepPage({ params }: StepPageProps) {
	const { step: stepParam } = await params;
	const step = toCseOpinionStep(Number.parseInt(stepParam, 10));

	if (step === null) {
		notFound();
	}

	if (step === 1) {
		const [session, { opinions }, declarationData] = await Promise.all([
			auth(),
			api.cseOpinion.get(),
			api.declaration.getOrCreate(),
		]);
		const initialData = mapOpinionsFromDb(opinions);
		const requirements = getJustificationRequirements(declarationData);
		const banner = getSubmissionBannerState({
			...declarationData.declaration,
			hasSubmittedSecondDeclaration:
				declarationData.hasSubmittedSecondDeclaration,
		});
		const campaignDeadlines = await getCampaignDeadlines(
			declarationData.declaration.year,
		);
		return (
			<>
				<FunnelStepTracker
					config={CSE_FUNNEL}
					dimensions={campaignYearDimension(declarationData.declaration.year)}
					step={step}
				/>
				<Step1Opinions
					banner={banner}
					cseDeadline={campaignDeadlines.decl2CseOpinionDeadline}
					email={session?.user?.email ?? undefined}
					firstDeclJustificationRequired={
						requirements.firstDeclJustificationRequired
					}
					hasSecondDeclaration={declarationData.hasSubmittedSecondDeclaration}
					initialData={initialData}
					secondDeclJustificationRequired={
						requirements.secondDeclJustificationRequired
					}
					siren={declarationData.declaration.siren}
					year={declarationData.declaration.year}
				/>
			</>
		);
	}

	if (step === 2) {
		const [declarationData, { files }, { associations }] = await Promise.all([
			api.declaration.getOrCreate(),
			api.cseOpinion.getFiles(),
			api.cseOpinion.getFileContentTypes(),
		]);
		const columns = computeContentTypeColumns({
			hasSecondDeclaration: declarationData.hasSubmittedSecondDeclaration,
			...getJustificationRequirements(declarationData),
		});
		return (
			<>
				<FunnelStepTracker
					config={CSE_FUNNEL}
					dimensions={campaignYearDimension(declarationData.declaration.year)}
					step={step}
				/>
				<Step2Upload
					columns={columns}
					declarationYear={declarationData.declaration.year}
					existingFiles={files}
					initialAssociations={associations}
					siren={declarationData.declaration.siren}
				/>
			</>
		);
	}

	notFound();
}
