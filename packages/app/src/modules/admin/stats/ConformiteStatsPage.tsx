"use client";

import { type ChangeEvent, useState } from "react";
import type { CompanySizeRange } from "~/modules/domain";
import { formatCount, formatGap } from "~/modules/domain";
import {
	CompanySizeFilter,
	type NafSectionCode,
	NafSectorFilter,
} from "~/modules/shared";
import { api } from "~/trpc/react";

import { AdminKpiTile } from "./AdminKpiTile";
import { GapChartSeriesToggle } from "./GapChartSeriesToggle";
import { MultiYearGapChart } from "./MultiYearGapChart";
import { MultiYearGapTable } from "./MultiYearGapTable";

type Props = {
	/** Reference year — also the default selection of the year filter. */
	currentYear: number;
	/** Years available in the year dropdown, newest first. */
	availableYears: number[];
};

type SegmentBy = "global" | "workforce" | "naf";

/** Default trend window: last five campaign years. */
const DEFAULT_TREND_SPAN = 4;

export function ConformiteStatsPage({ currentYear, availableYears }: Props) {
	const [year, setYear] = useState(currentYear);
	const [sizeRange, setSizeRange] = useState<CompanySizeRange | undefined>(
		undefined,
	);
	const [nafCodePrefix, setNafCodePrefix] = useState<
		NafSectionCode | undefined
	>(undefined);

	const trendDefaultFrom = Math.max(
		availableYears[availableYears.length - 1] ?? currentYear,
		currentYear - DEFAULT_TREND_SPAN,
	);
	const [trendYearFrom, setTrendYearFrom] = useState(trendDefaultFrom);
	const [trendYearTo, setTrendYearTo] = useState(currentYear);
	const [segmentBy, setSegmentBy] = useState<SegmentBy>("global");
	const [hiddenSegments, setHiddenSegments] = useState<ReadonlySet<string>>(
		new Set(),
	);

	const gapAlertRate = api.adminStats.getGapAlertRate.useQuery(
		{ year, sizeRange, nafCodePrefix },
		{ placeholderData: (prev) => prev },
	);

	const trend = api.adminStats.getMultiYearGapTrend.useQuery(
		{
			yearFrom: trendYearFrom,
			yearTo: trendYearTo,
			segmentBy,
			sizeRange,
			nafCodePrefix,
		},
		{ placeholderData: (prev) => prev },
	);

	const handleYearChange = (event: ChangeEvent<HTMLSelectElement>) => {
		setYear(Number.parseInt(event.target.value, 10));
	};

	const handleTrendYearFromChange = (event: ChangeEvent<HTMLSelectElement>) => {
		const next = Number.parseInt(event.target.value, 10);
		setTrendYearFrom(next);
		if (next > trendYearTo) setTrendYearTo(next);
	};

	const handleTrendYearToChange = (event: ChangeEvent<HTMLSelectElement>) => {
		const next = Number.parseInt(event.target.value, 10);
		setTrendYearTo(next);
		if (next < trendYearFrom) setTrendYearFrom(next);
	};

	const handleSegmentByChange = (event: ChangeEvent<HTMLSelectElement>) => {
		setSegmentBy(event.target.value as SegmentBy);
		// Reset the hidden set on mode change — the series names change, so the
		// old hidden entries no longer match.
		setHiddenSegments(new Set());
	};

	const segments = trend.data?.map(({ segment }) => segment) ?? [];

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
					<NafSectorFilter onChange={setNafCodePrefix} value={nafCodePrefix} />
				</div>
			</div>

			<section aria-labelledby="gap-alert-rate-heading" className="fr-mt-4w">
				<h2 className="fr-h3" id="gap-alert-rate-heading">
					Taux d'écart ≥ 5 %
				</h2>
				{gapAlertRate.isLoading && !gapAlertRate.data && (
					<p aria-live="polite">Chargement de l'indicateur…</p>
				)}
				{gapAlertRate.isError && (
					<div aria-live="polite" className="fr-alert fr-alert--error">
						<p>Une erreur est survenue lors du chargement du taux d'écart.</p>
					</div>
				)}
				{gapAlertRate.data && (
					<div className="fr-grid-row fr-grid-row--gutters">
						<div className="fr-col-12 fr-col-md-6 fr-col-lg-4">
							<AdminKpiTile
								deltaLabel={`vs ${year - 1}`}
								deltaPoints={gapAlertRate.data.delta}
								inverted
								subtitle={`Sur ${formatCount(gapAlertRate.data.sampleSize)} déclarations`}
								title={`Taux d'écart ≥ 5 % en ${year}`}
								value={formatGap(gapAlertRate.data.rate)}
							/>
						</div>
					</div>
				)}
			</section>

			<section
				aria-labelledby="multi-year-gap-trend-heading"
				className="fr-mt-6w"
			>
				<h2 className="fr-h3" id="multi-year-gap-trend-heading">
					Évolution annuelle des écarts
				</h2>

				<div className="fr-grid-row fr-grid-row--gutters fr-mt-2w">
					<div className="fr-col-12 fr-col-md-4">
						<div className="fr-select-group">
							<label className="fr-label" htmlFor="trend-year-from-filter">
								De
							</label>
							<select
								className="fr-select"
								id="trend-year-from-filter"
								name="yearFrom"
								onChange={handleTrendYearFromChange}
								value={trendYearFrom}
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
						<div className="fr-select-group">
							<label className="fr-label" htmlFor="trend-year-to-filter">
								À
							</label>
							<select
								className="fr-select"
								id="trend-year-to-filter"
								name="yearTo"
								onChange={handleTrendYearToChange}
								value={trendYearTo}
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
						<div className="fr-select-group">
							<label className="fr-label" htmlFor="trend-segment-filter">
								Segmenter par
							</label>
							<select
								className="fr-select"
								id="trend-segment-filter"
								name="segmentBy"
								onChange={handleSegmentByChange}
								value={segmentBy}
							>
								<option value="global">Global</option>
								<option value="workforce">Tranche d'effectif</option>
								<option value="naf">Secteur NAF</option>
							</select>
						</div>
					</div>
				</div>

				{trend.isLoading && !trend.data && (
					<p aria-live="polite">Chargement du graphique…</p>
				)}
				{trend.isError && (
					<div aria-live="polite" className="fr-alert fr-alert--error">
						<p>Une erreur est survenue lors du chargement de l'évolution.</p>
					</div>
				)}
				{trend.data && (
					<>
						<MultiYearGapChart
							hiddenSegments={hiddenSegments}
							series={trend.data}
						/>
						{segments.length > 1 && (
							<GapChartSeriesToggle
								hiddenSegments={hiddenSegments}
								onChange={setHiddenSegments}
								segments={segments}
							/>
						)}
						<MultiYearGapTable series={trend.data} />
					</>
				)}
			</section>
		</>
	);
}
