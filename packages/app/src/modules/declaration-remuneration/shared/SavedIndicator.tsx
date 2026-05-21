import Image from "next/image";

import styles from "./SavedIndicator.module.scss";

type Props = {
	isSaving?: boolean;
	isPendingSave?: boolean;
};

export function SavedIndicator({
	isSaving = false,
	isPendingSave = false,
}: Props) {
	return (
		<p
			aria-busy={isSaving || isPendingSave}
			aria-live="polite"
			className={`fr-mb-0 fr-text--lg ${styles.indicator}`}
			role="status"
		>
			{isPendingSave ? (
				<>
					<span
						aria-hidden="true"
						className={`fr-icon-pencil-line ${styles.iconSlot}`}
					/>
					Non enregistré
				</>
			) : isSaving ? (
				<>
					<span
						aria-hidden="true"
						className={`fr-icon-refresh-line ${styles.iconSlot} ${styles.spinning}`}
					/>
					Enregistrement...
				</>
			) : (
				<>
					<span className={styles.iconSlot}>
						<Image
							alt=""
							aria-hidden="true"
							height={24}
							src="/assets/declaration-remuneration/cloud-check.svg"
							width={24}
						/>
					</span>
					Enregistré
				</>
			)}
		</p>
	);
}
