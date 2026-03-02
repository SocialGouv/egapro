import styles from "./SavedIndicator.module.scss";

export function SavedIndicator() {
	return (
		<p className={`fr-mb-0 fr-text--lg ${styles.indicator}`}>
			<span
				aria-hidden="true"
				className="fr-icon-checkbox-circle-fill fr-icon--sm"
			/>
			Enregistré
		</p>
	);
}
