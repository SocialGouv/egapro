import { STEP_TITLES } from "../types";
import { getFunnelSteps } from "./funnelSteps";
import styles from "./StepIndicator.module.scss";

type StepIndicatorProps = {
	currentStep: number;
	indicatorGRequired: boolean;
};

export function StepIndicator({
	currentStep,
	indicatorGRequired,
}: StepIndicatorProps) {
	const steps = getFunnelSteps(indicatorGRequired);
	const position = steps.indexOf(currentStep) + 1;
	const nextStep = steps[position];

	const title = STEP_TITLES[currentStep] ?? "";
	const nextTitle = nextStep === undefined ? undefined : STEP_TITLES[nextStep];

	return (
		<div className={`fr-stepper ${styles.stepper}`}>
			<h2 className="fr-stepper__title">
				{title}
				<span className="fr-stepper__state">
					Étape {position} sur {steps.length}
				</span>
			</h2>
			<div
				className="fr-stepper__steps"
				data-fr-current-step={position}
				data-fr-steps={steps.length}
			/>
			{nextTitle && (
				<p className="fr-stepper__details">
					<span className="fr-text--bold">Étape suivante :</span> {nextTitle}
				</p>
			)}
		</div>
	);
}
