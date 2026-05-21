import Image from "next/image";

import styles from "./SavedIndicator.module.scss";

type Props = {
	isSaving?: boolean;
};

export function SavedIndicator({ isSaving = false }: Props) {
	return (
		<p
			aria-busy={isSaving}
			aria-live="polite"
			className={`fr-mb-0 fr-text--lg ${styles.indicator}`}
			role="status"
		>
			{isSaving ? (
				<>
					<span
						aria-hidden="true"
						className={`fr-icon-refresh-line ${styles.spinning}`}
					/>
					Enregistrement...
				</>
			) : (
				<>
					<Image
						alt=""
						aria-hidden="true"
						height={20}
						src="/assets/declaration-remuneration/cloud-check.svg"
						width={20}
					/>
					Enregistré
				</>
			)}
		</p>
	);
}
