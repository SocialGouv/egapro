import { SecondDeclarationStepPage } from "~/modules/declaration-remuneration";

type Props = {
	params: Promise<{ step: string }>;
};

export default async function Page({ params }: Props) {
	const { step: stepParam } = await params;
	const step = Number.parseInt(stepParam, 10);

	return <SecondDeclarationStepPage step={step} />;
}
