import Image from "next/image";

import styles from "./SavedIndicator.module.scss";

export function SavedIndicator() {
	return (
		<p className={`fr-mb-0 fr-text--lg ${styles.indicator}`}>
			<Image
				alt=""
				aria-hidden="true"
				height={20}
				src="/assets/declaration-remuneration/cloud-check.svg"
				width={20}
			/>
			Enregistré
		</p>
	);
}
