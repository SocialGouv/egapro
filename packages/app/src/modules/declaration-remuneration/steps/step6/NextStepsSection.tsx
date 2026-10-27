"use client";

import { Fragment } from "react";
import { TrackedLink } from "~/modules/analytics";
import { UpdateCseModal } from "~/modules/declaration-remuneration/shared/UpdateCseModal";
import type { NextStepsBlock } from "~/modules/domain";
import { getNextStepsBlocks } from "~/modules/domain";
import { NewTabNotice } from "~/modules/layout/shared/NewTabNotice";
import styles from "./NextStepsSection.module.scss";

const NEGOTIATION_LINK_HREF =
	"https://travail-emploi.gouv.fr/la-negociation-collective-en-entreprise-en-faveur-de-legalite-professionnelle";
// Placeholder destination shared by the three "Pour vous aider" links, same as
// the second-declaration NextStepsBox: no dedicated URL exists yet for any of
// the three topics (objective criteria, corrective actions, joint evaluation).
const COMPLIANCE_HELP_HREF =
	"https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle";

type Props = {
	/** GIP annual average headcount — `null` when the company is absent from the GIP file. */
	workforce: number | null;
	indicatorGRequired: boolean;
	hasSignificantIndicatorGGap: boolean;
	cseApplicable: boolean;
	cseOpinionRequired: boolean;
	siren: string;
};

/**
 * End-of-recap-page info boxes for the first declaration's review step
 * (`Step6Review`). Which blocks render is decided by the pure rule
 * `getNextStepsBlocks` (ticket #4925) — this component only renders whichever
 * blocks it returns, in order, separated by a divider.
 */
export function NextStepsSection({
	workforce,
	indicatorGRequired,
	hasSignificantIndicatorGGap,
	cseApplicable,
	cseOpinionRequired,
	siren,
}: Props) {
	const blocks = getNextStepsBlocks({
		workforce,
		indicatorGRequired,
		hasSignificantIndicatorGGap,
	});

	return (
		<>
			<div className={styles.nextSteps}>
				{blocks.map((block, index) => (
					<Fragment key={block}>
						{index > 0 && <hr className={styles.separator} />}
						<NextStepsBlockContent
							block={block}
							cseApplicable={cseApplicable}
							cseOpinionRequired={cseOpinionRequired}
						/>
					</Fragment>
				))}
			</div>

			{blocks.includes("cse-inform-and-consult") && (
				<UpdateCseModal cseApplicable={cseApplicable} siren={siren} />
			)}
		</>
	);
}

type BlockContentProps = {
	block: NextStepsBlock;
	cseApplicable: boolean;
	cseOpinionRequired: boolean;
};

function NextStepsBlockContent({
	block,
	cseApplicable,
	cseOpinionRequired,
}: BlockContentProps) {
	switch (block) {
		case "cse-inform":
			return <CseInformBlock />;
		case "cse-inform-and-consult":
			return (
				<CseInformAndConsultBlock
					cseApplicable={cseApplicable}
					cseOpinionRequired={cseOpinionRequired}
				/>
			);
		case "afterward":
			return <AfterwardBlock />;
		case "gap-remediation":
			return <GapRemediationBlock />;
		case "gap-compliance-process":
			return <GapComplianceProcessBlock />;
	}
}

function CseInformBlock() {
	return (
		<div className={styles.section}>
			<h2 className="fr-h6 fr-mb-0">Rappel : Informer le CSE</h2>
			<p className="fr-mb-0">
				Vous devez{" "}
				<strong>
					obligatoirement informer le CSE sur l&apos;exactitude des données
					utilisées pour le calcul, la méthode de calcul et les résultats de
					chaque indicateur.
				</strong>
			</p>
		</div>
	);
}

function CseInformAndConsultBlock({
	cseApplicable,
	cseOpinionRequired,
}: {
	cseApplicable: boolean;
	cseOpinionRequired: boolean;
}) {
	return (
		<div className={styles.section}>
			{cseOpinionRequired && (
				<>
					<h2 className="fr-h6 fr-mb-0">
						Rappel : Informer et consulter le CSE
					</h2>
					<p className="fr-mb-0">
						Avant de transmettre votre déclaration, vous devez{" "}
						<strong>
							obligatoirement informer et consulter le CSE sur l&apos;exactitude
							des données utilisées pour le calcul, la méthode de calcul et les
							résultats de chaque indicateur.
						</strong>
					</p>
				</>
			)}

			{(cseOpinionRequired || cseApplicable) && (
				<div className={styles.ctaGroup}>
					{cseOpinionRequired && (
						<>
							<p className="fr-mb-0">
								L&apos;avis du CSE devra être transmis lors de la dernière étape
								de la démarche.
							</p>
							<p className="fr-mb-0">
								Les modèles d&apos;avis du CSE ne sont pas encore disponibles.
							</p>
						</>
					)}
					{cseApplicable && (
						<button
							aria-controls="update-cse-modal"
							className="fr-btn fr-btn--secondary"
							data-fr-opened="false"
							type="button"
						>
							Mettre à jour l&apos;existence d&apos;un CSE
						</button>
					)}
				</div>
			)}
		</div>
	);
}

function AfterwardBlock() {
	return (
		<div className={styles.section}>
			<h2 className="fr-h6 fr-mb-0">Et après ?</h2>
			<p className="fr-mb-0">
				Si votre entreprise présente des écarts ≥ 5 %, vous pouvez prévoir des
				mesures de remédiation à ces écarts dans le cadre de la négociation
				obligatoire en matière d&apos;égalité professionnelle.
			</p>
			<ul className="fr-raw-list fr-links-group">
				<li>
					<TrackedLink
						className="fr-link"
						href={NEGOTIATION_LINK_HREF}
						rel="noopener noreferrer"
						target="_blank"
						trackingId="negotiation_collective"
					>
						La négociation collective en entreprise en faveur de l&apos;égalité
						professionnelle
						<NewTabNotice />
					</TrackedLink>
				</li>
			</ul>
		</div>
	);
}

function GapRemediationBlock() {
	return (
		<div className={styles.section}>
			<div className={styles.alertHeader}>
				<p
					className={`fr-badge fr-badge--warning fr-badge--sm ${styles.alertBadge}`}
				>
					Écarts détectés
				</p>
				<h2 className="fr-h6 fr-mb-0">Prochaines étapes : Actions à engager</h2>
			</div>
			<p className="fr-mb-0">
				Votre entreprise présente des écarts ≥ 5 % pour l&apos;indicateur par
				catégorie d&apos;emploi, vous devez prévoir des mesures de remédiation à
				ces écarts dans le cadre de la négociation obligatoire en matière
				d&apos;égalité professionnelle.
			</p>
			<ul className="fr-raw-list fr-links-group">
				<li>
					<TrackedLink
						className="fr-link"
						href={NEGOTIATION_LINK_HREF}
						rel="noopener noreferrer"
						target="_blank"
						trackingId="negotiation_collective_gap"
					>
						La négociation collective en entreprise en faveur de l&apos;égalité
						professionnelle
						<NewTabNotice />
					</TrackedLink>
				</li>
			</ul>
		</div>
	);
}

function GapComplianceProcessBlock() {
	return (
		<div className={styles.section}>
			<div className={styles.alertHeader}>
				<p
					className={`fr-badge fr-badge--warning fr-badge--sm ${styles.alertBadge}`}
				>
					Écarts détectés
				</p>
				<h2 className="fr-h6 fr-mb-0">Prochaines étapes : Actions à engager</h2>
			</div>

			<p className="fr-mb-0">
				À la suite de l&apos;analyse de vos données de l&apos;indicateur par
				catégorie d&apos;emploi, des <strong>écarts ≥ 5 %</strong> ont été
				identifiés&nbsp;:
			</p>
			<p className="fr-mb-0">
				<strong>
					En cas de justification d&apos;au moins un écart par des critères
					objectifs et non fondés sur le sexe
				</strong>
				, vous devrez informer et consulter le CSE sur cette justification.
			</p>
			<p className="fr-mb-0">
				<strong>
					En cas d&apos;absence de justification d&apos;au moins un écart
				</strong>
				, vous devrez choisir entre&nbsp;:
			</p>
			<ul>
				<li>
					Effectuer des actions correctives et une seconde déclaration dans un
					délai de 6 mois
				</li>
				<li>Mettre en place une évaluation conjointe des rémunérations</li>
			</ul>

			<hr className={styles.separator} />

			<div className={styles.section}>
				<h3 className="fr-text--bold fr-text--md fr-mb-0">Pour vous aider</h3>
				<ul className="fr-raw-list fr-links-group">
					<li>
						<TrackedLink
							className="fr-link"
							href={COMPLIANCE_HELP_HREF}
							rel="noopener noreferrer"
							target="_blank"
							trackingId="objective_criteria_compliance"
						>
							Qu&apos;entend-on par critères objectifs et non fondés sur le sexe
							?
							<NewTabNotice />
						</TrackedLink>
					</li>
					<li>
						<TrackedLink
							className="fr-link"
							href={COMPLIANCE_HELP_HREF}
							rel="noopener noreferrer"
							target="_blank"
							trackingId="corrective_actions_compliance"
						>
							En savoir plus sur actions correctives et seconde déclaration
							<NewTabNotice />
						</TrackedLink>
					</li>
					<li>
						<TrackedLink
							className="fr-link"
							href={COMPLIANCE_HELP_HREF}
							rel="noopener noreferrer"
							target="_blank"
							trackingId="joint_evaluation_compliance"
						>
							En savoir plus sur évaluation conjointe des rémunérations
							<NewTabNotice />
						</TrackedLink>
					</li>
				</ul>
			</div>
		</div>
	);
}
