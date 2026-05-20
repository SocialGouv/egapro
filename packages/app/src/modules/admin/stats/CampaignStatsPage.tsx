"use client";

import { type ChangeEvent, useState } from "react";
import type { CompanySizeRange } from "~/modules/domain";
import { CompanySizeFilter } from "~/modules/shared";
import { api } from "~/trpc/react";

import { CampaignProgressionChart } from "./CampaignProgressionChart";
import { CampaignProgressionTable } from "./CampaignProgressionTable";
import { CampaignRateTile } from "./CampaignRateTile";
import { YearsFilter } from "./YearsFilter";

type Props = {
	/** Reference year used for the emphasis color and the default selection. */
	currentYear: number;
	/** Full list of campaign years available for comparison. */
	availableYears: number[];
};

const DEFAULT_SELECTION_COUNT = 3;
const K1_YEAR_OPTIONS_COUNT = 4;

export function CampaignStatsPage({ currentYear, availableYears }: Props) {
	const [selectedYears, setSelectedYears] = useState(() =>
		availableYears.slice(0, DEFAULT_SELECTION_COUNT),
	);
	const [sizeRange, setSizeRange] = useState<CompanySizeRange | undefined>(
		undefined,
	);
	const [k1Year, setK1Year] = useState(currentYear);

	const query = api.adminStats.getCampaignProgression.useQuery(
		{ years: selectedYears, sizeRange },
		{
			enabled: selectedYears.length > 0,
			placeholderData: (prev) => prev,
		},
	);

	const k1YearOptions: number[] = [];
	for (let offset = 0; offset < K1_YEAR_OPTIONS_COUNT; offset++) {
		k1YearOptions.push(currentYear - offset);
	}

	const handleK1YearChange = (event: ChangeEvent<HTMLSelectElement>) => {
		setK1Year(Number.parseInt(event.target.value, 10));
	};

	return (
		<>
			<h1 className="fr-h1">Statistiques campagne</h1>
			<p>
				Suivi en temps réel de la dynamique de la campagne de déclaration.
				Comparez la courbe de l'année en cours à l'historique pour détecter une
				campagne en retard ou anticiper les pics.
			</p>

			<div className="fr-grid-row fr-grid-row--gutters fr-mt-4w">
				<div className="fr-col-12 fr-col-md-4">
					<CompanySizeFilter
						label="Tranche d'effectif"
						onChange={setSizeRange}
						value={sizeRange}
					/>
				</div>
				<div className="fr-col-12 fr-col-md-4">
					<div className="fr-select-group">
						<label className="fr-label" htmlFor="campaign-rate-year">
							Année (taux de déclaration)
						</label>
						<select
							className="fr-select"
							id="campaign-rate-year"
							name="campaignRateYear"
							onChange={handleK1YearChange}
							value={k1Year}
						>
							{k1YearOptions.map((year) => (
								<option key={year} value={year}>
									{year}
								</option>
							))}
						</select>
					</div>
				</div>
				<div className="fr-col-12 fr-col-md-4">
					<YearsFilter
						availableYears={availableYears}
						onChange={setSelectedYears}
						selectedYears={selectedYears}
					/>
				</div>
			</div>

			<section aria-labelledby="campaign-rate-heading" className="fr-mt-4w">
				<h2 className="fr-h3" id="campaign-rate-heading">
					Taux de déclaration
				</h2>
				<CampaignRateTile sizeRange={sizeRange} year={k1Year} />
			</section>

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
