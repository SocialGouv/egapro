import {
	SECOND_DECLARATION_STEP_TITLES,
	SECOND_DECLARATION_TOTAL_STEPS,
} from "./constants";

type Props = {
	currentStep: 1 | 2 | 3;
};

export function SecondDeclarationStepIndicator({ currentStep }: Props) {
	const title = SECOND_DECLARATION_STEP_TITLES[currentStep] ?? "";
	const nextTitle =
		currentStep < SECOND_DECLARATION_TOTAL_STEPS
			? SECOND_DECLARATION_STEP_TITLES[currentStep + 1]
			: undefined;

	return (
		<div className="fr-stepper fr-mb-3w">
			<h2 className="fr-stepper__title">
				{title}
				<span className="fr-stepper__state">
					Étape {currentStep} sur {SECOND_DECLARATION_TOTAL_STEPS}
				</span>
			</h2>
			<div
				className="fr-stepper__steps"
				data-fr-current-step={currentStep}
				data-fr-steps={SECOND_DECLARATION_TOTAL_STEPS}
			/>
			{nextTitle && (
				<p className="fr-stepper__details">
					<span className="fr-text--bold">Étape suivante :</span> {nextTitle}
				</p>
			)}
		</div>
	);
}
