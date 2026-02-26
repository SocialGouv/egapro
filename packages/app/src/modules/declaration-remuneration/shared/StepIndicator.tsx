import { STEP_TITLES, TOTAL_STEPS } from "../types";

type StepIndicatorProps = {
	currentStep: number;
};

export function StepIndicator({ currentStep }: StepIndicatorProps) {
	const title = STEP_TITLES[currentStep] ?? "";
	const nextTitle =
		currentStep < TOTAL_STEPS ? STEP_TITLES[currentStep + 1] : undefined;

	return (
		<div className="fr-stepper fr-mb-3w">
			<h2 className="fr-stepper__title">
				{title}
				<span className="fr-stepper__state">
					Étape {currentStep} sur {TOTAL_STEPS}
				</span>
			</h2>
			<div
				className="fr-stepper__steps"
				data-fr-current-step={currentStep}
				data-fr-steps={TOTAL_STEPS}
			/>
			{nextTitle && (
				<p className="fr-stepper__details">
					<span className="fr-text--bold">Étape suivante :</span> {nextTitle}
				</p>
			)}
		</div>
	);
}
