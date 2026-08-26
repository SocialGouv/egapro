"use client";

import { useId, useState } from "react";
import type { PublicDeclarationDTO } from "~/modules/public-api";
import styles from "./VariablePayIndicatorPanel.module.scss";

type Props = Pick<
	PublicDeclarationDTO,
	| "variableAnnualMeanGap"
	| "variableAnnualMedianGap"
	| "variableHourlyMeanGap"
	| "variableHourlyMedianGap"
	| "variableProportionWomen"
	| "variableProportionMen"
>;

type Period = "hourly" | "annual";

function formatRatio(value: number | null) {
	return value === null
		? "—"
		: `${(value * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
}

function gapDirection(value: number | null) {
	if (value === null) return "Donnée non disponible";
	if (value > 0) return "Écart en faveur des hommes";
	if (value < 0) return "Écart en faveur des femmes";
	return "Aucun écart constaté";
}

function barWidth(value: number | null) {
	if (value === null) return "0%";
	return `${Math.min(100, Math.max(0, value * 100))}%`;
}

export function VariablePayIndicatorPanel(props: Props) {
	const id = useId();
	const [period, setPeriod] = useState<Period>("hourly");
	const [detailsOpen, setDetailsOpen] = useState(true);
	const isHourly = period === "hourly";
	const meanGap = isHourly
		? props.variableHourlyMeanGap
		: props.variableAnnualMeanGap;
	const medianGap = isHourly
		? props.variableHourlyMedianGap
		: props.variableAnnualMedianGap;
	const periodLabel = isHourly ? "horaire brute" : "annuelle brute";
	const detailsId = `${id}-variable-details`;

	return (
		<section aria-labelledby={`${id}-title`} className={styles.section}>
			<header className={styles.header}>
				<div>
					<h3
						className={`fr-text--lg fr-text--bold fr-mb-0 ${styles.sectionTitle}`}
						id={`${id}-title`}
					>
						Écart de rémunération variable et complémentaire
					</h3>
					<p className="fr-text--sm fr-mb-0">Seuil réglementaire : 5 %</p>
				</div>
				<fieldset className="fr-segmented fr-segmented--no-legend">
					<legend className="fr-segmented__legend">Période de calcul</legend>
					<div className="fr-segmented__elements">
						<div className="fr-segmented__element">
							<input
								checked={period === "hourly"}
								id={`${id}-hourly`}
								name={`${id}-period`}
								onChange={() => setPeriod("hourly")}
								type="radio"
							/>
							<label className="fr-label" htmlFor={`${id}-hourly`}>
								Horaire
							</label>
						</div>
						<div className="fr-segmented__element">
							<input
								checked={period === "annual"}
								id={`${id}-annual`}
								name={`${id}-period`}
								onChange={() => setPeriod("annual")}
								type="radio"
							/>
							<label className="fr-label" htmlFor={`${id}-annual`}>
								Annuelle
							</label>
						</div>
					</div>
				</fieldset>
			</header>

			<div className={styles.metricGrid}>
				<article className={styles.metricCard}>
					<div className={styles.metricTitle}>
						<h4 className="fr-text--md fr-text--bold fr-mb-0">
							Écarts de rémunération variable et complémentaire {periodLabel}{" "}
							moyenne
						</h4>
						<button
							aria-label="À propos de l’écart moyen"
							className={`fr-btn fr-btn--tertiary-no-outline fr-icon-question-line ${styles.infoButton}`}
							title="Différence entre les rémunérations variables moyennes des femmes et des hommes."
							type="button"
						/>
					</div>
					<p className={styles.metricValue}>{formatRatio(meanGap)}</p>
					<p className="fr-text--sm fr-mb-0">{gapDirection(meanGap)}</p>
				</article>
				<article className={styles.metricCard}>
					<div className={styles.metricTitle}>
						<h4 className="fr-text--md fr-text--bold fr-mb-0">
							Écarts de rémunération variable et complémentaire {periodLabel}{" "}
							médiane
						</h4>
						<button
							aria-label="À propos de l’écart médian"
							className={`fr-btn fr-btn--tertiary-no-outline fr-icon-question-line ${styles.infoButton}`}
							title="Différence entre les rémunérations variables médianes des femmes et des hommes."
							type="button"
						/>
					</div>
					<p className={styles.metricValue}>{formatRatio(medianGap)}</p>
					<p className="fr-text--sm fr-mb-0">{gapDirection(medianGap)}</p>
				</article>
			</div>

			<div className={styles.proportionCard}>
				<div className={styles.metricTitle}>
					<h4 className="fr-text--md fr-text--bold fr-mb-0">
						Proportion de femmes et d’hommes bénéficiaires
					</h4>
					<button
						aria-label="À propos des bénéficiaires"
						className={`fr-btn fr-btn--tertiary-no-outline fr-icon-question-line ${styles.infoButton}`}
						title="Part des femmes et des hommes ayant perçu une rémunération variable ou complémentaire."
						type="button"
					/>
				</div>
				<div aria-hidden="true" className={styles.bars}>
					<div className={styles.barTrack}>
						<span
							className={`${styles.barFill} ${styles.womenBar}`}
							style={{ width: barWidth(props.variableProportionWomen) }}
						/>
					</div>
					<p className="fr-text--sm fr-mb-2w">
						<span className={`${styles.legendSwatch} ${styles.womenBar}`} />
						Femmes :{" "}
						<strong>{formatRatio(props.variableProportionWomen)}</strong>
					</p>
					<div className={styles.barTrack}>
						<span
							className={`${styles.barFill} ${styles.menBar}`}
							style={{ width: barWidth(props.variableProportionMen) }}
						/>
					</div>
					<p className="fr-text--sm fr-mb-0">
						<span className={`${styles.legendSwatch} ${styles.menBar}`} />
						Homme : <strong>{formatRatio(props.variableProportionMen)}</strong>
					</p>
				</div>

				<div className={styles.details}>
					<h4 className="fr-mb-0">
						<button
							aria-controls={detailsId}
							aria-expanded={detailsOpen}
							className={styles.detailsButton}
							onClick={() => setDetailsOpen((open) => !open)}
							type="button"
						>
							Détails des données
							<span
								aria-hidden="true"
								className={
									detailsOpen
										? "fr-icon-arrow-up-s-line"
										: "fr-icon-arrow-down-s-line"
								}
							/>
						</button>
					</h4>
					{detailsOpen && (
						<div className="fr-table fr-table--no-caption" id={detailsId}>
							<div className="fr-table__wrapper">
								<div className="fr-table__container">
									<div className="fr-table__content">
										<table className={styles.detailsTable}>
											<colgroup>
												<col />
												<col />
												<col />
											</colgroup>
											<caption className="fr-sr-only">
												Proportion de bénéficiaires par sexe
											</caption>
											<thead>
												<tr>
													<th scope="col">
														<span className="fr-sr-only">Indicateur</span>
													</th>
													<th scope="col">Femmes</th>
													<th scope="col">Hommes</th>
												</tr>
											</thead>
											<tbody>
												<tr>
													<th scope="row">Pourcentage de bénéficiaires</th>
													<td>{formatRatio(props.variableProportionWomen)}</td>
													<td>{formatRatio(props.variableProportionMen)}</td>
												</tr>
											</tbody>
										</table>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</section>
	);
}
