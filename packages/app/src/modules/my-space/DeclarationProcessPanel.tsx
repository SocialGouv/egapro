"use client";

import Link from "next/link";
import { useRef } from "react";
import { DeclarationLockAlert } from "~/modules/declaration-remuneration/shared/lock/DeclarationLockAlert";
import type {
	CampaignDeadlines,
	DeclarationDisplayContext,
	DeclarationFsmStatus,
} from "~/modules/domain";
import {
	FORMAL_NOTICE_JOINT_EVALUATION,
	mySpaceHistoryHref,
} from "~/modules/routes";
import styles from "./DeclarationProcessPanel.module.scss";
import type { LockHolderDisplay } from "./types";
import {
	getStepStatuses,
	isFirstDeclarationModifiable,
	VerticalStepper,
} from "./VerticalStepper";

export const DECLARATION_PROCESS_PANEL_ID = "declaration-process-panel";
const PANEL_TITLE_ID = "declaration-process-panel-title";

// No leading space: the accname algorithm trims each node's own text before concatenating it, so the separator has to be its own sibling text node.
const DEMARCHE_SUFFIX = "la démarche des indicateurs de rémunération";

export type PanelVariant =
	| "start"
	| "compliance_choice"
	| "compliance"
	| "evaluation"
	| "cse"
	| "closed";

// The footer CTA never renders in "closed" (no action left to propose), so its label helpers can't be called with it.
type CtaVariant = Exclude<PanelVariant, "closed">;

type Props = {
	campaignDeadlines: CampaignDeadlines;
	compliancePathApplicable: boolean;
	cseOpinionRequired: boolean;
	declarationFsmStatus: DeclarationFsmStatus | null;
	year: number;
	hasPrefillData: boolean;
	indicatorGRequired: boolean;
	lastActionDate: string | null;
	variant: PanelVariant;
	displayContext: DeclarationDisplayContext;
	hasSubmittedSecondDeclaration: boolean;
	hasSubmittedJointEvaluation: boolean;
	hasSubmittedCseOpinion: boolean;
	cseOpinionViewAvailable?: boolean;
	jointEvaluationViewAvailable?: boolean;
	formalNoticeAvailable: boolean;
	siren: string;
	ctaHref: string;
	lockedByOther: boolean;
	lockHolder: LockHolderDisplay | null;
};

export function DeclarationProcessPanel({
	campaignDeadlines,
	compliancePathApplicable,
	cseOpinionRequired,
	declarationFsmStatus,
	year,
	hasPrefillData,
	indicatorGRequired,
	lastActionDate,
	variant,
	displayContext,
	hasSubmittedSecondDeclaration,
	hasSubmittedJointEvaluation,
	hasSubmittedCseOpinion,
	cseOpinionViewAvailable,
	jointEvaluationViewAvailable,
	formalNoticeAvailable,
	siren,
	ctaHref,
	lockedByOther,
	lockHolder,
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
						<PanelHeader
							lastActionDate={lastActionDate}
							siren={siren}
							year={year}
						/>
						{lockedByOther && lockHolder && (
							<DeclarationLockAlert holder={lockHolder} />
						)}
						{indicatorGRequired &&
							(variant === "start" || variant === "compliance_choice") && (
								<StartAlert />
							)}
						<VerticalStepper
							campaignDeadlines={campaignDeadlines}
							compliancePathApplicable={compliancePathApplicable}
							cseOpinionRequired={cseOpinionRequired}
							cseOpinionSubmitted={hasSubmittedCseOpinion}
							cseOpinionViewAvailable={cseOpinionViewAvailable}
							declarationFsmStatus={declarationFsmStatus}
							displayContext={displayContext}
							hasPrefillData={hasPrefillData}
							indicatorGRequired={indicatorGRequired}
							jointEvaluationSubmitted={hasSubmittedJointEvaluation}
							jointEvaluationViewAvailable={jointEvaluationViewAvailable}
							secondDeclarationSubmitted={hasSubmittedSecondDeclaration}
							step1={step1}
							step2={step2}
							step3={step3}
							variant={variant}
							year={year}
						/>
						{variant === "closed" && (
							<ClosedMessage
								cseOpinionRequired={cseOpinionRequired}
								firstDeclarationModifiable={isFirstDeclarationModifiable({
									cseOpinion: hasSubmittedCseOpinion,
									jointEvaluation: hasSubmittedJointEvaluation,
									secondDeclaration: hasSubmittedSecondDeclaration,
								})}
							/>
						)}
						{variant === "closed" && formalNoticeAvailable && (
							<FormalNoticeAction />
						)}
					</div>
					<div>
						<HelpSection />
						<div className={styles.footer}>
							{variant !== "closed" && (
								<a
									aria-describedby={PANEL_TITLE_ID}
									className="fr-btn"
									href={ctaHref}
								>
									<CtaLabel lockedByOther={lockedByOther} variant={variant} />
								</a>
							)}
						</div>
					</div>
				</div>
			</div>
		</dialog>
	);
}

function getCtaLabel(variant: CtaVariant): string {
	if (variant === "start") return "Commencer";
	return "Continuer";
}

function getCtaAccessibleSuffix(variant: CtaVariant): string | null {
	if (variant === "start") return "la déclaration";
	return DEMARCHE_SUFFIX;
}

function CtaLabel({
	lockedByOther,
	variant,
}: {
	lockedByOther: boolean;
	variant: CtaVariant;
}) {
	if (lockedByOther) {
		// Suffix trails the full visible label (not split mid-phrase) so it stays a contiguous prefix of the accessible name — WCAG 2.5.3 Label in Name.
		return (
			<>
				Consulter en lecture seule{" "}
				<span className="fr-sr-only">{DEMARCHE_SUFFIX}</span>
			</>
		);
	}

	const suffix = getCtaAccessibleSuffix(variant);
	return (
		<>
			{getCtaLabel(variant)}
			{suffix && (
				<>
					{" "}
					<span className="fr-sr-only">{suffix}</span>
				</>
			)}
		</>
	);
}

function PanelHeader({
	year,
	siren,
	lastActionDate,
}: {
	year: number;
	siren: string;
	lastActionDate: string | null;
}) {
	return (
		<div className="fr-mb-4w">
			<h2 className="fr-h5 fr-mb-1w" id={PANEL_TITLE_ID}>
				Démarche des indicateurs de rémunération {year}
			</h2>
			<div className={styles.lastAction}>
				{lastActionDate && (
					<>
						<span
							aria-hidden="true"
							className="fr-icon-time-line fr-icon--sm"
						/>
						<span>Dernière action le {lastActionDate}</span>
					</>
				)}
				<Link
					className={`fr-link ${styles.historyLink}`}
					href={mySpaceHistoryHref(siren, year)}
				>
					Voir l'historique
				</Link>
			</div>
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

function getClosedMessage({
	cseOpinionRequired,
	firstDeclarationModifiable,
}: {
	cseOpinionRequired: boolean;
	firstDeclarationModifiable: boolean;
}): string {
	if (cseOpinionRequired) {
		return "Cette démarche est terminée. Vos avis du CSE restent modifiables.";
	}
	return firstDeclarationModifiable
		? "Cette démarche est terminée. Votre déclaration reste modifiable."
		: "Cette démarche est terminée.";
}

function ClosedMessage({
	cseOpinionRequired,
	firstDeclarationModifiable,
}: {
	cseOpinionRequired: boolean;
	firstDeclarationModifiable: boolean;
}) {
	return (
		<div className={styles.closedMessage}>
			<p className="fr-text--bold fr-mb-0">Démarche close</p>
			<p className="fr-mb-0">
				{getClosedMessage({ cseOpinionRequired, firstDeclarationModifiable })}
			</p>
		</div>
	);
}

function FormalNoticeAction() {
	return (
		<div className={`fr-mt-4w ${styles.formalNoticeAction}`}>
			<p className={`fr-mb-0 ${styles.formalNoticeText}`}>
				Si votre entreprise a été mise en demeure, par les services de
				l'inspection du travail, d'effectuer l'évaluation conjointe des
				rémunérations.
			</p>
			<Link
				className="fr-btn fr-btn--tertiary"
				href={FORMAL_NOTICE_JOINT_EVALUATION}
			>
				Dépôt du rapport de l’évaluation conjointe
			</Link>
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
