"use client";

import type { ChangeEvent } from "react";
import { COMPANY_SIZE_RANGES, type CompanySizeRange } from "~/modules/domain";

type Props = {
	value: CompanySizeRange | undefined;
	onChange: (value: CompanySizeRange | undefined) => void;
	id?: string;
	label?: string;
};

const ALL_SIZES_LABEL = "Toutes tailles";
const RANGE_ENTRIES = Object.entries(COMPANY_SIZE_RANGES) as Array<
	[CompanySizeRange, (typeof COMPANY_SIZE_RANGES)[CompanySizeRange]]
>;

export function CompanySizeFilter({
	value,
	onChange,
	id = "company-size-filter",
	label = "Filtrer par effectif",
}: Props) {
	const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
		const next = event.target.value;
		onChange(next === "" ? undefined : (next as CompanySizeRange));
	};

	return (
		<div className="fr-select-group">
			<label className="fr-label" htmlFor={id}>
				{label}
			</label>
			<select
				className="fr-select"
				id={id}
				name={id}
				onChange={handleChange}
				value={value ?? ""}
			>
				<option value="">{ALL_SIZES_LABEL}</option>
				{RANGE_ENTRIES.map(([range, { label: optionLabel }]) => (
					<option key={range} value={range}>
						{optionLabel}
					</option>
				))}
			</select>
		</div>
	);
}
