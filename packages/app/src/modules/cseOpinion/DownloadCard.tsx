"use client";

import { useFileDownload } from "~/modules/shared";
import styles from "./ConfirmationPage.module.scss";

type Props = {
	dataYear: number;
	href: string;
	title: string;
	year: number;
};

export function DownloadCard({ dataYear, href, title, year }: Props) {
	const { state, download } = useFileDownload();

	return (
		<>
			<a
				aria-busy={state === "pending" ? "true" : undefined}
				aria-disabled={state === "pending" ? "true" : undefined}
				className={styles.downloadCard}
				href={href}
				onClick={(e) => {
					e.preventDefault();
					void download(href);
				}}
			>
				<p className="fr-text--bold fr-text--md fr-mb-1w">
					{state === "pending" ? "Téléchargement en cours…" : title}
				</p>
				<p className="fr-text--sm fr-text--default-grey fr-mb-1w">
					Année {year} au titre des données {dataYear}
				</p>
				<div className={styles.downloadFooter}>
					<span className="fr-text--xs fr-text--mention-grey">PDF</span>
					<span aria-hidden="true" className="fr-icon-download-line" />
				</div>
			</a>
			<p aria-atomic="true" aria-live="polite" className="fr-sr-only">
				{state === "pending" ? "Téléchargement en cours…" : ""}
			</p>
			{state === "error" && (
				<p className="fr-text--xs fr-error-text fr-mt-1w fr-mb-0" role="alert">
					Le téléchargement a échoué, réessayez.
				</p>
			)}
		</>
	);
}
