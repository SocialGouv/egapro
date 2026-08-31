import Link from "next/link";
import type { ReactNode } from "react";
import { DsfrPictogram } from "~/modules/layout";
import type { ResendReceiptInput } from "~/modules/mail";
import { ResendReceiptButton } from "~/modules/mail";
import styles from "./DemarcheConfirmation.module.scss";
import { DownloadCard } from "./DownloadCard";
import type { DemarcheDocument } from "./demarcheDocuments";
import { FeedbackBanner } from "./FeedbackBanner";

type Props = {
	children?: ReactNode;
	documents: DemarcheDocument[];
	documentsTitle?: string;
	documentsTitleHidden?: boolean;
	email: string;
	receiptKind: ResendReceiptInput["kind"];
	receiptYear: number;
	successMessage: string;
	title: string;
};

export function DemarcheConfirmation({
	children,
	documents,
	documentsTitle = "Documents récapitulatifs de votre démarche",
	documentsTitleHidden = false,
	email,
	receiptKind,
	receiptYear,
	successMessage,
	title,
}: Props) {
	return (
		<div className={styles.page}>
			<h1 className="fr-h4 fr-mb-0">{title}</h1>

			<div className={styles.summary}>
				<div className={styles.successRow}>
					<DsfrPictogram
						className="fr-artwork--green-emeraude"
						path="/dsfr/artwork/pictograms/system/success.svg"
						size={64}
					/>
					<p className="fr-text--lead fr-text--bold fr-mb-0">
						{successMessage}
					</p>
				</div>

				<div className={styles.summaryContent}>
					{children}
					<div>
						<p className="fr-text--sm fr-mb-0">
							Un accusé de réception a été envoyé à l&apos;adresse e-mail{" "}
							<strong>{email}</strong>.
						</p>
						<p className="fr-text--sm fr-text-mention--grey fr-mb-0">
							Si ce n&apos;est pas le cas, vérifiez vos courriers indésirables
							ou SPAM. Sinon, cliquez sur le bouton ci-dessous.
						</p>
					</div>
					<div>
						<ResendReceiptButton kind={receiptKind} year={receiptYear} />
					</div>
				</div>
			</div>

			<div className={styles.documents}>
				<h2 className={documentsTitleHidden ? "fr-sr-only" : "fr-h5 fr-mb-0"}>
					{documentsTitle}
				</h2>
				{documents.map((document) => (
					<DownloadCard
						dataYear={document.dataYear}
						href={document.href}
						key={document.href}
						title={document.title}
						year={document.year}
					/>
				))}
			</div>

			<FeedbackBanner />

			<div className={styles.actions}>
				<Link className="fr-btn" href="/mon-espace">
					Mon espace
				</Link>
			</div>
		</div>
	);
}
