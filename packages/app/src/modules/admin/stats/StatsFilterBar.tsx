"use client";

import type { CompanySizeRange } from "~/modules/domain";
import { CompanySizeFilter } from "~/modules/shared";

type Props = {
	year: number;
	onYearChange: (year: number) => void;
	sizeRange: CompanySizeRange | undefined;
	onSizeRangeChange: (range: CompanySizeRange | undefined) => void;
	availableYears: ReadonlyArray<number>;
};

/**
 * Shared filter bar for the admin stats dashboards (K1 today, K8 / K12
 * later). Year select + reusable effectif filter, controlled from the
 * parent page so multiple tiles can stay in sync.
 */
export function StatsFilterBar({
	year,
	onYearChange,
	sizeRange,
	onSizeRangeChange,
	availableYears,
}: Props) {
	return (
		<div className="fr-grid-row fr-grid-row--gutters">
			<div className="fr-col-12 fr-col-md-4">
				<div className="fr-select-group">
					<label className="fr-label" htmlFor="stats-year">
						Année
					</label>
					<select
						className="fr-select"
						id="stats-year"
						onChange={(event) => onYearChange(Number(event.target.value))}
						value={year}
					>
						{availableYears.map((availableYear) => (
							<option key={availableYear} value={availableYear}>
								{availableYear}
							</option>
						))}
					</select>
				</div>
			</div>
			<div className="fr-col-12 fr-col-md-4">
				<CompanySizeFilter
					id="stats-size-range"
					onChange={onSizeRangeChange}
					value={sizeRange}
				/>
			</div>
		</div>
	);
}
