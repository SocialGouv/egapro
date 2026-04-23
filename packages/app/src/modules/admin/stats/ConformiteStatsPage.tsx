"use client";

import { type ChangeEvent, useState } from "react";

import { formatCount, formatGap } from "~/modules/domain";
import type { CompanySizeRange } from "~/modules/domain";
import {
	CompanySizeFilter,
	NafSectorFilter,
	type NafSectionCode,
} from "~/modules/shared";
import { api } from "~/trpc/react";

import { AdminKpiTile } from "./AdminKpiTile";

type Props = {
	/** Reference year — also the default selection of the year filter. */
	currentYear: number;
	/** Years available in the year dropdown, newest first. */
	availableYears: number[];
};

export function ConformiteStatsPage({ currentYear, availableYears }: Props) {
	const [year, setYear] = useState(currentYear);
	const [sizeRange, setSizeRange] = useState<CompanySizeRange | undefined>(
		undefined,
	);
	const [nafCodePrefix, setNafCodePrefix] = useState<
		NafSectionCode | undefined
	>(undefined);

	const query = api.adminStats.getGapAlertRate.useQuery(
		{ year, sizeRange, nafCodePrefix },
		{ placeholderData: (prev) => prev },
	);

	const handleYearChange = (event: ChangeEvent<HTMLSelectElement>) => {
		setYear(Number.parseInt(event.target.value, 10));
	};

	return (
		<>
			<h1 className="fr-h1">Statistiques conformité</h1>
			<p>
				Suivi des indicateurs réglementaires de conformité des déclarations
				d'égalité professionnelle. Le taux d'écart ≥ 5 % mesure la part
				d'entreprises en alerte au titre du seuil légal.
			</p>

			<div className="fr-grid-row fr-grid-row--gutters fr-mt-4w">
				<div className="fr-col-12 fr-col-md-4">
					<div className="fr-select-group">
						<label className="fr-label" htmlFor="conformite-year-filter">
							Année
						</label>
						<select
							className="fr-select"
							id="conformite-year-filter"
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
				<div className="fr-col-12 fr-col-md-4">
					<CompanySizeFilter
						label="Tranche d'effectif"
						onChange={setSizeRange}
						value={sizeRange}
					/>
				</div>
				<div className="fr-col-12 fr-col-md-4">
					<NafSectorFilter
						onChange={setNafCodePrefix}
						value={nafCodePrefix}
					/>
				</div>
			</div>

			<section aria-labelledby="gap-alert-rate-heading" className="fr-mt-4w">
				<h2 className="fr-h3" id="gap-alert-rate-heading">
					Taux d'écart ≥ 5 %
				</h2>
				{query.isLoading && !query.data && (
					<p aria-live="polite">Chargement de l'indicateur…</p>
				)}
				{query.isError && (
					<div aria-live="polite" className="fr-alert fr-alert--error">
						<p>Une erreur est survenue lors du chargement du taux d'écart.</p>
					</div>
				)}
				{query.data && (
					<div className="fr-grid-row fr-grid-row--gutters">
						<div className="fr-col-12 fr-col-md-6 fr-col-lg-4">
							<AdminKpiTile
								deltaLabel={`vs ${year - 1}`}
								deltaPoints={query.data.delta}
								inverted
								subtitle={`Sur ${formatCount(query.data.sampleSize)} déclarations`}
								title={`Taux d'écart ≥ 5 % en ${year}`}
								value={formatGap(query.data.rate)}
							/>
						</div>
					</div>
				)}
			</section>
		</>
	);
}
