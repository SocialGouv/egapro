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
import type { JointEvaluationFileInfo, StepStatus } from "./StepRows";
import { DeadlineRow, TransmittedRow } from "./StepRows";

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
				<div className={styles.bulletItem}>
					<span aria-hidden="true" className={styles.bullet} />
					<p className="fr-mb-0">
						Indicateurs pré-remplis à vérifier et à modifier si nécessaire
						(issus des données DSN)
					</p>
				</div>
				<div className={styles.bulletItem}>
					<span aria-hidden="true" className={styles.bullet} />
					<p className="fr-mb-0">
						Indicateurs de rémunération par catégorie de salariés à remplir
					</p>
				</div>
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
	jointEvaluationFile,
	secondDeclarationSubmitted,
	siren,
	status,
	variant,
}: {
	campaignDeadlines: CampaignDeadlines;
	declarationFsmStatus: DeclarationFsmStatus | null;
	displayContext: DeclarationDisplayContext;
	jointEvaluationFile: JointEvaluationFileInfo | null;
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
				<DeadlineRow date={pathChoiceDeadline} />
			</div>
		);
	}

	if (variant === "compliance") {
		return (
			<div className={styles.stepContent}>
				{title}
				<div className={styles.bulletItem}>
					<span aria-hidden="true" className={styles.bullet} />
					<p className="fr-mb-0">Actions correctives et seconde déclaration</p>
				</div>
				<DeadlineRow date={campaignDeadlines.decl2ModificationDeadline} />
			</div>
		);
	}

	const activeCompliancePath =
		displayContext.secondDeclarationPathChoice ??
		displayContext.firstDeclarationPathChoice;

	if (variant === "evaluation") {
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
				<div className={styles.bulletItem}>
					<span aria-hidden="true" className={styles.bullet} />
					<p className="fr-mb-0">Évaluation conjointe des rémunérations</p>
				</div>
				<DeadlineRow date={campaignDeadlines.decl2JointEvaluationDeadline} />
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
					viewHref={
						jointEvaluationFile
							? `/api/v1/files/${jointEvaluationFile.id}`
							: undefined
					}
					viewLabel={
						jointEvaluationFile
							? `Visualiser ${jointEvaluationFile.fileName}`
							: undefined
					}
					viewOpensNewTab
				/>
			)}
			{displayContext.shouldShowGapJustification && (
				<div className={styles.bulletItem}>
					<span aria-hidden="true" className={styles.bullet} />
					<p className="fr-mb-0">Justification des écarts de rémunération</p>
				</div>
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
