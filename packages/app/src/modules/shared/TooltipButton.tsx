"use client";

import styles from "./TooltipButton.module.scss";

type TooltipButtonProps = {
	id: string;
	label: string;
	text?: string;
};

export function TooltipButton({ id, label, text }: TooltipButtonProps) {
	const labelId = `${id}-label`;
	return (
		<>
			<button
				aria-describedby={text ? id : undefined}
				aria-labelledby={labelId}
				className={`fr-btn--tooltip fr-btn ${styles.button}`}
				type="button"
			>
				<span className="fr-sr-only" id={labelId}>
					{label}
				</span>
			</button>
			{text && (
				<span className="fr-tooltip fr-placement" id={id} role="tooltip">
					{text}
				</span>
			)}
		</>
	);
}
