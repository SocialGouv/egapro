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
};

export function FormActions({
	previousHref,
	nextHref,
	nextLabel = "Suivant",
	isSubmitting = false,
	nextDisabled = false,
	className,
}: FormActionsProps) {
	const { isReadOnly, buttonProps, tooltip } = useReadOnlyGuard();

	return (
		<div className={`fr-mt-4w ${styles.actions} ${className ?? ""}`}>
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
