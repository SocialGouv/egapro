import Image from "next/image";

import styles from "./SavedIndicator.module.scss";

type Props = {
	isSaving?: boolean;
	isPendingSave?: boolean;
	hasData: boolean;
};

export function SavedIndicator({
	isSaving = false,
	isPendingSave = false,
	hasData,
}: Props) {
	const isBusy = isSaving || isPendingSave;
	if (!isBusy && !hasData) return null;
	return (
		<p
			aria-busy={isBusy}
			aria-live="polite"
			className={`fr-mb-0 fr-text--lg ${styles.indicator}`}
			role="status"
		>
			{isBusy ? (
				<>
					<span
						aria-hidden="true"
						className={`fr-icon-refresh-line ${styles.iconSlot} ${styles.spinning}`}
					/>
					Enregistre
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
