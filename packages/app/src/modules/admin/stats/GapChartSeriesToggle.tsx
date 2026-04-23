"use client";

import type { ChangeEvent } from "react";

type Props = {
	/**
	 * Full, ordered list of series on the chart — in the exact order the chart
	 * renders them, so the checkbox order matches the legend.
	 */
	segments: readonly string[];
	/** Segment names currently hidden. */
	hiddenSegments: ReadonlySet<string>;
	/** Called with the next hidden-set when the user toggles a checkbox. */
	onChange: (next: ReadonlySet<string>) => void;
	/** Stable id prefix — ensures unique ids when multiple charts coexist. */
	idPrefix?: string;
};

export function GapChartSeriesToggle({
	segments,
	hiddenSegments,
	onChange,
	idPrefix = "gap-chart-series",
}: Props) {
	const handleChange =
		(segment: string) => (event: ChangeEvent<HTMLInputElement>) => {
			const next = new Set(hiddenSegments);
			if (event.target.checked) {
				next.delete(segment);
			} else {
				next.add(segment);
			}
			onChange(next);
		};

	return (
		<fieldset
			aria-describedby={`${idPrefix}-hint`}
			className="fr-fieldset"
			id={`${idPrefix}-fieldset`}
		>
			<legend
				className="fr-fieldset__legend fr-fieldset__legend--regular"
				id={`${idPrefix}-legend`}
			>
				Séries affichées
				<span className="fr-hint-text" id={`${idPrefix}-hint`}>
					Décochez une série pour la masquer du graphique.
				</span>
			</legend>
			{segments.map((segment) => {
				const checkboxId = `${idPrefix}-${segment}`;
				const checked = !hiddenSegments.has(segment);
				return (
					<div
						className="fr-fieldset__element fr-fieldset__element--inline"
						key={segment}
					>
						<div className="fr-checkbox-group">
							<input
								checked={checked}
								id={checkboxId}
								name={checkboxId}
								onChange={handleChange(segment)}
								type="checkbox"
							/>
							<label className="fr-label" htmlFor={checkboxId}>
								{segment}
							</label>
						</div>
					</div>
				);
			})}
		</fieldset>
	);
}
