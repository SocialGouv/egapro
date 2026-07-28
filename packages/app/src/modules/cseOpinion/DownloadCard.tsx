"use client";

import { DownloadStatusRegion, useDownloadClickGuard } from "~/modules/shared";
import styles from "./ConfirmationPage.module.scss";

const PENDING_LABEL = "Téléchargement en cours…";

type Props = {
	dataYear: number;
	href: string;
	title: string;
	year: number;
};

export function DownloadCard({ dataYear, href, title, year }: Props) {
	const { anchorProps, state } = useDownloadClickGuard(href);

	return (
		<>
			<a className={styles.downloadCard} {...anchorProps}>
				<p className="fr-text--bold fr-text--md fr-mb-1w">
					{state === "pending" ? PENDING_LABEL : title}
				</p>
				<p className="fr-text--sm fr-text--default-grey fr-mb-1w">
					Année {year} au titre des données {dataYear}
				</p>
				<div className={styles.downloadFooter}>
					<span className="fr-text--xs fr-text--mention-grey">PDF</span>
					<span aria-hidden="true" className="fr-icon-download-line" />
				</div>
			</a>
			<DownloadStatusRegion pendingLabel={PENDING_LABEL} state={state} />
		</>
	);
}
