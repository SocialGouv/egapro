"use client";

import Link from "next/link";
import { useReadOnlyGuard } from "~/modules/auth";

import styles from "./FormActions.module.scss";

type FormActionsProps = {
	previousHref?: string;
	onPrevious?: () => void;
	isPreviousPending?: boolean;
	nextHref?: string;
	nextLabel?: string;
	isSubmitting?: boolean;
	nextDisabled?: boolean;
	className?: string;
	mimoquageNextHref?: string;
};

export function FormActions({
	previousHref,
	onPrevious,
	isPreviousPending = false,
	nextHref,
	nextLabel = "Suivant",
	isSubmitting = false,
	nextDisabled = false,
	className,
	mimoquageNextHref,
}: FormActionsProps) {
	const { isReadOnly, buttonProps, tooltip } = useReadOnlyGuard();

	const showPreviousAsButton = onPrevious !== undefined && !isReadOnly;

	return (
		<div className={`fr-mt-4w ${styles.actions} ${className ?? ""}`}>
			{showPreviousAsButton ? (
				<button
					className="fr-btn fr-btn--tertiary fr-icon-arrow-left-line fr-btn--icon-left"
					disabled={isPreviousPending || isSubmitting}
					onClick={onPrevious}
					type="button"
				>
					{isPreviousPending ? "Enregistrement…" : "Précédent"}
				</button>
			) : previousHref ? (
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
						disabled={
							isReadOnly || isSubmitting || isPreviousPending || nextDisabled
						}
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
