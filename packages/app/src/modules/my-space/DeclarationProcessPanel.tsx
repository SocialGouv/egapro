"use client";

import { useRef } from "react";

import styles from "./DeclarationProcessPanel.module.scss";

export const DECLARATION_PROCESS_PANEL_ID = "declaration-process-panel";
const PANEL_TITLE_ID = "declaration-process-panel-title";

export type PanelVariant =
	| "start"
	| "compliance"
	| "evaluation"
	| "cse"
	| "closed";

type StepStatus = "pending" | "current" | "complete";

type Props = {
	year: number;
	lastActionDate: string | null;
	variant: PanelVariant;
	ctaHref: string;
};

function getStepStatuses(
	variant: PanelVariant,
): [StepStatus, StepStatus, StepStatus] {
	switch (variant) {
		case "start":
			return ["current", "pending", "pending"];
		case "compliance":
		case "evaluation":
			return ["complete", "current", "pending"];
		case "cse":
			return ["complete", "complete", "current"];
		case "closed":
			return ["complete", "complete", "complete"];
	}
}

export function DeclarationProcessPanel({
	year,
	lastActionDate,
	variant,
	ctaHref,
}: Props) {
	const dialogRef = useRef<HTMLDialogElement>(null);

	const [step1, step2, step3] = getStepStatuses(variant);

	return (
		<dialog
			aria-labelledby={PANEL_TITLE_ID}
			aria-modal="true"
			className={`fr-modal ${styles.sidePanel}`}
			id={DECLARATION_PROCESS_PANEL_ID}
			ref={dialogRef}
		>
			<div className={styles.panelContainer}>
				<div className={styles.panelHeader}>
					<button
						aria-controls={DECLARATION_PROCESS_PANEL_ID}
						className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-btn--icon-right fr-icon-close-line"
						title="Fermer"
						type="button"
					>
						Fermer
					</button>
				</div>
				<div className={styles.panelContent}>
					<div>
						<PanelHeader lastActionDate={lastActionDate} year={year} />
						{variant === "start" && <StartAlert />}
						<VerticalStepper
							step1={step1}
							step2={step2}
							step3={step3}
							variant={variant}
							year={year}
						/>
						{variant === "closed" && <ClosedMessage />}
					</div>
					<div>
						<HelpSection />
						<div className={styles.footer}>
							<a className="fr-btn" href={ctaHref}>
								{variant === "closed"
									? "Voir la déclaration"
									: "Commencer la déclaration"}
							</a>
						</div>
					</div>
				</div>
			</div>
		</dialog>
	);
}

function PanelHeader({
	year,
	lastActionDate,
}: {
	year: number;
	lastActionDate: string | null;
}) {
	return (
		<div className="fr-mb-4w">
			<h2 className="fr-h5 fr-mb-1w" id={PANEL_TITLE_ID}>
				Démarche des indicateurs de rémunération {year}
			</h2>
			{lastActionDate && (
				<p className="fr-text--sm fr-text-mention--grey fr-mb-0">
					<span
						aria-hidden="true"
						className="fr-icon-time-line fr-icon--sm fr-mr-1v"
					/>
					Dernière action le {lastActionDate}
				</p>
			)}
		</div>
	);
}

function StartAlert() {
	return (
		<div className="fr-alert fr-alert--info fr-mb-4w">
			<p>
				Vous devez au préalable disposer d'un accord d'entreprise, de branche
				ou, à défaut, d'une décision unilatérale déterminant les catégories
				applicables au sein de votre entreprise.
			</p>
		</div>
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

	return (
		<div className={`${styles.stepCircle} ${statusClass}`}>
			{status === "complete" ? (
				<span aria-hidden="true" className="fr-icon-check-line fr-icon--sm" />
			) : (
				number
			)}
		</div>
	);
}

function VerticalStepper({
	step1,
	step2,
	step3,
	variant,
	year,
}: {
	step1: StepStatus;
	step2: StepStatus;
	step3: StepStatus;
	variant: PanelVariant;
	year: number;
}) {
	return (
		<div className={`${styles.stepper} fr-mb-4w`}>
			<div className={styles.stepIndicators}>
				<StepCircle number={1} status={step1} />
				<div className={styles.stepLine} />
				<StepCircle number={2} status={step2} />
				<div className={styles.stepLine} />
				<StepCircle number={3} status={step3} />
			</div>
			<div className={styles.stepContents}>
				<Step1Content status={step1} variant={variant} year={year} />
				<Step2Content status={step2} variant={variant} year={year} />
				<Step3Content variant={variant} year={year} />
			</div>
		</div>
	);
}

function Step1Content({
	status,
	variant,
	year,
}: {
	status: StepStatus;
	variant: PanelVariant;
	year: number;
}) {
	const refYear = year - 1;

	if (variant === "start") {
		return (
			<div className={styles.stepContent}>
				<div>
					<p className="fr-text--bold fr-mb-0">
						Déclaration des indicateurs de rémunération
					</p>
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
				<DeadlineRow date={`1er juin ${year}`} />
			</div>
		);
	}

	if (status === "complete") {
		return (
			<div className={styles.stepContent}>
				<p className="fr-text--bold fr-mb-0">
					Déclaration des indicateurs de rémunération
				</p>
				{variant !== "closed" && (
					<TransmittedRow
						label="Votre déclaration a été transmise"
						modifiableUntil={`1er juin ${year}`}
					/>
				)}
			</div>
		);
	}

	return (
		<p className="fr-text--bold fr-mb-0">
			Déclaration des indicateurs de rémunération
		</p>
	);
}

function Step2Content({
	variant,
	year,
}: {
	status: StepStatus;
	variant: PanelVariant;
	year: number;
}) {
	const title = (
		<p className="fr-text--bold fr-mb-0">
			Parcours de mise en conformité pour l'indicateur par catégorie de salariés
			si écarts &ge; 5&nbsp;%
		</p>
	);

	if (variant === "closed" || variant === "start") {
		return title;
	}

	if (variant === "compliance") {
		return (
			<div className={styles.stepContent}>
				{title}
				<div className={styles.bulletItem}>
					<span aria-hidden="true" className={styles.bullet} />
					<p className="fr-mb-0">Actions correctives et seconde déclaration</p>
				</div>
				<DeadlineRow date={`1er décembre ${year}`} />
			</div>
		);
	}

	if (variant === "evaluation") {
		return (
			<div className={styles.stepContent}>
				{title}
				<TransmittedRow
					label="Votre seconde déclaration a été transmise"
					modifiableUntil={`1er décembre ${year}`}
				/>
				<div className={styles.bulletItem}>
					<span aria-hidden="true" className={styles.bullet} />
					<p className="fr-mb-0">Évaluation conjointe des rémunérations</p>
				</div>
				<DeadlineRow date={`1er février ${year + 1}`} />
			</div>
		);
	}

	// cse variant: step 2 is complete
	return (
		<div className={styles.stepContent}>
			{title}
			<TransmittedRow
				label="Votre seconde déclaration a été transmise"
				modifiableUntil={`1er décembre ${year}`}
			/>
			<TransmittedRow
				hideDownload
				label="Votre rapport de l'évaluation conjointe a été transmise"
				modifiableUntil={`1er décembre ${year}`}
			/>
		</div>
	);
}

function Step3Content({
	variant,
	year,
}: {
	variant: PanelVariant;
	year: number;
}) {
	const title = (
		<p className="fr-text--bold fr-mb-0">Déposer le ou les avis du CSE</p>
	);

	if (
		variant === "closed" ||
		variant === "start" ||
		variant === "compliance" ||
		variant === "evaluation"
	) {
		return title;
	}

	// cse variant
	return (
		<div className={styles.stepContent}>
			{title}
			<DeadlineRow date={`1er février ${year + 1}`} />
		</div>
	);
}

function TransmittedRow({
	label,
	modifiableUntil,
	hideDownload,
}: {
	label: string;
	modifiableUntil: string;
	hideDownload?: boolean;
}) {
	return (
		<div className={styles.transmittedRow}>
			<span
				aria-hidden="true"
				className="fr-icon-check-line fr-icon--sm fr-mt-1v"
			/>
			<div className={styles.transmittedInfo}>
				<p className="fr-mb-0">{label}</p>
				<p className="fr-text-mention--grey fr-mb-0">
					Modifiable jusqu'au {modifiableUntil}
				</p>
			</div>
			<div className={styles.transmittedActions}>
				{!hideDownload && (
					<button
						className="fr-btn fr-btn--secondary fr-icon-download-line"
						title="Télécharger"
						type="button"
					>
						Télécharger
					</button>
				)}
				<button className="fr-btn fr-btn--secondary" type="button">
					Modifier
				</button>
			</div>
		</div>
	);
}

function DeadlineRow({ date }: { date: string }) {
	return (
		<div className={styles.deadlineRow}>
			<span aria-hidden="true" className="fr-icon-calendar-line fr-icon--sm" />
			<p className="fr-text--sm fr-text-mention--grey fr-mb-0">
				Échéance : {date}
			</p>
		</div>
	);
}

function ClosedMessage() {
	return (
		<div className={styles.closedMessage}>
			<p className="fr-text--bold fr-mb-0">Démarche close</p>
			<p className="fr-mb-0">
				Cette démarche est terminée, aucune modification n'est possible.
			</p>
		</div>
	);
}

function HelpSection() {
	return (
		<div className={styles.helpSection}>
			<hr className="fr-hr" />
			<p className="fr-text--lg fr-text--bold fr-mb-0">Pour vous aider</p>
			<div className={styles.helpLinks}>
				<button className="fr-link" type="button">
					Détail des étapes
				</button>
				<button className="fr-link" type="button">
					Centre d'aide
				</button>
			</div>
		</div>
	);
}
