"use client";

import type { ChangeEvent } from "react";

type Props = {
	/** Years that should be selectable (recent campaigns). */
	availableYears: number[];
	/** Currently selected years (subset of `availableYears`). */
	selectedYears: number[];
	/** Maximum number of years that may be selected at once. */
	maxSelection?: number;
	onChange: (years: number[]) => void;
};

export function YearsFilter({
	availableYears,
	selectedYears,
	maxSelection = 5,
	onChange,
}: Props) {
	const selectedSet = new Set(selectedYears);
	const disableUnchecked = selectedYears.length >= maxSelection;

	const handleToggle =
		(year: number) => (event: ChangeEvent<HTMLInputElement>) => {
			const next = new Set(selectedSet);
			if (event.target.checked) {
				next.add(year);
			} else {
				next.delete(year);
			}
			onChange(Array.from(next).sort((a, b) => a - b));
		};

	const hintId = "years-filter-hint";

	return (
		<fieldset className="fr-fieldset">
			<legend className="fr-fieldset__legend fr-fieldset__legend--regular">
				Années à comparer
				<span className="fr-hint-text" id={hintId}>
					Maximum {maxSelection} années sélectionnées simultanément.
				</span>
			</legend>
			{availableYears.map((year) => {
				const id = `years-filter-${year}`;
				const isChecked = selectedSet.has(year);
				const isDisabled = !isChecked && disableUnchecked;
				return (
					<div
						className="fr-fieldset__element fr-fieldset__element--inline"
						key={year}
					>
						<div className="fr-checkbox-group">
							<input
								aria-describedby={isDisabled ? hintId : undefined}
								checked={isChecked}
								disabled={isDisabled}
								id={id}
								name={id}
								onChange={handleToggle(year)}
								type="checkbox"
							/>
							<label className="fr-label" htmlFor={id}>
								{year}
							</label>
						</div>
					</div>
				);
			})}
		</fieldset>
	);
}
