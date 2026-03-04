import { notFound } from "next/navigation";
import { Step1Opinions, Step2Upload, TOTAL_STEPS } from "~/modules/cseOpinion";

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
		return <Step1Opinions />;
	}

	if (step === 2) {
		return <Step2Upload />;
	}

	notFound();
}
