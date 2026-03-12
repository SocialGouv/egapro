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
		const [session, { opinions }] = await Promise.all([
			auth(),
			api.cseOpinion.get(),
		]);
		const initialData = mapOpinionsFromDb(opinions);
		return (
			<Step1Opinions
				email={session?.user?.email ?? undefined}
				initialData={initialData}
			/>
		);
	}

	if (step === 2) {
		const { files } = await api.cseOpinion.getFiles();
		return <Step2Upload existingFiles={files} />;
	}

	notFound();
}
