import type { Metadata } from "next";

import {
	SECOND_DECLARATION_STEP_TITLES,
	SECOND_DECLARATION_TOTAL_STEPS,
	SecondDeclarationStepPage,
} from "~/modules/declaration-remuneration";

type Props = {
	params: Promise<{ step: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { step: stepParam } = await params;
	const step = Number.parseInt(stepParam, 10);
	const stepTitle = SECOND_DECLARATION_STEP_TITLES[step];

	return {
		title: stepTitle
			? `Étape ${step} sur ${SECOND_DECLARATION_TOTAL_STEPS} — ${stepTitle}`
			: "Parcours de mise en conformité",
	};
}

export default async function Page({ params }: Props) {
	const { step: stepParam } = await params;
	const step = Number.parseInt(stepParam, 10);

	return <SecondDeclarationStepPage step={step} />;
}
