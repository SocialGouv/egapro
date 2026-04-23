"use client";

import { useState } from "react";
import type { CompanySizeRange } from "~/modules/domain";
import { CompanySizeFilter } from "~/modules/shared";
import { api } from "~/trpc/react";

import { CampaignProgressionChart } from "./CampaignProgressionChart";
import { CampaignProgressionTable } from "./CampaignProgressionTable";
import { YearsFilter } from "./YearsFilter";

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
		</>
	);
}
