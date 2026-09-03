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
	/** The search the page was reached from, kept across a year change. */
	from?: string;
};

export function YearSelector({
	id,
	siren,
	years,
	selectedYear,
	referencePeriod,
	from,
}: Props) {
	const router = useRouter();
	const fieldId = `${id}-year`;

	return (
		<div className={styles.bar}>
			<label className={`fr-label ${styles.label}`} htmlFor={fieldId}>
				Année
			</label>
			{/* WCAG 3.2.2: the reload is what a sighted user asked for by picking a
			    year, but a screen-reader user has to be told it will happen. */}
			<p className="fr-sr-only" id={`${fieldId}-hint`}>
				Le choix d’une année recharge les indicateurs affichés.
			</p>
			<select
				aria-describedby={`${fieldId}-hint`}
				className={`fr-select ${styles.select}`}
				id={fieldId}
				onChange={(event) => {
					const query = new URLSearchParams({
						year: event.currentTarget.value,
					});
					if (from) query.set("from", from);
					router.push(`/index-egapro/entreprise/${siren}?${query.toString()}`);
				}}
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
