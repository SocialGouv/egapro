import type { ReactNode } from "react";
import type {
	CampaignDeadlines,
	DeclarationDisplayContext,
	DeclarationFsmStatus,
} from "~/modules/domain";
import {
	getReferenceYearFor,
	isJointEvaluationWritable,
	isSecondDeclarationWritable,
	selectPathChoiceDeadline,
} from "~/modules/domain";
import type { PanelVariant } from "./DeclarationProcessPanel";
import styles from "./DeclarationProcessPanel.module.scss";
import type { StepStatus } from "./StepRows";
import { DeadlineRow, TransmittedRow } from "./StepRows";

type CompliancePath = NonNullable<
	DeclarationDisplayContext["firstDeclarationPathChoice"]
>;

/** Panel wording for each compliance path. Shorter than the funnel option
 * titles, and free of the round suffix the table's step labels carry. */
const COMPLIANCE_PATH_LABELS: Record<CompliancePath, string> = {
	corrective_action: "Actions correctives et seconde déclaration",
	joint_evaluation: "Évaluation conjointe des rémunérations",
	justify: "Justification des écarts de rémunération",
};

const PATH_CHOICE_LABEL = "Choix du parcours de mise en conformité";

function StepTitle({
	children,
	status,
}: {
	children: ReactNode;
	status: StepStatus;
}) {
	return (
		<p
			className={`fr-text--bold fr-mb-0 ${status === "pending" ? "fr-text-mention--grey" : ""}`.trim()}
		>
			{children}
		</p>
	);
}

function BulletRow({ children }: { children: ReactNode }) {
	return (
		<div className={styles.bulletItem}>
			<span aria-hidden="true" className={styles.bullet} />
			<p className="fr-mb-0">{children}</p>
		</div>
	);
}

export function Step1Content({
	campaignDeadlines,
	siren,
	status,
	variant,
	year,
}: {
	campaignDeadlines: CampaignDeadlines;
	siren: string;
	status: StepStatus;
	variant: PanelVariant;
	year: number;
}) {
	const refYear = getReferenceYearFor(year);
	const title = (
		<StepTitle status={status}>
			Déclaration des indicateurs de rémunération
		</StepTitle>
	);

	if (variant === "start") {
		return (
			<div className={styles.stepContent}>
				<div>
					{title}
					<p className="fr-text--sm fr-text-mention--grey fr-mb-0">
						Période de référence : 01/01/{refYear} - 31/12/{refYear}.
					</p>
				</div>
				<BulletRow>
					Indicateurs pré-remplis à vérifier et à modifier si nécessaire (issus
					des données DSN)
				</BulletRow>
				<BulletRow>
					Indicateurs de rémunération par catégorie de salariés à remplir
				</BulletRow>
				<DeadlineRow date={campaignDeadlines.decl1ModificationDeadline} />
			</div>
		);
	}

	if (status === "complete") {
		return (
			<div className={styles.stepContent}>
				{title}
				<TransmittedRow
					label="Votre déclaration a été transmise"
					modifiableUntil={campaignDeadlines.decl1ModificationDeadline}
					modifyHref={
						variant === "closed"
							? undefined
							: `/declaration-remuneration/etape/1?siren=${siren}`
					}
					viewHref={`/declaration-remuneration/recapitulatif?siren=${siren}`}
				/>
			</div>
		);
	}

	return title;
}

export function Step2Content({
	campaignDeadlines,
	declarationFsmStatus,
	displayContext,
	secondDeclarationSubmitted,
	siren,
	status,
	variant,
}: {
	campaignDeadlines: CampaignDeadlines;
	declarationFsmStatus: DeclarationFsmStatus | null;
	displayContext: DeclarationDisplayContext;
	secondDeclarationSubmitted: boolean;
	siren: string;
	status: StepStatus;
	variant: PanelVariant;
}) {
	const title = (
		<StepTitle status={status}>
			Parcours de mise en conformité pour l'indicateur par catégorie de salariés
			si écarts &ge; 5&nbsp;%
		</StepTitle>
	);

	if (variant === "start") {
		return title;
	}

	if (variant === "compliance_choice") {
		const pathChoiceDeadline = selectPathChoiceDeadline(
			campaignDeadlines,
			secondDeclarationSubmitted,
		);
		return (
			<div className={styles.stepContent}>
				{title}
				{secondDeclarationSubmitted && (
					<TransmittedRow
						label="Votre seconde déclaration a été transmise"
						modifiableUntil={campaignDeadlines.decl2ModificationDeadline}
						modifyHref={`/declaration-remuneration/parcours-conformite/etape/1?siren=${siren}`}
						viewHref={`/declaration-remuneration/recapitulatif?siren=${siren}&type=correction`}
						viewLabel="Voir le récapitulatif de la seconde déclaration"
					/>
				)}
				<BulletRow>{PATH_CHOICE_LABEL}</BulletRow>
				<DeadlineRow date={pathChoiceDeadline} />
			</div>
		);
	}

	if (variant === "compliance") {
		return (
			<div className={styles.stepContent}>
				{title}
				<BulletRow>{COMPLIANCE_PATH_LABELS.corrective_action}</BulletRow>
				<DeadlineRow date={campaignDeadlines.decl2ModificationDeadline} />
			</div>
		);
	}

	const activeCompliancePath =
		displayContext.secondDeclarationPathChoice ??
		displayContext.firstDeclarationPathChoice;

	if (variant === "evaluation") {
		const jointEvaluationDeadline =
			declarationFsmStatus === "joint_evaluation_chosen"
				? campaignDeadlines.decl1JointEvaluationDeadline
				: campaignDeadlines.decl2JointEvaluationDeadline;
		const secondDeclTransmittedRow = secondDeclarationSubmitted ? (
			<TransmittedRow
				label="Votre seconde déclaration a été transmise"
				modifiableUntil={campaignDeadlines.decl2ModificationDeadline}
				modifyHref={`/declaration-remuneration/parcours-conformite/etape/1?siren=${siren}`}
				viewHref={`/declaration-remuneration/recapitulatif?siren=${siren}&type=correction`}
				viewLabel="Voir le récapitulatif de la seconde déclaration"
			/>
		) : null;

		if (activeCompliancePath === "corrective_action") {
			return (
				<div className={styles.stepContent}>
					{title}
					{secondDeclTransmittedRow}
					<DeadlineRow date={campaignDeadlines.decl2JustificationDeadline} />
				</div>
			);
		}

		return (
			<div className={styles.stepContent}>
				{title}
				{secondDeclTransmittedRow}
				<BulletRow>{COMPLIANCE_PATH_LABELS.joint_evaluation}</BulletRow>
				<DeadlineRow date={jointEvaluationDeadline} />
			</div>
		);
	}

	const secondDeclarationWritable =
		isSecondDeclarationWritable(declarationFsmStatus);
	const jointEvaluationWritable =
		isJointEvaluationWritable(declarationFsmStatus);

	return (
		<div className={styles.stepContent}>
			{title}
			{secondDeclarationSubmitted && (
				<TransmittedRow
					label="Votre seconde déclaration a été transmise"
					modifiableUntil={campaignDeadlines.decl2ModificationDeadline}
					modifyHref={
						secondDeclarationWritable
							? `/declaration-remuneration/parcours-conformite/etape/1?siren=${siren}`
							: undefined
					}
					viewHref={`/declaration-remuneration/recapitulatif?siren=${siren}&type=correction`}
					viewLabel="Voir le récapitulatif de la seconde déclaration"
				/>
			)}
			{displayContext.shouldShowJointEvaluation && (
				<TransmittedRow
					label="Votre rapport de l'évaluation conjointe a été transmis"
					modifiableUntil={campaignDeadlines.decl2JointEvaluationDeadline}
					modifyHref={
						jointEvaluationWritable
							? `/declaration-remuneration/parcours-conformite/evaluation-conjointe?siren=${siren}`
							: undefined
					}
				/>
			)}
			{displayContext.shouldShowGapJustification && (
				<BulletRow>{COMPLIANCE_PATH_LABELS.justify}</BulletRow>
			)}
		</div>
	);
}

export function Step3Content({
	campaignDeadlines,
	siren,
	status,
	variant,
}: {
	campaignDeadlines: CampaignDeadlines;
	siren: string;
	status: StepStatus;
	variant: PanelVariant;
}) {
	const title = (
		<StepTitle status={status}>Déposer le ou les avis du CSE</StepTitle>
	);

	if (
		variant === "start" ||
		variant === "compliance_choice" ||
		variant === "compliance" ||
		variant === "evaluation"
	) {
		return title;
	}

	if (variant === "closed") {
		return (
			<div className={styles.stepContent}>
				{title}
				<TransmittedRow
					label="Vos avis du CSE ont été transmis"
					modifiableUntil={campaignDeadlines.decl2JointEvaluationDeadline}
					modifyHref={`/avis-cse/etape/2?siren=${siren}`}
				/>
			</div>
		);
	}

	// cse variant
	return (
		<div className={styles.stepContent}>
			{title}
			<DeadlineRow date={campaignDeadlines.decl2JointEvaluationDeadline} />
		</div>
	);
}
