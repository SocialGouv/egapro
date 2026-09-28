import type { ReactNode } from "react";

import styles from "./IndicatorCard.module.scss";
import { TooltipButton } from "./TooltipButton";

export type IndicatorCardTooltip = {
	/** Id of the `<span role="tooltip">`; must be unique in the document. */
	id: string;
	/** Accessible name of the trigger, e.g. "Aide sur l'écart moyen". */
	label: string;
	/** The explanation itself, wired to the trigger via aria-describedby. */
	text: string;
};

type Props = {
	title: ReactNode;
	titleId?: string;
	/** Heading rank, so the card slots under whatever section wraps it. */
	headingLevel?: "h3" | "h4";
	tooltip?: IndicatorCardTooltip;
	/**
	 * Block pinned to the left of the title and body — the "Total salariés"
	 * figure of the workforce card. Omitted, the body takes the full width.
	 */
	aside?: ReactNode;
	className?: string;
	children: ReactNode;
};

/**
 * The bordered white box every indicator of the observatory is drawn in: a
 * title on the left, an optional help bubble on the right, free content below.
 */
export function IndicatorCard({
	title,
	titleId,
	headingLevel = "h4",
	tooltip,
	aside,
	className,
	children,
}: Props) {
	const Heading = headingLevel;
	return (
		<div className={`${styles.card} ${className ?? ""}`}>
			{aside && <div className={styles.aside}>{aside}</div>}
			<div className={styles.main}>
				<div className={styles.header}>
					<Heading className={styles.title} id={titleId}>
						{title}
					</Heading>
					{tooltip && (
						<TooltipButton
							id={tooltip.id}
							label={tooltip.label}
							text={tooltip.text}
						/>
					)}
				</div>
				<div className={styles.body}>{children}</div>
			</div>
		</div>
	);
}
