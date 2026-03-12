import { notFound } from "next/navigation";
import {
	mapOpinionsFromDb,
	Step1Opinions,
	Step2Upload,
	TOTAL_STEPS,
} from "~/modules/cseOpinion";
import { auth } from "~/server/auth";
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
		const hasSecondDeclaration =
			declarationData.declaration.secondDeclarationStatus === "submitted";
		return (
			<Step1Opinions
				compliancePath={declarationData.declaration.compliancePath}
				email={session?.user?.email ?? undefined}
				hasSecondDeclaration={hasSecondDeclaration}
				initialData={initialData}
			/>
		);
	}

	if (step === 2) {
		const declarationData = await api.declaration.getOrCreate();
		const hasSecondDeclaration =
			declarationData.declaration.secondDeclarationStatus === "submitted";
		return <Step2Upload hasSecondDeclaration={hasSecondDeclaration} />;
	}

	notFound();
}
