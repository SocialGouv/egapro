"use client";

import { useRef } from "react";

import styles from "./DeclarationProcessPanel.module.scss";
import { getStepStatuses, VerticalStepper } from "./VerticalStepper";

export const DECLARATION_PROCESS_PANEL_ID = "declaration-process-panel";
const PANEL_TITLE_ID = "declaration-process-panel-title";

export type PanelVariant =
	| "start"
	| "compliance"
	| "evaluation"
	| "cse"
	| "closed";

type Props = {
	year: number;
	lastActionDate: string | null;
	variant: PanelVariant;
	ctaHref: string;
};

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
