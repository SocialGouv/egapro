import type { ReactNode } from "react";

import type { CampaignDeadlines } from "~/modules/domain";
import { isDeadlinePassed } from "~/modules/domain";
import type { PanelVariant } from "./DeclarationProcessPanel";
import styles from "./DeclarationProcessPanel.module.scss";

type StepStatus = "pending" | "current" | "complete";

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
	compliancePath,
	secondDeclarationSubmitted,
	siren,
	step1,
	step2,
	step3,
	variant,
	year,
}: {
	campaignDeadlines: CampaignDeadlines;
	compliancePath: string | null;
	secondDeclarationSubmitted: boolean;
	siren: string;
	step1: StepStatus;
	step2: StepStatus;
	step3: StepStatus;
	variant: PanelVariant;
	year: number;
}) {
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
			<div className={`${styles.stepRow} ${stepRowClass(step2)}`}>
				<StepCircle number={2} status={step2} />
				<Step2Content
					campaignDeadlines={campaignDeadlines}
					compliancePath={compliancePath}
					secondDeclarationSubmitted={secondDeclarationSubmitted}
					siren={siren}
					status={step2}
					variant={variant}
				/>
			</div>
			<div className={`${styles.stepRow} ${stepRowClass(step3)}`}>
				<StepCircle number={3} status={step3} />
				<Step3Content
					campaignDeadlines={campaignDeadlines}
					siren={siren}
					status={step3}
					variant={variant}
				/>
			</div>
		</div>
	);
}

function stepRowClass(status: StepStatus): string {
	if (status === "complete") return styles.stepRowComplete ?? "";
	if (status === "current") return styles.stepRowCurrent ?? "";
	return "";
}

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

function Step1Content({
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
	const refYear = year - 1;
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
					downloadHref="/api/declaration-pdf"
					label="Votre déclaration a été transmise"
					modifiableUntil={campaignDeadlines.decl1ModificationDeadline}
					modifyHref={`/declaration-remuneration/etape/1?siren=${siren}`}
				/>
			</div>
		);
	}

	return title;
}

function Step2Content({
	campaignDeadlines,
	compliancePath,
	secondDeclarationSubmitted,
	siren,
	status,
	variant,
}: {
	campaignDeadlines: CampaignDeadlines;
	compliancePath: string | null;
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
		return (
			<div className={styles.stepContent}>
				{title}
				<DeadlineRow date={campaignDeadlines.decl2ModificationDeadline} />
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

	if (variant === "evaluation") {
		const secondDeclTransmittedRow = secondDeclarationSubmitted ? (
			<TransmittedRow
				downloadHref="/api/declaration-pdf?type=correction"
				label="Votre seconde déclaration a été transmise"
				modifiableUntil={campaignDeadlines.decl2ModificationDeadline}
				modifyHref={`/declaration-remuneration/parcours-conformite/etape/1?siren=${siren}`}
			/>
		) : null;

		// Second-round choice pending: user did corrective_action + 2nd declaration
		// but has not committed to joint evaluation yet. Show transmitted row +
		// choice deadline, no "Évaluation conjointe" bullet.
		if (compliancePath === "corrective_action") {
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

	// cse / closed variants: step 2 is complete — show what was actually done
	return (
		<div className={styles.stepContent}>
			{title}
			{secondDeclarationSubmitted && (
				<TransmittedRow
					downloadHref="/api/declaration-pdf?type=correction"
					label="Votre seconde déclaration a été transmise"
					modifiableUntil={campaignDeadlines.decl2ModificationDeadline}
					modifyHref={`/declaration-remuneration/parcours-conformite/etape/1?siren=${siren}`}
				/>
			)}
			{compliancePath === "joint_evaluation" && (
				<TransmittedRow
					label="Votre rapport de l'évaluation conjointe a été transmis"
					modifiableUntil={campaignDeadlines.decl2JointEvaluationDeadline}
					modifyHref={`/declaration-remuneration/parcours-conformite/evaluation-conjointe?siren=${siren}`}
				/>
			)}
			{compliancePath === "justify" && (
				<div className={styles.bulletItem}>
					<span aria-hidden="true" className={styles.bullet} />
					<p className="fr-mb-0">Justification des écarts de rémunération</p>
				</div>
			)}
		</div>
	);
}

function Step3Content({
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

function TransmittedRow({
	label,
	modifiableUntil,
	modifyHref,
	downloadHref,
}: {
	label: string;
	modifiableUntil: Date;
	modifyHref: string;
	downloadHref?: string;
}) {
	const deadlinePassed = isDeadlinePassed(modifiableUntil);

	return (
		<div className={styles.transmittedRow}>
			<span aria-hidden="true" className="fr-icon-check-line fr-icon--sm" />
			<div className={styles.transmittedInfo}>
				<p className="fr-mb-0">{label}</p>
				<p className="fr-text-mention--grey fr-mb-0">
					{deadlinePassed
						? "Modification close depuis le "
						: "Modifiable jusqu'au "}
					<OrdinalLongDate date={modifiableUntil} />
				</p>
			</div>
			<div className={styles.transmittedActions}>
				{downloadHref && (
					<a
						className="fr-btn fr-btn--secondary fr-icon-download-line"
						download
						href={downloadHref}
						title="Télécharger"
					>
						Télécharger
					</a>
				)}
				{!deadlinePassed && (
					<a className="fr-btn fr-btn--secondary" href={modifyHref}>
						Modifier
					</a>
				)}
			</div>
		</div>
	);
}

function DeadlineRow({ date }: { date: Date }) {
	return (
		<div className={styles.deadlineRow}>
			<span aria-hidden="true" className="fr-icon-calendar-line fr-icon--sm" />
			<p className="fr-text--sm fr-text-mention--grey fr-mb-0">
				Échéance : <OrdinalLongDate date={date} />
			</p>
		</div>
	);
}

function OrdinalLongDate({ date }: { date: Date }) {
	const day = date.getDate();
	const suffix = day === 1 ? "er" : "e";
	const monthYear = date.toLocaleDateString("fr-FR", {
		month: "long",
		year: "numeric",
	});
	return (
		<>
			{day}
			<sup>{suffix}</sup> {monthYear}
		</>
	);
}
