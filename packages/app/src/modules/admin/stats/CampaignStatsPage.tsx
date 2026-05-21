"use client";

import { useState } from "react";
import {
	type CompanySizeRange,
	DROPOFF_STAGNATION_DAYS_DEFAULT,
} from "~/modules/domain";
import { CompanySizeFilter } from "~/modules/shared";
import { api } from "~/trpc/react";

import { CampaignProgressionChart } from "./CampaignProgressionChart";
import { CampaignProgressionTable } from "./CampaignProgressionTable";
import { StagnationDaysFilter } from "./StagnationDaysFilter";
import { StepDropoffChart } from "./StepDropoffChart";
import { StepDropoffTable } from "./StepDropoffTable";
import { StepDurationsChart } from "./StepDurationsChart";
import { StepDurationsTable } from "./StepDurationsTable";
import { useDebouncedValue } from "./useDebouncedValue";
import { YearsFilter } from "./YearsFilter";

const STAGNATION_DEBOUNCE_MS = 500;

type Props = {
	/** Reference year used for the emphasis color and the default selection. */
	currentYear: number;
	/** Full list of campaign years available for comparison. */
	availableYears: number[];
};

const DEFAULT_SELECTION_COUNT = 3;

export function CampaignStatsPage({ currentYear, availableYears }: Props) {
	const [selectedYears, setSelectedYears] = useState(() =>
		availableYears.slice(0, DEFAULT_SELECTION_COUNT),
	);
	const [sizeRange, setSizeRange] = useState<CompanySizeRange | undefined>(
		undefined,
	);

	const query = api.adminStats.getCampaignProgression.useQuery(
		{ years: selectedYears, sizeRange },
		{
			enabled: selectedYears.length > 0,
			placeholderData: (prev) => prev,
		},
	);

	const stepDurationsYear = selectedYears[0] ?? currentYear;
	const stepDurationsQuery = api.adminStats.getStepDurations.useQuery(
		{ year: stepDurationsYear, sizeRange },
		{ placeholderData: (prev) => prev },
	);

	const [stagnationDays, setStagnationDays] = useState(
		DROPOFF_STAGNATION_DAYS_DEFAULT,
	);
	const debouncedStagnationDays = useDebouncedValue(
		stagnationDays,
		STAGNATION_DEBOUNCE_MS,
	);
	const stepDropoffQuery = api.adminStats.getStepDropoffRate.useQuery(
		{
			year: stepDurationsYear,
			sizeRange,
			stagnationDays: debouncedStagnationDays,
		},
		{ placeholderData: (prev) => prev },
	);

	return (
		<>
			<h1 className="fr-h1">Statistiques campagne</h1>
			<p>
				Suivi en temps réel de la dynamique de la campagne de déclaration.
				Comparez la courbe de l'année en cours à l'historique pour détecter une
				campagne en retard ou anticiper les pics.
			</p>

			<div className="fr-grid-row fr-grid-row--gutters fr-mt-4w">
				<div className="fr-col-12 fr-col-md-6">
					<CompanySizeFilter
						label="Tranche d'effectif"
						onChange={setSizeRange}
						value={sizeRange}
					/>
				</div>
				<div className="fr-col-12 fr-col-md-6">
					<YearsFilter
						availableYears={availableYears}
						onChange={setSelectedYears}
						selectedYears={selectedYears}
					/>
				</div>
			</div>

			<section
				aria-labelledby="campaign-progression-heading"
				className="fr-mt-4w"
			>
				<h2 className="fr-h3" id="campaign-progression-heading">
					Progression dans le temps
				</h2>
				{selectedYears.length === 0 && (
					<p className="fr-text--sm fr-text-mention--grey">
						Sélectionnez au moins une année pour afficher le graphique.
					</p>
				)}
				{query.isLoading && !query.data && (
					<p aria-live="polite">Chargement du graphique…</p>
				)}
				{query.isError && (
					<div aria-live="polite" className="fr-alert fr-alert--error">
						<p>Une erreur est survenue lors du chargement des statistiques.</p>
					</div>
				)}
				{query.data && (
					<>
						<CampaignProgressionChart
							currentYear={currentYear}
							series={query.data}
						/>
						<CampaignProgressionTable series={query.data} />
					</>
				)}
			</section>

			<section aria-labelledby="step-durations-heading" className="fr-mt-6w">
				<h2 className="fr-h3" id="step-durations-heading">
					Délai moyen par étape — campagne {stepDurationsYear}
				</h2>
				<p className="fr-text--sm fr-text-mention--grey">
					Temps passé par les déclarations sur chaque étape du parcours
					indicateurs (médiane et 90e percentile). Aide à repérer les étapes qui
					ralentissent la campagne.
				</p>
				{stepDurationsQuery.isLoading && !stepDurationsQuery.data && (
					<p aria-live="polite">Chargement du graphique…</p>
				)}
				{stepDurationsQuery.isError && (
					<div aria-live="polite" className="fr-alert fr-alert--error">
						<p>
							Une erreur est survenue lors du chargement des délais par étape.
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

			<section aria-labelledby="step-dropoff-heading" className="fr-mt-6w">
				<h2 className="fr-h3" id="step-dropoff-heading">
					Taux d'abandon par étape — campagne {stepDurationsYear}
				</h2>
				<p className="fr-text--sm fr-text-mention--grey">
					Pourcentage de déclarations entrées sur chaque étape du parcours
					indicateurs et qui n'ont pas progressé depuis le délai sélectionné.
					Aide à repérer les étapes où les déclarants décrochent.
				</p>
				<div className="fr-grid-row fr-grid-row--gutters fr-mb-2w">
					<div className="fr-col-12 fr-col-md-6">
						<StagnationDaysFilter
							onChange={setStagnationDays}
							value={stagnationDays}
						/>
					</div>
				</div>
				{stepDropoffQuery.isLoading && !stepDropoffQuery.data && (
					<p aria-live="polite">Chargement du graphique…</p>
				)}
				{stepDropoffQuery.isError && (
					<div aria-live="polite" className="fr-alert fr-alert--error">
						<p>
							Une erreur est survenue lors du chargement des taux d'abandon.
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
		</>
	);
}
