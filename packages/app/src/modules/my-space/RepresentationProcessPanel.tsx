"use client";

import { useRef } from "react";

import type { RepresentationCampaign } from "~/modules/domain";
import {
	formatLongDate,
	isRepresentationCampaignOpen,
	REPRESENTATION_TARGET_INITIAL,
	REPRESENTATION_TARGET_RAISED,
	REPRESENTATION_TARGET_RAISED_FROM_CAMPAIGN_YEAR,
} from "~/modules/domain";
import styles from "./DeclarationProcessPanel.module.scss";
import {
	computeRepresentationCtaHref,
	computeRepresentationPanelVariant,
	type RepresentationPanelVariant,
} from "./declarationProcessState";
import type { DeclarationItem } from "./types";

export const REPRESENTATION_PROCESS_PANEL_ID = "representation-process-panel";
const PANEL_TITLE_ID = "representation-process-panel-title";

type Props = {
	campaign: RepresentationCampaign;
	campaignYear: number;
	declaration: DeclarationItem | undefined;
};

type StepStatus = "pending" | "current" | "complete";

function getStepStatuses(
	variant: RepresentationPanelVariant,
): [StepStatus, StepStatus] {
	switch (variant) {
		case "start":
			return ["current", "pending"];
		case "draft":
			return ["complete", "current"];
		case "submitted":
		case "closed":
			return ["complete", "complete"];
	}
}

function getCtaLabel(variant: RepresentationPanelVariant): string {
	if (variant === "start") return "Commencer";
	if (variant === "draft") return "Reprendre";
	return "Voir la déclaration";
}

export function RepresentationProcessPanel({
	campaign,
	campaignYear,
	declaration,
}: Props) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const campaignOpen = isRepresentationCampaignOpen(campaign, new Date());
	const variant = computeRepresentationPanelVariant(declaration, campaignOpen);
	const ctaHref = computeRepresentationCtaHref(declaration, campaignOpen);
	const [step1, step2] = getStepStatuses(variant);
	const lastActionDate = declaration?.updatedAt
		? formatLongDate(declaration.updatedAt)
		: null;

	return (
		<dialog
			aria-labelledby={PANEL_TITLE_ID}
			aria-modal="true"
			className={`fr-modal ${styles.sidePanel}`}
			id={REPRESENTATION_PROCESS_PANEL_ID}
			ref={dialogRef}
		>
			<div className={styles.panelContainer}>
				<div className={styles.panelHeader}>
					<button
						aria-controls={REPRESENTATION_PROCESS_PANEL_ID}
						className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-btn--icon-right fr-icon-close-line"
						title="Fermer"
						type="button"
					>
						Fermer
					</button>
				</div>
				<div className={styles.panelContent}>
					<div>
						<PanelHeader
							campaignYear={campaignYear}
							lastActionDate={lastActionDate}
						/>
						<RixainAlert />
						<div className={`${styles.stepper} fr-mb-4w`}>
							<Step1Row status={step1} />
							<Step2Row
								deadline={campaign.declarationDeadline}
								status={step2}
							/>
						</div>
						{variant === "closed" && <ClosedMessage />}
					</div>
					<div>
						<HelpSection />
						<div className={styles.footer}>
							<a
								aria-describedby={PANEL_TITLE_ID}
								className="fr-btn"
								href={ctaHref}
							>
								{getCtaLabel(variant)}
							</a>
						</div>
					</div>
				</div>
			</div>
		</dialog>
	);
}

function PanelHeader({
	campaignYear,
	lastActionDate,
}: {
	campaignYear: number;
	lastActionDate: string | null;
}) {
	return (
		<div className="fr-mb-4w">
			<h2 className="fr-h5 fr-mb-1w" id={PANEL_TITLE_ID}>
				Démarche des indicateurs de représentation {campaignYear}
			</h2>
			{lastActionDate && (
				<div className={styles.lastAction}>
					<span aria-hidden="true" className="fr-icon-time-line fr-icon--sm" />
					<span>Dernière action le {lastActionDate}</span>
				</div>
			)}
		</div>
	);
}

function RixainAlert() {
	return (
		<div className="fr-alert fr-alert--info fr-mb-4w">
			<p>
				La loi Rixain (n° 2021-1774) impose aux entreprises de 1 000 salariés et
				plus, pendant trois années consécutives, de publier chaque année les
				écarts de représentation entre les femmes et les hommes parmi les cadres
				dirigeants et au sein des instances dirigeantes. Les seuils à atteindre
				sont de{" "}
				<strong>
					{REPRESENTATION_TARGET_INITIAL} % minimum de chaque sexe
				</strong>{" "}
				dès l'entrée en vigueur de l'obligation, puis de{" "}
				<strong>{REPRESENTATION_TARGET_RAISED} % minimum de chaque sexe</strong>{" "}
				à compter du 1ᵉʳ mars {REPRESENTATION_TARGET_RAISED_FROM_CAMPAIGN_YEAR}.
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

function stepRowClass(status: StepStatus): string {
	return status === "complete" ? (styles.stepRowComplete ?? "") : "";
}

function StepTitle({
	children,
	status,
}: {
	children: React.ReactNode;
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

function Step1Row({ status }: { status: StepStatus }) {
	return (
		<div className={`${styles.stepRow} ${stepRowClass(status)}`}>
			<StepCircle number={1} status={status} />
			<StepTitle status={status}>Vérification de l'assujettissement</StepTitle>
		</div>
	);
}

const STEP2_ITEMS = [
	"Cadres dirigeants",
	"Instances dirigeantes",
	"Informations de publication",
];

function Step2Row({
	deadline,
	status,
}: {
	deadline: Date;
	status: StepStatus;
}) {
	return (
		<div className={`${styles.stepRow} ${stepRowClass(status)}`}>
			<StepCircle number={2} status={status} />
			<div className={styles.stepContent}>
				<StepTitle status={status}>
					{status === "pending"
						? "Déclaration des écarts de représentation"
						: "Écarts de représentation"}
				</StepTitle>
				{status !== "pending" &&
					STEP2_ITEMS.map((item) => (
						<div className={styles.bulletItem} key={item}>
							<span aria-hidden="true" className={styles.bullet} />
							<p className="fr-mb-0">{item}</p>
						</div>
					))}
				<div className={styles.deadlineRow}>
					<span
						aria-hidden="true"
						className="fr-icon-calendar-line fr-icon--sm"
					/>
					<p className="fr-text--sm fr-text-mention--grey fr-mb-0">
						Échéance : {formatLongDate(deadline)}
					</p>
				</div>
			</div>
		</div>
	);
}

function ClosedMessage() {
	return (
		<div className={styles.closedMessage}>
			<p className="fr-text--bold fr-mb-0">Démarche close</p>
			<p className="fr-mb-0">Cette démarche est terminée.</p>
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
