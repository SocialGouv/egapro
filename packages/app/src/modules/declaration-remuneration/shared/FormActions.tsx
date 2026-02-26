import Link from "next/link";

import styles from "./FormActions.module.scss";

type FormActionsProps = {
	previousHref?: string;
	nextHref?: string;
	nextLabel?: string;
	isSubmitting?: boolean;
	nextDisabled?: boolean;
};

export function FormActions({
	previousHref,
	nextHref,
	nextLabel = "Suivant",
	isSubmitting = false,
	nextDisabled = false,
}: FormActionsProps) {
	return (
		<div className={`fr-mt-4w ${styles.actions}`}>
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
				<button
					className="fr-btn fr-icon-arrow-right-line fr-btn--icon-right"
					disabled={isSubmitting || nextDisabled}
					type="submit"
				>
					{isSubmitting ? "Enregistrement…" : nextLabel}
				</button>
			)}
		</div>
	);
}
