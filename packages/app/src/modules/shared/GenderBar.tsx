import type { ReactNode } from "react";

import styles from "./GenderBar.module.scss";

/**
 * Percentage-to-class lookup for the generated `.w0`…`.w100` rules.
 * Values arrive as 0–100 and may be null when an indicator is not computable.
 */
function widthClass(percent: number | null): string {
	const clamped =
		percent === null ? 0 : Math.round(Math.min(100, Math.max(0, percent)));
	return styles[`w${clamped}`] ?? "";
}

type LegendItemProps = { className?: string; children: ReactNode };

function LegendItem({ className, children }: LegendItemProps) {
	return (
		<p className={styles.legendItem}>
			<span aria-hidden="true" className={`${styles.swatch} ${className}`} />
			<span>{children}</span>
		</p>
	);
}

type StackedGenderBarProps = {
	womenPercent: number | null;
	menPercent: number | null;
	womenLabel: ReactNode;
	menLabel: ReactNode;
};

/**
 * Two segments sharing a single track, as in the Figma "Répartition des
 * effectifs" and quartile cards. The track itself is hidden from assistive
 * technology: it restates the legend below it, which is real text, and the
 * "Détails des données" table gives the same figures in tabular form.
 */
export function StackedGenderBar({
	womenPercent,
	menPercent,
	womenLabel,
	menLabel,
}: StackedGenderBarProps) {
	return (
		<div>
			<div
				aria-hidden="true"
				className={`${styles.track} ${styles.trackPlain}`}
			>
				<span
					className={`${styles.segment} ${styles.women} ${widthClass(womenPercent)}`}
				/>
				<span
					className={`${styles.segment} ${styles.men} ${widthClass(menPercent)}`}
				/>
			</div>
			<div className={styles.legend}>
				<LegendItem className={styles.women}>{womenLabel}</LegendItem>
				<LegendItem className={styles.men}>{menLabel}</LegendItem>
			</div>
		</div>
	);
}

type SingleGenderBarProps = {
	percent: number | null;
	label: ReactNode;
	gender: "women" | "men";
};

/**
 * One bar per gender, drawn full width, for proportions that do not add up to
 * 100 % — the Figma "Proportion de femmes et d'hommes bénéficiaires" card.
 */
export function SingleGenderBar({
	percent,
	label,
	gender,
}: SingleGenderBarProps) {
	const colorClass = gender === "women" ? styles.women : styles.men;
	return (
		<div>
			<div aria-hidden="true" className={styles.track}>
				<span
					className={`${styles.segment} ${colorClass} ${widthClass(percent)}`}
				/>
			</div>
			<div className={`${styles.legend} ${styles.legendSingle}`}>
				<LegendItem className={colorClass}>{label}</LegendItem>
			</div>
		</div>
	);
}

type GenderBarRowProps = StackedGenderBarProps & { label: ReactNode };

/** A labelled stacked bar — one quartile line of the Figma quartile cards. */
export function GenderBarRow({ label, ...bar }: GenderBarRowProps) {
	return (
		<div className={styles.row}>
			<span className={styles.rowLabel}>{label}</span>
			<div className={styles.rowBar}>
				<StackedGenderBar {...bar} />
			</div>
		</div>
	);
}

/** Hairline between two `GenderBarRow`, as drawn in the Figma cards. */
export function GenderBarSeparator() {
	return <hr className={styles.separator} />;
}
