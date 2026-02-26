"use client";

import styles from "./TooltipButton.module.scss";

type TooltipButtonProps = {
	id: string;
	label: string;
};

export function TooltipButton({ id, label }: TooltipButtonProps) {
	return (
		<>
			<button
				aria-describedby={id}
				aria-label={label}
				className={`fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-icon-question-line ${styles.button}`}
				type="button"
			/>
			<span
				className="fr-tooltip fr-placement"
				id={id}
				role="tooltip"
				aria-hidden="true"
			>
				Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
				tempor incididunt ut labore et dolore magna aliqua.
			</span>
		</>
	);
}
