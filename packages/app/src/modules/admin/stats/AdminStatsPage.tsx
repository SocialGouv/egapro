"use client";

import { useState } from "react";

import { type CompanySizeRange, getCurrentYear } from "~/modules/domain";

import { CampaignStatsTile } from "./CampaignStatsTile";
import { StatsFilterBar } from "./StatsFilterBar";

const YEAR_HISTORY_DEPTH = 3;

function buildAvailableYears(currentYear: number): number[] {
	return Array.from(
		{ length: YEAR_HISTORY_DEPTH + 1 },
		(_, offset) => currentYear - offset,
	);
}

/**
 * Admin stats dashboard — top-level page for `/admin/stats`.
 *
 * Hosts the shared filter bar (year + effectif) and the grid of KPI tiles.
 * Filters live at the page level so every tile stays in sync when the
 * admin changes them.
 */
export function AdminStatsPage() {
	const initialYear = getCurrentYear();
	const [year, setYear] = useState(initialYear);
	const [sizeRange, setSizeRange] = useState<CompanySizeRange | undefined>(
		undefined,
	);

	const availableYears = buildAvailableYears(initialYear);

	return (
		<>
			<h1 className="fr-h1">Statistiques</h1>
			<p className="fr-text--lead">
				Suivi en temps réel de la campagne annuelle Egapro.
			</p>
			<StatsFilterBar
				availableYears={availableYears}
				onSizeRangeChange={setSizeRange}
				onYearChange={setYear}
				sizeRange={sizeRange}
				year={year}
			/>
			<section aria-labelledby="stats-kpi-heading">
				<h2 className="fr-h3 fr-mt-4w" id="stats-kpi-heading">
					Indicateurs clés
				</h2>
				<div className="fr-grid-row fr-grid-row--gutters">
					<div className="fr-col-12 fr-col-md-6">
						<CampaignStatsTile sizeRange={sizeRange} year={year} />
					</div>
				</div>
			</section>
		</>
	);
}
