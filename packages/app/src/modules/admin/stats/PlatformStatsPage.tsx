"use client";

import { type ChangeEvent, useState } from "react";

import {
	type CompanySizeRange,
	FUNNEL_DROP_ALERT_THRESHOLD,
} from "~/modules/domain";
import { CompanySizeFilter } from "~/modules/shared";
import { api } from "~/trpc/react";

import { CompletionFunnelChart } from "./CompletionFunnelChart";
import { CompletionFunnelTable } from "./CompletionFunnelTable";

type Props = {
	currentYear: number;
	availableYears: number[];
};

export function PlatformStatsPage({ currentYear, availableYears }: Props) {
	const [year, setYear] = useState<number>(availableYears[0] ?? currentYear);
	const [sizeRange, setSizeRange] = useState<CompanySizeRange | undefined>(
		undefined,
	);

	const query = api.adminStats.getCompletionFunnel.useQuery(
		{ year, sizeRange },
		{ placeholderData: (prev) => prev },
	);

	const handleYearChange = (event: ChangeEvent<HTMLSelectElement>) => {
		setYear(Number(event.target.value));
	};

	const hasRevisionData = (query.data?.revisionFunnel[0]?.count ?? 0) > 0;

	return (
		<>
			<h1 className="fr-h1">Statistiques plateforme</h1>
			<p>
				Funnels de complétion des déclarations sur la campagne sélectionnée. Une
				chute supérieure à {FUNNEL_DROP_ALERT_THRESHOLD} % entre deux jalons
				consécutifs est mise en évidence en rouge.
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
					<div className="fr-select-group">
						<label className="fr-label" htmlFor="platform-stats-year">
							Année de campagne
						</label>
						<select
							className="fr-select"
							id="platform-stats-year"
							name="year"
							onChange={handleYearChange}
							value={year}
						>
							{availableYears.map((y) => (
								<option key={y} value={y}>
									{y}
								</option>
							))}
						</select>
					</div>
				</div>
			</div>

			{query.isLoading && !query.data && (
				<p aria-live="polite" className="fr-mt-4w">
					Chargement des funnels…
				</p>
			)}
			{query.isError && (
				<div aria-live="polite" className="fr-alert fr-alert--error fr-mt-4w">
					<p>Une erreur est survenue lors du chargement des funnels.</p>
				</div>
			)}

			{query.data && (
				<>
					<section
						aria-labelledby="completion-funnel-main-heading"
						className="fr-mt-6w"
					>
						<h2 className="fr-h3" id="completion-funnel-main-heading">
							Funnel principal — toutes les déclarations
						</h2>
						<CompletionFunnelChart
							caption="Funnel principal — toutes les déclarations"
							dropThreshold={FUNNEL_DROP_ALERT_THRESHOLD}
							rows={query.data.mainFunnel}
						/>
						<CompletionFunnelTable
							caption="Funnel principal — toutes les déclarations"
							rows={query.data.mainFunnel}
						/>
					</section>

					<section
						aria-labelledby="completion-funnel-compliance-heading"
						className="fr-mt-6w"
					>
						<h2 className="fr-h3" id="completion-funnel-compliance-heading">
							Funnel parcours conformité — déclarations avec écart ≥ 5 %
						</h2>
						<CompletionFunnelChart
							caption="Funnel parcours conformité — déclarations avec écart ≥ 5 %"
							dropThreshold={FUNNEL_DROP_ALERT_THRESHOLD}
							rows={query.data.complianceFunnel}
						/>
						<CompletionFunnelTable
							caption="Funnel parcours conformité — déclarations avec écart ≥ 5 %"
							rows={query.data.complianceFunnel}
						/>
					</section>

					<section
						aria-labelledby="completion-funnel-revision-heading"
						className="fr-mt-6w"
					>
						<h2 className="fr-h3" id="completion-funnel-revision-heading">
							Funnel cycle de révision — déclarations ayant nécessité une
							révision
						</h2>
						{hasRevisionData ? (
							<>
								<CompletionFunnelChart
									caption="Funnel cycle de révision — déclarations ayant nécessité une révision"
									dropThreshold={FUNNEL_DROP_ALERT_THRESHOLD}
									rows={query.data.revisionFunnel}
								/>
								<CompletionFunnelTable
									caption="Funnel cycle de révision — déclarations ayant nécessité une révision"
									rows={query.data.revisionFunnel}
								/>
							</>
						) : (
							<p className="fr-text--sm fr-mb-0">
								Aucune révision pour ces filtres.
							</p>
						)}
					</section>
				</>
			)}
		</>
	);
}
