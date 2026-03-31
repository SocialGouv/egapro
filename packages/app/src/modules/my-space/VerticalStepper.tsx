import type { PanelVariant } from "./DeclarationProcessPanel";
import styles from "./DeclarationProcessPanel.module.scss";

type StepStatus = "pending" | "current" | "complete";

export function getStepStatuses(
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

export function VerticalStepper({
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
				<Step2Content variant={variant} year={year} />
				<Step3Content variant={variant} year={year} />
			</div>
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
