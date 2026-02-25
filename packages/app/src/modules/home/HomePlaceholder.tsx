import styles from "./HomePlaceholder.module.scss";

/** Placeholder for sections still under design. */
export function HomePlaceholder() {
	return (
		<div className={styles.placeholder}>
			<p className={`fr-mb-0 ${styles.title}`}>Section non finalisée</p>
			<p className={`fr-mb-0 ${styles.description}`}>
				Cette section est encore en cours de conception et n'est pas prête pour
				le développement.
			</p>
		</div>
	);
}
