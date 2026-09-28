import { REPRESENTATION_STEPS } from "./steps";
import { TOTAL_REPRESENTATION_STEPS } from "./types";

export function Stepper({ currentStep }: { currentStep: number }) {
	const title = REPRESENTATION_STEPS[currentStep - 1]?.title;
	const nextTitle = REPRESENTATION_STEPS[currentStep]?.title;

	if (title === undefined) return null;

	return (
		<div className="fr-stepper">
			<h2 className="fr-stepper__title">
				{title}
				<span className="fr-stepper__state">
					Étape {currentStep} sur {TOTAL_REPRESENTATION_STEPS}
				</span>
			</h2>
			<div
				className="fr-stepper__steps"
				data-fr-current-step={currentStep}
				data-fr-steps={TOTAL_REPRESENTATION_STEPS}
			/>
			{nextTitle ? (
				<p className="fr-stepper__details">
					<span className="fr-text--bold">Étape suivante :</span> {nextTitle}
				</p>
			) : null}
		</div>
	);
}
