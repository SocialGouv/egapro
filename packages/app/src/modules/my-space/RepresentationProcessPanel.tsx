"use client";

import { useRef } from "react";
import { DeclarationLockAlert } from "~/modules/declaration-remuneration/shared/lock/DeclarationLockAlert";
import type { RepresentationCampaign } from "~/modules/domain";
import {
	formatCivilLongDate,
	formatLongDate,
	getCurrentDate,
	isRepresentationCampaignOpen,
	REPRESENTATION_TARGET_INITIAL,
	REPRESENTATION_TARGET_RAISED,
	REPRESENTATION_TARGET_RAISED_FROM_CAMPAIGN_YEAR,
} from "~/modules/domain";
import {
	FIRST_REPRESENTATION_STEP,
	mySpaceRepresentationHref,
	representationStepHref,
} from "~/modules/routes";
import styles from "./DeclarationProcessPanel.module.scss";
import {
	computeRepresentationCtaHref,
	computeRepresentationPanelVariant,
	isRepresentationDeclarationTransmitted,
	type RepresentationPanelVariant,
} from "./declarationProcessState";
import { TransmittedRow } from "./StepRows";
import type { DeclarationItem, LockHolderDisplay } from "./types";

export const REPRESENTATION_PROCESS_PANEL_ID = "representation-process-panel";
const PANEL_TITLE_ID = "representation-process-panel-title";

type Props = {
	campaign: RepresentationCampaign;
	campaignYear: number;
	declaration: DeclarationItem | undefined;
	lockedByOther?: boolean;
	lockHolder?: LockHolderDisplay | null;
};

type StepStatus = "pending" | "current" | "complete";

function getStepStatuses(
	variant: RepresentationPanelVariant,
): [StepStatus, StepStatus | null] {
	switch (variant) {
		case "start":
			return ["current", "pending"];
		case "draft":
			return ["complete", "current"];
		case "submitted":
		case "closed":
			return ["complete", "complete"];
		case "not_subject":
			return ["complete", null];
	}
}

function getCtaLabel(variant: RepresentationPanelVariant): string {
	if (variant === "not_subject") return "Modifier";
	if (variant === "start") return "Commencer";
	if (variant === "draft") return "Continuer";
	return "Voir la déclaration";
}

export function RepresentationProcessPanel({
	campaign,
	campaignYear,
	declaration,
	lockedByOther = false,
	lockHolder = null,
}: Props) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const campaignOpen = isRepresentationCampaignOpen(campaign, getCurrentDate());
	const variant = computeRepresentationPanelVariant(declaration, campaignOpen);
	const ctaHref = computeRepresentationCtaHref(
		declaration,
		campaignOpen,
		campaignYear,
	);
	const transmitted = isRepresentationDeclarationTransmitted(declaration);
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
						{lockedByOther && lockHolder ? (
							<DeclarationLockAlert
								followUp="openToWatch"
								holder={lockHolder}
							/>
						) : null}
						{variant === "start" && <RixainAlert />}
						<div className={`${styles.stepper} fr-mb-4w`}>
							<Step1Row status={step1} />
							{step2 !== null && (
								<Step2Row
									campaignEndDate={campaign.campaignEndDate}
									campaignYear={campaignYear}
									deadline={campaign.declarationDeadline}
									modifiable={variant === "submitted"}
									status={step2}
									transmitted={transmitted}
								/>
							)}
						</div>
						{variant === "not_subject" && <NotSubjectMessage />}
						{variant === "closed" && <ClosedMessage />}
					</div>
					<div>
						<HelpSection />
						{/* A transmitted démarche carries its own two actions in the step row:
						    the footer stays empty so the layout does not collapse. */}
						<div className={styles.footer}>
							{variant !== "submitted" && (
								<a
									aria-describedby={PANEL_TITLE_ID}
									className="fr-btn"
									href={ctaHref}
								>
									{lockedByOther ? "Voir la déclaration" : getCtaLabel(variant)}
								</a>
							)}
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
				dirigeants et au sein des instances dirigeantes.
			</p>
			<p>
				Par ailleurs, les seuils à atteindre sont de{" "}
				<strong>
					{REPRESENTATION_TARGET_INITIAL} % minimum de chaque sexe depuis le 1ᵉʳ
					mars 2026
				</strong>
				, puis de{" "}
				<strong>
					{REPRESENTATION_TARGET_RAISED} % minimum de chaque sexe à compter du
					1ᵉʳ mars {REPRESENTATION_TARGET_RAISED_FROM_CAMPAIGN_YEAR}
				</strong>
				.
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

function Step2Row({
	campaignEndDate,
	campaignYear,
	deadline,
	modifiable,
	status,
	transmitted,
}: {
	campaignEndDate: Date;
	campaignYear: number;
	deadline: Date;
	modifiable: boolean;
	status: StepStatus;
	transmitted: boolean;
}) {
	return (
		<div className={`${styles.stepRow} ${stepRowClass(status)}`}>
			<StepCircle number={2} status={status} />
			<div className={styles.stepContent}>
				<StepTitle status={status}>
					Déclaration des écarts de représentation
				</StepTitle>
				{transmitted ? (
					<TransmittedRow
						label="Votre déclaration a été transmise"
						mention={
							modifiable
								? `Modifiable jusqu'au ${formatCivilLongDate(campaignEndDate)}`
								: undefined
						}
						modification={
							modifiable
								? { href: representationStepHref(FIRST_REPRESENTATION_STEP) }
								: undefined
						}
						viewHref={mySpaceRepresentationHref(campaignYear)}
					/>
				) : (
					<div className={styles.deadlineRow}>
						<span
							aria-hidden="true"
							className="fr-icon-calendar-line fr-icon--sm"
						/>
						<p className="fr-text--sm fr-text-mention--grey fr-mb-0">
							Échéance : {formatCivilLongDate(deadline)}
						</p>
					</div>
				)}
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

function NotSubjectMessage() {
	return (
		<div className="fr-background-alt--blue-france fr-p-4w">
			<p className={`fr-mb-0 ${styles.notSubjectMessage}`}>
				Votre entreprise n'est pas assujettie à la publication et à la
				déclaration des écarts éventuels de représentation entre les femmes et
				les hommes.
			</p>
		</div>
	);
}

function HelpSection() {
	return (
		<div className={styles.helpSection}>
			<hr className="fr-hr" />
			<h3 className="fr-text--lg fr-text--bold fr-text-default--grey fr-mb-0">
				Pour vous aider
			</h3>
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
