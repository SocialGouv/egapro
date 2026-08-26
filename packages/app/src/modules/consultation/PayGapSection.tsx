"use client";

import { type ReactNode, useState } from "react";
import {
	IndicatorCard,
	type IndicatorCardTooltip,
} from "~/modules/shared/IndicatorCard";
import { formatGap, gapDirection } from "./formatters";
import styles from "./indicatorSection.module.scss";

export type GapCardContent = {
	title: string;
	value: number | null;
	tooltip: IndicatorCardTooltip;
};

export type PeriodContent = { mean: GapCardContent; median: GapCardContent };

type Props = {
	/** Prefix for the section heading id and the radio group name. */
	id: string;
	title: string;
	threshold: string;
	hourly: PeriodContent;
	annual: PeriodContent;
	/** Rendered under the two cards — the beneficiaries card of the variable section. */
	children?: ReactNode;
};

function GapCard({ content }: { content: GapCardContent }) {
	const direction = gapDirection(content.value);
	return (
		<IndicatorCard title={content.title} tooltip={content.tooltip}>
			<p className={styles.value}>{formatGap(content.value)}</p>
			<p className={styles.direction}>
				{direction.prefix}
				{direction.emphasis && <strong>{direction.emphasis}</strong>}
			</p>
		</IndicatorCard>
	);
}

/**
 * A gap block: title, regulatory threshold, an hourly/annual switch, and the
 * mean and median cards for the selected period.
 *
 * The switch is a radio group rather than two buttons because it is exactly
 * that — one choice among two, mutually exclusive, and assistive technology
 * announces the pair and the current selection without any ARIA of our own.
 */
export function PayGapSection({
	id,
	title,
	threshold,
	hourly,
	annual,
	children,
}: Props) {
	const [period, setPeriod] = useState<"hourly" | "annual">("hourly");
	const content = period === "hourly" ? hourly : annual;
	const headingId = `${id}-title`;

	return (
		<section aria-labelledby={headingId} className={styles.section}>
			<div className={styles.header}>
				<div>
					<h3 className={styles.title} id={headingId}>
						{title}
					</h3>
					<p className={styles.threshold}>{threshold}</p>
				</div>
				<fieldset className="fr-segmented fr-segmented--no-legend">
					<legend className="fr-segmented__legend">
						Base de calcul des écarts
					</legend>
					<div className="fr-segmented__elements">
						<div className="fr-segmented__element">
							<input
								checked={period === "hourly"}
								id={`${id}-hourly`}
								name={`${id}-period`}
								onChange={() => setPeriod("hourly")}
								type="radio"
							/>
							<label className="fr-label" htmlFor={`${id}-hourly`}>
								Rémunération horaire
							</label>
						</div>
						<div className="fr-segmented__element">
							<input
								checked={period === "annual"}
								id={`${id}-annual`}
								name={`${id}-period`}
								onChange={() => setPeriod("annual")}
								type="radio"
							/>
							<label className="fr-label" htmlFor={`${id}-annual`}>
								Rémunération annuelle
							</label>
						</div>
					</div>
				</fieldset>
			</div>
			<div className={styles.cardGrid}>
				<GapCard content={content.mean} />
				<GapCard content={content.median} />
			</div>
			{children}
		</section>
	);
}
