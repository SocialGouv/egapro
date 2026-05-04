"use client";

import styles from "./TooltipButton.module.scss";

type TooltipButtonProps = {
	id: string;
	label: string;
	text?: string;
};

const PLACEHOLDER_TEXT =
	"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";

export function TooltipButton({ id, label, text }: TooltipButtonProps) {
	return (
		<>
			<button
				aria-describedby={id}
				aria-label={label}
				className={`fr-btn--tooltip fr-btn ${styles.button}`}
				type="button"
			/>
			<span className="fr-tooltip fr-placement" id={id} role="tooltip">
				{text ?? PLACEHOLDER_TEXT}
			</span>
		</>
	);
}
