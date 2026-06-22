"use client";

import Link from "next/link";
import { useReadOnlyGuard } from "~/modules/auth";

import styles from "./FormActions.module.scss";

type FormActionsProps = {
	previousHref?: string;
	nextHref?: string;
	nextLabel?: string;
	isSubmitting?: boolean;
	nextDisabled?: boolean;
	className?: string;
	/**
	 * URL used by the "Suivant" button while admin impersonation is active.
	 * - Provided (data already saved) → button is rendered as a Link so the admin
	 *   can navigate without triggering the submit/save mutation.
	 * - Omitted (data never saved) → button stays disabled, since navigating
	 *   forward without any saved data would skip a step (issue #3230).
	 * Ignored when `nextHref` is set (the button is already a Link).
	 */
	mimoquageNextHref?: string;
};

export function FormActions({
	previousHref,
	nextHref,
	nextLabel = "Suivant",
	isSubmitting = false,
	nextDisabled = false,
	className,
	mimoquageNextHref,
}: FormActionsProps) {
	const { isReadOnly, buttonProps, tooltip } = useReadOnlyGuard();

	return (
		<div className={`${styles.actions} ${className ?? ""}`}>
			{previousHref ? (
				<Link
					className="fr-btn fr-btn--tertiary fr-icon-arrow-left-line fr-btn--icon-left"
					href={previousHref}
				>
					Précédent
				</Link>
			) : (
				<span />
			)}
			{nextHref ? (
				<Link
					className="fr-btn fr-icon-arrow-right-line fr-btn--icon-right"
					href={nextHref}
				>
					{nextLabel}
				</Link>
			) : isReadOnly && mimoquageNextHref ? (
				<span>
					<Link
						aria-describedby={buttonProps["aria-describedby"]}
						className="fr-btn fr-icon-arrow-right-line fr-btn--icon-right"
						href={mimoquageNextHref}
					>
						{nextLabel}
					</Link>
					{tooltip}
				</span>
			) : (
				<span>
					<button
						{...buttonProps}
						className="fr-btn fr-icon-arrow-right-line fr-btn--icon-right"
						disabled={isReadOnly || isSubmitting || nextDisabled}
						type="submit"
					>
						{isSubmitting ? "Enregistrement…" : nextLabel}
					</button>
					{tooltip}
				</span>
			)}
		</div>
	);
}
