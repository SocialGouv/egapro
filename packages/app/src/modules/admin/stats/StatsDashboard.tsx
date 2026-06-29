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
import { CseStatusConfirmationsTile } from "./CseStatusConfirmationsTile";
import { StagnationDaysFilter } from "./StagnationDaysFilter";
import { type BarSeries, StatsBarChart } from "./StatsBarChart";
import { StatsBarTable, type StatsTableColumn } from "./StatsBarTable";
import styles from "./StatsDashboard.module.scss";
import { StepDropoffChart } from "./StepDropoffChart";
import { StepDropoffTable } from "./StepDropoffTable";
import { StepDurationsChart } from "./StepDurationsChart";
import { StepDurationsTable } from "./StepDurationsTable";
import type { DeviceBreakdownRow, LabeledCount } from "./types";
import { UsersPerCompanyTile } from "./UsersPerCompanyTile";
import { useDebouncedValue } from "./useDebouncedValue";
import { YearsFilter } from "./YearsFilter";

const STAGNATION_DEBOUNCE_MS = 500;
const DEFAULT_SELECTION_COUNT = 3;

const USAGE_BAR_COLOR = "var(--blue-france-sun-113-625)";

const MODEL_SERIES: BarSeries<LabeledCount>[] = [
	{ key: "count", name: "Occurrences", color: USAGE_BAR_COLOR },
];
const HELP_SERIES: BarSeries<LabeledCount>[] = [
	{ key: "count", name: "Clics", color: USAGE_BAR_COLOR },
];
const DEVICE_SERIES: BarSeries<DeviceBreakdownRow>[] = [
	{
		key: "desktop",
		name: "Ordinateur",
		color: "var(--blue-france-sun-113-625)",
	},
	{
		key: "smartphone",
		name: "Mobile",
		color: "var(--green-emeraude-main-632)",
	},
	{ key: "tablet", name: "Tablette", color: "var(--blue-cumulus-main-526)" },
];

const MODEL_TABLE_COLUMNS: StatsTableColumn<LabeledCount>[] = [
	{ key: "count", label: "Occurrences" },
];
const HELP_TABLE_COLUMNS: StatsTableColumn<LabeledCount>[] = [
	{ key: "count", label: "Clics" },
];
const DEVICE_TABLE_COLUMNS: StatsTableColumn<DeviceBreakdownRow>[] = [
	{ key: "desktop", label: "Ordinateur" },
	{ key: "smartphone", label: "Mobile" },
	{ key: "tablet", label: "Tablette" },
];

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

	// Single-year widgets key off the most recent selected campaign. `YearsFilter`
	// emits the selection sorted ascending, so `selectedYears[0]` is the OLDEST
	// year — using it would blank every per-campaign widget as soon as the user
	// toggles a year. Take the max so the active campaign is order-independent.
	const activeYear =
		selectedYears.length > 0 ? Math.max(...selectedYears) : currentYear;

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

	const matomoCategoryModelQuery =
		api.adminStats.getMatomoCategoryModel.useQuery(
			{ year: activeYear, sizeRange },
			{
				enabled: selectedYears.length > 0,
				placeholderData: (prev) => prev,
			},
		);

	const matomoHelpLinksQuery = api.adminStats.getMatomoHelpLinks.useQuery(
		{ year: activeYear, sizeRange },
		{
			enabled: selectedYears.length > 0,
			placeholderData: (prev) => prev,
		},
	);

	const matomoDeviceQuery = api.adminStats.getMatomoDeviceBreakdown.useQuery(
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

			<section className="fr-mt-6w" id="comptes">
				<h2 className="fr-h2">Comptes &amp; engagement CSE</h2>
				<p>
					Confirmations du statut CSE mesurées côté navigateur (Matomo,
					anonymisé — volume de confirmations sur l&apos;année, pas
					d&apos;entreprises distinctes) et répartition des utilisateurs par
					entreprise (lecture directe en base).
				</p>
				<div className="fr-grid-row fr-grid-row--gutters fr-mt-4w">
					<div className="fr-col-12 fr-col-md-6">
						<div className={styles.card}>
							<UsersPerCompanyTile />
						</div>
					</div>
					<div className="fr-col-12 fr-col-md-6">
						<div className={styles.card}>
							<CseStatusConfirmationsTile year={activeYear} />
						</div>
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

			<section className="fr-mt-6w" id="matomo">
				<h2 className="fr-h2">Funnels Matomo (parcours client)</h2>
				<p>
					Parcours mesurés côté navigateur par Matomo pour la campagne
					sélectionnée, lus en direct via la Reporting API. Le filtre par
					tranche d'effectif ne s'applique qu'au funnel de déclaration.
				</p>

				{matomoFunnelQuery.isLoading && !matomoFunnelQuery.data && (
					<p aria-live="polite" className="fr-mt-4w">
						Chargement des funnels Matomo…
					</p>
				)}
				{matomoFunnelQuery.isError && (
					<div aria-live="polite" className="fr-alert fr-alert--error fr-mt-4w">
						<p>
							Une erreur est survenue lors du chargement des funnels Matomo.
						</p>
					</div>
				)}

				{matomoFunnelQuery.data && (
					<div className="fr-grid-row fr-grid-row--gutters fr-mt-4w">
						<div className="fr-col-12 fr-col-md-6">
							<section
								aria-labelledby="matomo-funnel-declaration-heading"
								className={styles.card}
							>
								<h3 className="fr-h3" id="matomo-funnel-declaration-heading">
									Déclaration des indicateurs
								</h3>
								<CompletionFunnelChart
									caption="Funnel Matomo — déclaration des indicateurs"
									dropThreshold={FUNNEL_DROP_ALERT_THRESHOLD}
									rows={matomoFunnelQuery.data.declarationFunnel}
								/>
								<CompletionFunnelTable
									caption="Funnel Matomo — déclaration des indicateurs"
									rows={matomoFunnelQuery.data.declarationFunnel}
								/>
							</section>
						</div>

						<div className="fr-col-12 fr-col-md-6">
							<section
								aria-labelledby="matomo-funnel-cse-heading"
								className={styles.card}
							>
								<h3 className="fr-h3" id="matomo-funnel-cse-heading">
									Avis du CSE
								</h3>
								<CompletionFunnelChart
									caption="Funnel Matomo — avis du CSE"
									dropThreshold={FUNNEL_DROP_ALERT_THRESHOLD}
									rows={matomoFunnelQuery.data.cseFunnel}
								/>
								<CompletionFunnelTable
									caption="Funnel Matomo — avis du CSE"
									rows={matomoFunnelQuery.data.cseFunnel}
								/>
							</section>
						</div>

						<div className="fr-col-12 fr-col-md-6">
							<section
								aria-labelledby="matomo-funnel-compliance-heading"
								className={styles.card}
							>
								<h3 className="fr-h3" id="matomo-funnel-compliance-heading">
									Parcours conformité
								</h3>
								<CompletionFunnelChart
									caption="Funnel Matomo — parcours conformité"
									dropThreshold={FUNNEL_DROP_ALERT_THRESHOLD}
									rows={matomoFunnelQuery.data.complianceFunnel}
								/>
								<CompletionFunnelTable
									caption="Funnel Matomo — parcours conformité"
									rows={matomoFunnelQuery.data.complianceFunnel}
								/>
							</section>
						</div>
					</div>
				)}
			</section>

			<section className="fr-mt-6w" id="matomo-usage">
				<h2 className="fr-h2">Usage Matomo (modèle, aide, appareils)</h2>
				<p>
					Indicateurs d&apos;usage mesurés côté navigateur pour l&apos;année
					sélectionnée. Ces événements ne portent pas de dimension de campagne :
					ils sont comptés par année calendaire et ne réagissent donc pas au
					filtre par tranche d&apos;effectif.
				</p>

				<div className="fr-grid-row fr-grid-row--gutters fr-mt-4w">
					<div className="fr-col-12 fr-col-md-6">
						<section
							aria-labelledby="matomo-model-heading"
							className={styles.card}
						>
							<h3 className="fr-h3" id="matomo-model-heading">
								Usage du modèle (indicateur par catégorie)
							</h3>
							{matomoCategoryModelQuery.isError && (
								<div aria-live="polite" className="fr-alert fr-alert--error">
									<p>
										Une erreur est survenue lors du chargement de l&apos;usage
										du modèle.
									</p>
								</div>
							)}
							{matomoCategoryModelQuery.isLoading &&
								!matomoCategoryModelQuery.data && (
									<p aria-live="polite">Chargement…</p>
								)}
							{matomoCategoryModelQuery.data && (
								<>
									<StatsBarChart
										caption="Usage du modèle de l'indicateur par catégorie"
										data={matomoCategoryModelQuery.data.rows}
										series={MODEL_SERIES}
										valueAxisLabel="Occurrences"
									/>
									{matomoCategoryModelQuery.data.avgImportDurationSeconds !==
										null && (
										<p className="fr-text--sm fr-text-mention--grey fr-mt-1w">
											Durée moyenne de remplissage avant import :{" "}
											{matomoCategoryModelQuery.data.avgImportDurationSeconds} s
										</p>
									)}
									<StatsBarTable
										caption="Usage du modèle de l'indicateur par catégorie"
										columns={MODEL_TABLE_COLUMNS}
										rowHeader="Indicateur"
										rows={matomoCategoryModelQuery.data.rows}
									/>
								</>
							)}
						</section>
					</div>

					<div className="fr-col-12 fr-col-md-6">
						<section
							aria-labelledby="matomo-help-heading"
							className={styles.card}
						>
							<h3 className="fr-h3" id="matomo-help-heading">
								Liens d&apos;aide les plus cliqués
							</h3>
							{matomoHelpLinksQuery.isError && (
								<div aria-live="polite" className="fr-alert fr-alert--error">
									<p>
										Une erreur est survenue lors du chargement des liens
										d&apos;aide.
									</p>
								</div>
							)}
							{matomoHelpLinksQuery.isLoading && !matomoHelpLinksQuery.data && (
								<p aria-live="polite">Chargement…</p>
							)}
							{matomoHelpLinksQuery.data && (
								<>
									<StatsBarChart
										caption="Clics sur les liens d'aide, par lien"
										data={matomoHelpLinksQuery.data.rows}
										series={HELP_SERIES}
										valueAxisLabel="Clics"
									/>
									<StatsBarTable
										caption="Clics sur les liens d'aide, par lien"
										columns={HELP_TABLE_COLUMNS}
										rowHeader="Lien d'aide"
										rows={matomoHelpLinksQuery.data.rows}
									/>
								</>
							)}
						</section>
					</div>

					<div className="fr-col-12 fr-col-md-6">
						<section
							aria-labelledby="matomo-device-heading"
							className={styles.card}
						>
							<h3 className="fr-h3" id="matomo-device-heading">
								Répartition par appareil
							</h3>
							{matomoDeviceQuery.isError && (
								<div aria-live="polite" className="fr-alert fr-alert--error">
									<p>
										Une erreur est survenue lors du chargement de la répartition
										par appareil.
									</p>
								</div>
							)}
							{matomoDeviceQuery.isLoading && !matomoDeviceQuery.data && (
								<p aria-live="polite">Chargement…</p>
							)}
							{matomoDeviceQuery.data && (
								<>
									<StatsBarChart
										caption="Répartition par type d'appareil et par comportement"
										data={matomoDeviceQuery.data.rows}
										series={DEVICE_SERIES}
										valueAxisLabel="Visites"
									/>
									<StatsBarTable
										caption="Répartition par type d'appareil et par comportement"
										columns={DEVICE_TABLE_COLUMNS}
										rowHeader="Comportement"
										rows={matomoDeviceQuery.data.rows}
									/>
								</>
							)}
						</section>
					</div>
				</div>
			</section>
		</>
	);
}
