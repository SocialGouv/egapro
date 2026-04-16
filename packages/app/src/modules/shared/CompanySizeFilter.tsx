"use client";

import { useId } from "react";

import { COMPANY_SIZE_RANGES, type CompanySizeRange } from "~/modules/domain";

type Props = {
	value: CompanySizeRange | undefined;
	onChange: (value: CompanySizeRange | undefined) => void;
	/** Explicit id for label/select binding. If omitted, one is generated. */
	id?: string;
	/** Label text displayed above the select. */
	label?: string;
};

const RANGE_ORDER: ReadonlyArray<CompanySizeRange> = [
	"<50",
	"50-99",
	"100-149",
	"150-249",
	"250+",
];

const ALL_SIZES_VALUE = "";

/**
 * Reusable effectif (workforce range) filter for admin and public KPIs.
 *
 * Controlled `<select>` bound to a `CompanySizeRange`. `undefined` maps to
 * "Toutes tailles" and is what the caller sends to the backend to mean "no
 * filter". Options are derived from `COMPANY_SIZE_RANGES` so the labels stay
 * in sync with the legal thresholds.
 */
export function CompanySizeFilter({
	value,
	onChange,
	id,
	label = "Filtrer par effectif",
}: Props) {
	const reactId = useId();
	const selectId = id ?? `company-size-filter-${reactId}`;

	return (
		<div className="fr-select-group">
			<label className="fr-label" htmlFor={selectId}>
				{label}
			</label>
			<select
				className="fr-select"
				id={selectId}
				onChange={(event) => {
					const next = event.target.value;
					onChange(
						next === ALL_SIZES_VALUE ? undefined : (next as CompanySizeRange),
					);
				}}
				value={value ?? ALL_SIZES_VALUE}
			>
				<option value={ALL_SIZES_VALUE}>Toutes tailles</option>
				{RANGE_ORDER.map((range) => (
					<option key={range} value={range}>
						{COMPANY_SIZE_RANGES[range].label}
					</option>
				))}
			</select>
		</div>
	);
}
