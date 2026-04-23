"use client";

import type { ChangeEvent } from "react";

import {
	NAF_SECTION_CODES,
	NAF_SECTIONS,
	type NafSectionCode,
} from "./nafSections";

type Props = {
	value: NafSectionCode | undefined;
	onChange: (value: NafSectionCode | undefined) => void;
	id?: string;
	label?: string;
};

const ALL_SECTORS_LABEL = "Tous les secteurs";

export function NafSectorFilter({
	value,
	onChange,
	id = "naf-sector-filter",
	label = "Filtrer par secteur NAF",
}: Props) {
	const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
		const next = event.target.value;
		onChange(next === "" ? undefined : (next as NafSectionCode));
	};

	return (
		<div className="fr-select-group">
			<label className="fr-label" htmlFor={id}>
				{label}
			</label>
			<select
				className="fr-select"
				id={id}
				name="nafCodePrefix"
				onChange={handleChange}
				value={value ?? ""}
			>
				<option value="">{ALL_SECTORS_LABEL}</option>
				{NAF_SECTION_CODES.map((code) => (
					<option key={code} value={code}>
						{code} — {NAF_SECTIONS[code]}
					</option>
				))}
			</select>
		</div>
	);
}
