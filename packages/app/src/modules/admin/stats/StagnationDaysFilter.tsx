"use client";

import {
	DROPOFF_STAGNATION_DAYS_MAX,
	DROPOFF_STAGNATION_DAYS_MIN,
} from "~/modules/domain";

type Props = {
	value: number;
	onChange: (value: number) => void;
};

const INPUT_ID = "stagnation-days-input";

/**
 * Controlled DSFR numeric input for the K5 « stagnation window » filter.
 *
 * The component is intentionally **not** debounced: the parent decides when
 * to debounce the value before forwarding it to the underlying tRPC query.
 * That separation keeps the filter testable in isolation and reusable.
 */
export function StagnationDaysFilter({ value, onChange }: Props) {
	return (
		<div className="fr-input-group">
			<label className="fr-label" htmlFor={INPUT_ID}>
				Considérer une déclaration abandonnée après
				<span className="fr-hint-text">
					Entre {DROPOFF_STAGNATION_DAYS_MIN} et {DROPOFF_STAGNATION_DAYS_MAX}{" "}
					jours sans progression
				</span>
			</label>
			<div className="fr-input-wrap">
				<input
					className="fr-input"
					id={INPUT_ID}
					inputMode="numeric"
					max={DROPOFF_STAGNATION_DAYS_MAX}
					min={DROPOFF_STAGNATION_DAYS_MIN}
					onChange={(event) => {
						const parsed = Number.parseInt(event.target.value, 10);
						if (!Number.isFinite(parsed)) return;
						const clamped = Math.min(
							DROPOFF_STAGNATION_DAYS_MAX,
							Math.max(DROPOFF_STAGNATION_DAYS_MIN, parsed),
						);
						onChange(clamped);
					}}
					step={1}
					type="number"
					value={value}
				/>
			</div>
		</div>
	);
}
