import { NextStepsBox } from "~/modules/declaration-remuneration/shared/NextStepsBox";

type Props = {
	hasGapsAboveThreshold: boolean;
	siren: string;
};

export function NextStepsSection({ hasGapsAboveThreshold, siren }: Props) {
	return (
		<NextStepsBox
			hasGapsAboveThreshold={hasGapsAboveThreshold}
			isSecondDeclaration
			siren={siren}
		/>
	);
}
