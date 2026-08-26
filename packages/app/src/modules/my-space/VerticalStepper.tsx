import type {
	CampaignDeadlines,
	DeclarationDisplayContext,
	DeclarationFsmStatus,
} from "~/modules/domain";
import type { PanelVariant } from "./DeclarationProcessPanel";
import styles from "./DeclarationProcessPanel.module.scss";
import { Step1Content, Step2Content, Step3Content } from "./StepContent";
import type { StepStatus } from "./StepRows";

export function getStepStatuses(
	variant: PanelVariant,
): [StepStatus, StepStatus, StepStatus] {
	switch (variant) {
		case "start":
			return ["current", "pending", "pending"];
		case "compliance_choice":
		case "compliance":
		case "evaluation":
			return ["complete", "current", "pending"];
		case "cse":
			return ["complete", "complete", "current"];
		case "closed":
			return ["complete", "complete", "complete"];
	}
}

export function VerticalStepper({
	campaignDeadlines,
	cseOpinionRequired,
	declarationFsmStatus,
	displayContext,
	indicatorGRequired,
	secondDeclarationSubmitted,
	siren,
	step1,
	step2,
	step3,
	variant,
	year,
}: {
	campaignDeadlines: CampaignDeadlines;
	cseOpinionRequired: boolean;
	declarationFsmStatus: DeclarationFsmStatus | null;
	displayContext: DeclarationDisplayContext;
	indicatorGRequired: boolean;
	secondDeclarationSubmitted: boolean;
	siren: string;
	step1: StepStatus;
	step2: StepStatus;
	step3: StepStatus;
	variant: PanelVariant;
	year: number;
}) {
	const step3Number = indicatorGRequired ? 3 : 2;

	return (
		<div className={`${styles.stepper} fr-mb-4w`}>
			<div className={`${styles.stepRow} ${stepRowClass(step1)}`}>
				<StepCircle number={1} status={step1} />
				<Step1Content
					campaignDeadlines={campaignDeadlines}
					siren={siren}
					status={step1}
					variant={variant}
					year={year}
				/>
			</div>
			{indicatorGRequired && (
				<div className={`${styles.stepRow} ${stepRowClass(step2)}`}>
					<StepCircle number={2} status={step2} />
					<Step2Content
						campaignDeadlines={campaignDeadlines}
						declarationFsmStatus={declarationFsmStatus}
						displayContext={displayContext}
						secondDeclarationSubmitted={secondDeclarationSubmitted}
						siren={siren}
						status={step2}
						variant={variant}
					/>
				</div>
			)}
			{cseOpinionRequired && (
				<div className={`${styles.stepRow} ${stepRowClass(step3)}`}>
					<StepCircle number={step3Number} status={step3} />
					<Step3Content
						campaignDeadlines={campaignDeadlines}
						siren={siren}
						status={step3}
						variant={variant}
					/>
				</div>
			)}
		</div>
	);
}

function stepRowClass(status: StepStatus): string {
	if (status === "complete") return styles.stepRowComplete ?? "";
	return "";
}

function StepCircle({
	status,
	number,
}: {
	status: StepStatus;
	number: number;
}) {
	const statusClass =
		status === "complete"
			? styles.stepCircleComplete
			: status === "current"
				? styles.stepCircleCurrent
				: styles.stepCirclePending;

	const statusLabel =
		status === "complete"
			? "Étape terminée"
			: status === "current"
				? "Étape en cours"
				: "Étape à venir";

	return (
		<div className={`${styles.stepCircle} ${statusClass}`}>
			<span className="fr-sr-only">{statusLabel}</span>
			{status === "complete" ? (
				<span aria-hidden="true" className="fr-icon-check-line fr-icon--sm" />
			) : (
				<span aria-hidden="true">{number}</span>
			)}
		</div>
	);
}
