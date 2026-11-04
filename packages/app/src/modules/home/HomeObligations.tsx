"use client";

import Link from "next/link";
import { useState } from "react";
import {
	type DeclarationCadence,
	formatCount,
	getWorkforceObligations,
	WORKFORCE_OBLIGATION_BRACKET_KEYS,
	WORKFORCE_OBLIGATION_BRACKETS,
	type WorkforceObligationBracket,
	type WorkforceObligations,
} from "~/modules/domain";
import { UNDER_CONSTRUCTION } from "~/modules/routes";
import { TooltipButton } from "~/modules/shared/TooltipButton";
import styles from "./HomeObligations.module.scss";

type MandatoryObligations = Extract<WorkforceObligations, { mandatory: true }>;

type ObligationItem = { label: string; schedule?: string };

const EVERY_YEAR = "Tous les ans";

function cadenceLabel(everyYears: number): string {
	return everyYears === 1 ? EVERY_YEAR : `Tous les ${everyYears} ans`;
}

function scheduleLabel({ fromYear, everyYears }: DeclarationCadence): string {
	return `${cadenceLabel(everyYears)}, à partir de ${fromYear}`;
}

function remunerationItems(
	obligations: MandatoryObligations,
): ObligationItem[] {
	const items: ObligationItem[] = [
		{
			label:
				"Déclarer les indicateurs de rémunération préremplis pour l'ensemble des salariés",
			schedule: scheduleLabel(obligations.prefilledIndicators),
		},
	];
	if (obligations.categoryIndicator) {
		items.push({
			label: "Déclarer l'indicateur de rémunération par catégorie d'emplois",
			schedule: scheduleLabel(obligations.categoryIndicator),
		});
	}
	if (obligations.cseOpinion) {
		items.push({
			label: "Transmettre l'avis ou les avis du CSE à votre démarche",
		});
	}
	return items;
}

function ObligationList({ items }: { items: ObligationItem[] }) {
	return (
		<ul className={styles.list}>
			{items.map(({ label, schedule }) => (
				<li className={styles.item} key={label}>
					<span
						aria-hidden="true"
						className={`fr-icon-arrow-right-line ${styles.itemIcon}`}
					/>
					<p className="fr-text--sm fr-mb-0">
						{label}
						{schedule && (
							<>
								<br />
								<span className="fr-text-mention--grey">{schedule}</span>
							</>
						)}
					</p>
				</li>
			))}
		</ul>
	);
}

function MandatoryObligationsDetail({
	obligations,
}: {
	obligations: MandatoryObligations;
}) {
	const { representation } = obligations;
	return (
		<>
			<h4 className={`fr-mb-0 ${styles.resultTitle}`}>
				Ce que vous devez faire
			</h4>
			<ObligationList items={remunerationItems(obligations)} />
			{representation && (
				<div className={styles.representation}>
					<p className="fr-text--sm fr-text-mention--grey fr-mb-0">
						{`Si vous comptez au moins ${formatCount(representation.workforceMin)} salariés depuis ${representation.subjectionWindowYears} exercices consécutifs.`}
					</p>
					<ObligationList
						items={[
							{
								label:
									"Déclarer les indicateurs de représentation dans les postes de direction",
								schedule: EVERY_YEAR,
							},
						]}
					/>
				</div>
			)}
			<p className="fr-mb-0">
				<Link
					className="fr-link fr-icon-arrow-right-line fr-link--icon-right"
					href={UNDER_CONSTRUCTION}
				>
					Voir le détail de mes obligations
				</Link>
			</p>
		</>
	);
}

function ObligationsDetail({
	bracket,
}: {
	bracket: WorkforceObligationBracket;
}) {
	const obligations = getWorkforceObligations(bracket);
	return (
		<div className={styles.result}>
			{obligations.mandatory ? (
				<MandatoryObligationsDetail obligations={obligations} />
			) : (
				<p className="fr-mb-0">
					<strong>
						Aucune obligation, déclaration facultative des indicateurs de
						rémunération
					</strong>
				</p>
			)}
		</div>
	);
}

export function HomeObligations() {
	const [selected, setSelected] = useState<WorkforceObligationBracket | null>(
		null,
	);

	function toggle(bracket: WorkforceObligationBracket): void {
		setSelected((current) => (current === bracket ? null : bracket));
	}

	return (
		<section
			aria-labelledby="obligations-heading"
			className="fr-background-alt--blue-france fr-py-7w"
		>
			<div className="fr-container">
				<div className="fr-grid-row fr-grid-row--gutters">
					<div className={`fr-col-12 fr-col-md-4 ${styles.intro}`}>
						<h2 className="fr-h3 fr-mb-0" id="obligations-heading">
							Que devez-vous déclarer ?
						</h2>
						<p className="fr-mb-0">
							Les obligations dépendent du nombre de salariés de
							l&apos;entreprise. Ouvrez votre tranche pour les connaître.
						</p>
					</div>
					<div className="fr-col-12 fr-col-md-8">
						<div className={styles.checker}>
							<h3 className="fr-h6 fr-mb-0">Vérifier mes obligations</h3>
							<div className={styles.question}>
								<p className="fr-mb-0" id="obligations-question">
									Combien de salariés compte votre entreprise ?
								</p>
								<TooltipButton
									id="obligations-question-tooltip"
									label="Information sur l'effectif pris en compte"
									text="L'assujettissement se base sur l'effectif annuel moyen."
								/>
							</div>
							<ul
								aria-labelledby="obligations-question"
								className={`fr-tags-group ${styles.tags}`}
							>
								{WORKFORCE_OBLIGATION_BRACKET_KEYS.map((bracket) => (
									<li key={bracket}>
										<button
											aria-pressed={selected === bracket}
											className="fr-tag"
											onClick={() => toggle(bracket)}
											type="button"
										>
											{WORKFORCE_OBLIGATION_BRACKETS[bracket].label}
										</button>
									</li>
								))}
							</ul>
							{selected && <ObligationsDetail bracket={selected} />}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
