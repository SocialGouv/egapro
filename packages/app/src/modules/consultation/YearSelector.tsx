"use client";

import { useRouter } from "next/navigation";
import styles from "./YearSelector.module.scss";

type Props = {
	/** Prefix for the field id: the two tab panels each render one selector. */
	id: string;
	siren: string;
	years: number[];
	selectedYear: number;
	referencePeriod: string;
};

export function YearSelector({
	id,
	siren,
	years,
	selectedYear,
	referencePeriod,
}: Props) {
	const router = useRouter();
	const fieldId = `${id}-year`;

	return (
		<div className={styles.bar}>
			<label className={`fr-label ${styles.label}`} htmlFor={fieldId}>
				Année
			</label>
			<select
				className={`fr-select ${styles.select}`}
				id={fieldId}
				onChange={(event) =>
					router.push(
						`/index-egapro/entreprise/${siren}?year=${event.currentTarget.value}`,
					)
				}
				value={selectedYear}
			>
				{years.map((year) => (
					<option key={year} value={year}>
						{year}
					</option>
				))}
			</select>
			<p className={styles.period}>
				<span aria-hidden="true" className="fr-icon-time-line fr-icon--sm" />
				Période de référence : {referencePeriod}.
			</p>
		</div>
	);
}
