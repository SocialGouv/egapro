"use client";

import { useState } from "react";
import {
	type CompanySizeRange,
	DROPOFF_STAGNATION_DAYS_DEFAULT,
	FUNNEL_DROP_ALERT_THRESHOLD,
} from "~/modules/domain";
import { CompanySizeFilter } from "~/modules/shared";
import { api } from "~/trpc/react";

import { CampaignProgressionChart } from "./CampaignProgressionChart";
import { CampaignProgressionTable } from "./CampaignProgressionTable";
import { CampaignRateTile } from "./CampaignRateTile";
import { CompletionFunnelChart } from "./CompletionFunnelChart";
import { CompletionFunnelTable } from "./CompletionFunnelTable";
import { formatCount } from "./formatters";
import { MatomoFunnelChart } from "./MatomoFunnelChart";
import { MatomoFunnelTable } from "./MatomoFunnelTable";
import { StagnationDaysFilter } from "./StagnationDaysFilter";
import styles from "./StatsDashboard.module.scss";
import { StepDropoffChart } from "./StepDropoffChart";
import { StepDropoffTable } from "./StepDropoffTable";
import { StepDurationsChart } from "./StepDurationsChart";
import { StepDurationsTable } from "./StepDurationsTable";
import { useDebouncedValue } from "./useDebouncedValue";
import { YearsFilter } from "./YearsFilter";

const STAGNATION_DEBOUNCE_MS = 500;
const DEFAULT_SELECTION_COUNT = 3;

type Props = {
	currentYear: number;
	availableYears: number[];
};

export function StatsDashboard({ currentYear, availableYears }: Props) {
	const [selectedYears, setSelectedYears] = useState(() =>
		availableYears.slice(0, DEFAULT_SELECTION_COUNT),
	);
	const [sizeRange, setSizeRange] = useState<CompanySizeRange | undefined>(
		undefined,
	);
	const [stagnationDays, setStagnationDays] = useState(
		DROPOFF_STAGNATION_DAYS_DEFAULT,
	);
	const debouncedStagnationDays = useDebouncedValue(
		stagnationDays,
		STAGNATION_DEBOUNCE_MS,
	);

	const activeYear = selectedYears[0] ?? currentYear;

	const progressionQuery = api.adminStats.getCampaignProgression.useQuery(
		{ years: selectedYears, sizeRange },
		{
			enabled: selectedYears.length > 0,
			placeholderData: (prev) => prev,
		},
	);

	const stepDurationsQuery = api.adminStats.getStepDurations.useQuery(
		{ year: activeYear, sizeRange },
		{
			enabled: selectedYears.length > 0,
			placeholderData: (prev) => prev,
		},
	);

	const stepDropoffQuery = api.adminStats.getStepDropoffRate.useQuery(
		{ year: activeYear, sizeRange, stagnationDays: debouncedStagnationDays },
		{
			enabled: selectedYears.length > 0,
			placeholderData: (prev) => prev,
		},
	);

	const funnelQuery = api.adminStats.getCompletionFunnel.useQuery(
		{ year: activeYear, sizeRange },
		{
			enabled: selectedYears.length > 0,
			placeholderData: (prev) => prev,
		},
	);

	const matomoFunnelQuery = api.adminStats.getMatomoFunnel.useQuery(
		{ year: activeYear, sizeRange },
		{
			enabled: selectedYears.length > 0,
			placeholderData: (prev) => prev,
		},
	);

	const hasRevisionData = (funnelQuery.data?.revisionFunnel[0]?.count ?? 0) > 0;
	const hasCseData = (funnelQuery.data?.cseFunnel[0]?.count ?? 0) > 0;

	return (
		<>
			<h1 className="fr-h1">Statistiques</h1>

			<div className="fr-grid-row fr-grid-row--gutters fr-mt-4w">
				<div className="fr-col-12 fr-col-md-4">
					<YearsFilter
						availableYears={availableYears}
						onChange={setSelectedYears}
						selectedYears={selectedYears}
					/>
				</div>
				<div className="fr-col-12 fr-col-md-4">
					<CompanySizeFilter
						label="Tranche d'effectif"
						onChange={setSizeRange}
						value={sizeRange}
					/>
				</div>
				<div className="fr-col-12 fr-col-md-4">
					<StagnationDaysFilter
						onChange={setStagnationDays}
						value={stagnationDays}
					/>
				</div>
			</div>

			<section className="fr-mt-6w" id="campagne">
				<h2 className="fr-h2">Suivi de campagne</h2>

				<div className="fr-grid-row fr-grid-row--gutters fr-mt-4w">
					<div className="fr-col-12 fr-col-md-6">
						<div className={styles.card}>
							<CampaignRateTile sizeRange={sizeRange} year={activeYear} />
						</div>
					</div>
					<div className="fr-col-12 fr-col-md-6">
						<div className={styles.card}>
							{selectedYears.length === 0 && (
								<p className="fr-text--sm fr-text-mention--grey">
									Sélectionnez au moins une année pour afficher le graphique.
								</p>
							)}
							{progressionQuery.isLoading && !progressionQuery.data && (
								<p aria-live="polite">Chargement du graphique…</p>
							)}
							{progressionQuery.isError && (
								<div aria-live="polite" className="fr-alert fr-alert--error">
									<p>
										Une erreur est survenue lors du chargement des statistiques.
									</p>
								</div>
							)}
							{progressionQuery.data && (
								<CampaignProgressionChart
									currentYear={currentYear}
									series={progressionQuery.data}
								/>
							)}
						</div>
					</div>
				</div>

				{progressionQuery.data && (
					<section
						aria-label="Progression dans le temps"
						className={`fr-mt-2w ${styles.card}`}
					>
						<CampaignProgressionTable series={progressionQuery.data} />
					</section>
				)}

				<div className="fr-grid-row fr-grid-row--gutters fr-mt-4w">
					<div className="fr-col-12 fr-col-md-6">
						<section
							aria-labelledby="step-durations-heading"
							className={styles.card}
						>
							<h3 className="fr-h3" id="step-durations-heading">
								Délai moyen par étape — campagne {activeYear}
							</h3>
							<p className="fr-text--sm fr-text-mention--grey">
								Temps passé par les déclarations sur chaque étape du parcours
								indicateurs (médiane et 90e percentile).
							</p>
							{stepDurationsQuery.isLoading && !stepDurationsQuery.data && (
								<p aria-live="polite">Chargement du graphique…</p>
							)}
							{stepDurationsQuery.isError && (
								<div aria-live="polite" className="fr-alert fr-alert--error">
									<p>
										Une erreur est survenue lors du chargement des délais par
										étape.
									</p>
								</div>
							)}
							{stepDurationsQuery.data && (
								<>
									<StepDurationsChart rows={stepDurationsQuery.data} />
									<StepDurationsTable rows={stepDurationsQuery.data} />
								</>
							)}
						</section>
					</div>

					<div className="fr-col-12 fr-col-md-6">
						<section
							aria-labelledby="step-dropoff-heading"
							className={styles.card}
						>
							<h3 className="fr-h3" id="step-dropoff-heading">
								Taux d'abandon par phase — campagne {activeYear}
							</h3>
							<p className="fr-text--sm fr-text-mention--grey">
								Pourcentage de déclarations entrées sur chaque phase du parcours
								déclaratif qui n'ont pas progressé depuis le délai sélectionné.
							</p>
							{stepDropoffQuery.isLoading && !stepDropoffQuery.data && (
								<p aria-live="polite">Chargement du graphique…</p>
							)}
							{stepDropoffQuery.isError && (
								<div aria-live="polite" className="fr-alert fr-alert--error">
									<p>
										Une erreur est survenue lors du chargement des taux
										d'abandon.
									</p>
								</div>
							)}
							{stepDropoffQuery.data && (
								<>
									<StepDropoffChart rows={stepDropoffQuery.data} />
									<StepDropoffTable rows={stepDropoffQuery.data} />
								</>
							)}
						</section>
					</div>
				</div>
			</section>

			<section className="fr-mt-6w" id="plateforme">
				<h2 className="fr-h2">Funnels de complétion</h2>
				<p>
					Funnels de complétion des déclarations sur la campagne sélectionnée.
					Une chute supérieure à {FUNNEL_DROP_ALERT_THRESHOLD} % entre deux
					jalons consécutifs est mise en évidence en rouge.
				</p>

				{funnelQuery.isLoading && !funnelQuery.data && (
					<p aria-live="polite" className="fr-mt-4w">
						Chargement des funnels…
					</p>
				)}
				{funnelQuery.isError && (
					<div aria-live="polite" className="fr-alert fr-alert--error fr-mt-4w">
						<p>Une erreur est survenue lors du chargement des funnels.</p>
					</div>
				)}

				{funnelQuery.data && (
					<div className="fr-grid-row fr-grid-row--gutters fr-mt-4w">
						<div className="fr-col-12 fr-col-md-6">
							<section
								aria-labelledby="completion-funnel-main-heading"
								className={styles.card}
							>
								<h3 className="fr-h3" id="completion-funnel-main-heading">
									Funnel principal — toutes les déclarations
								</h3>
								<CompletionFunnelChart
									caption="Funnel principal — toutes les déclarations"
									dropThreshold={FUNNEL_DROP_ALERT_THRESHOLD}
									rows={funnelQuery.data.mainFunnel}
								/>
								<CompletionFunnelTable
									caption="Funnel principal — toutes les déclarations"
									rows={funnelQuery.data.mainFunnel}
								/>
							</section>
						</div>

						<div className="fr-col-12 fr-col-md-6">
							<section
								aria-labelledby="completion-funnel-compliance-heading"
								className={styles.card}
							>
								<h3 className="fr-h3" id="completion-funnel-compliance-heading">
									Funnel parcours conformité — déclarations avec écart ≥ 5 %
								</h3>
								<CompletionFunnelChart
									caption="Funnel parcours conformité — déclarations avec écart ≥ 5 %"
									dropThreshold={FUNNEL_DROP_ALERT_THRESHOLD}
									rows={funnelQuery.data.complianceFunnel}
								/>
								<CompletionFunnelTable
									caption="Funnel parcours conformité — déclarations avec écart ≥ 5 %"
									rows={funnelQuery.data.complianceFunnel}
								/>
							</section>
						</div>

						<div className="fr-col-12 fr-col-md-6">
							<section
								aria-labelledby="completion-funnel-revision-heading"
								className={styles.card}
							>
								<h3 className="fr-h3" id="completion-funnel-revision-heading">
									Funnel cycle de révision — déclarations ayant nécessité une
									révision
								</h3>
								{hasRevisionData ? (
									<>
										<CompletionFunnelChart
											caption="Funnel cycle de révision — déclarations ayant nécessité une révision"
											dropThreshold={FUNNEL_DROP_ALERT_THRESHOLD}
											rows={funnelQuery.data.revisionFunnel}
										/>
										<CompletionFunnelTable
											caption="Funnel cycle de révision — déclarations ayant nécessité une révision"
											rows={funnelQuery.data.revisionFunnel}
										/>
									</>
								) : (
									<p className="fr-text--sm fr-mb-0">
										Aucune révision pour ces filtres.
									</p>
								)}
							</section>
						</div>

						<div className="fr-col-12 fr-col-md-6">
							<section
								aria-labelledby="completion-funnel-cse-heading"
								className={styles.card}
							>
								<h3 className="fr-h3" id="completion-funnel-cse-heading">
									Funnel cycle CSE — déclarations d'entreprises ayant un CSE
								</h3>
								{hasCseData ? (
									<>
										<CompletionFunnelChart
											caption="Funnel cycle CSE — déclarations d'entreprises ayant un CSE"
											dropThreshold={FUNNEL_DROP_ALERT_THRESHOLD}
											rows={funnelQuery.data.cseFunnel}
										/>
										<CompletionFunnelTable
											caption="Funnel cycle CSE — déclarations d'entreprises ayant un CSE"
											rows={funnelQuery.data.cseFunnel}
										/>
									</>
								) : (
									<p className="fr-text--sm fr-mb-0">
										Aucune déclaration avec CSE pour ces filtres.
									</p>
								)}
							</section>
						</div>
					</div>
				)}
			</section>

			<section className="fr-mt-6w" id="comportement">
				<h2 className="fr-h2">
					Parcours de déclaration — comportement réel (Matomo)
				</h2>
				<p>
					Funnel comportemental du parcours de déclaration mesuré via Matomo :
					entrées dans le tunnel, progression et durée moyenne par étape,
					complétions et abandons — pour la campagne {activeYear}.
				</p>

				{matomoFunnelQuery.isLoading && !matomoFunnelQuery.data && (
					<p aria-live="polite" className="fr-mt-4w">
						Chargement des données Matomo…
					</p>
				)}
				{matomoFunnelQuery.isError && (
					<div aria-live="polite" className="fr-alert fr-alert--error fr-mt-4w">
						<p>
							Les statistiques Matomo sont indisponibles pour le moment. Les
							autres indicateurs de cette page restent consultables.
						</p>
					</div>
				)}

				{matomoFunnelQuery.data && (
					<div className="fr-grid-row fr-grid-row--gutters fr-mt-4w">
						<div className="fr-col-12">
							<section
								aria-labelledby="matomo-funnel-heading"
								className={styles.card}
							>
								<h3 className="fr-h3" id="matomo-funnel-heading">
									Funnel du parcours de déclaration
								</h3>
								<p className="fr-text--sm fr-text-mention--grey">
									{formatCount(matomoFunnelQuery.data.startedCount)} entrées ·{" "}
									{formatCount(matomoFunnelQuery.data.completedCount)}{" "}
									complétions ·{" "}
									{formatCount(matomoFunnelQuery.data.abandonedCount)} abandons
								</p>
								<MatomoFunnelChart
									caption="Funnel du parcours de déclaration — comportement réel (Matomo)"
									data={matomoFunnelQuery.data}
								/>
								<MatomoFunnelTable
									caption="Funnel du parcours de déclaration — comportement réel (Matomo)"
									data={matomoFunnelQuery.data}
								/>
							</section>
						</div>
					</div>
				)}
			</section>
		</>
	);
}
