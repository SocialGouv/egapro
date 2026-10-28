import { SUBMIT_LABEL } from "~/modules/shared";
import { STEP_TITLES, TOTAL_STEPS } from "../types";

type Props = {
	currentStep: number;
};

export function CseStepIndicator({ currentStep }: Props) {
	const title = STEP_TITLES[currentStep] ?? "";
	const nextTitle =
		currentStep < TOTAL_STEPS ? STEP_TITLES[currentStep + 1] : SUBMIT_LABEL;

	return (
		<div className="fr-stepper fr-mb-0">
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
			<p className="fr-stepper__details">
				<span className="fr-text--bold">Étape suivante :</span> {nextTitle}
			</p>
		</div>
	);
}
