"use client";

import uploadStyles from "../Step2Upload.module.scss";
import { formatFileSize } from "../shared/formatFileSize";

type Props = {
	fileName: string;
	fileSize: number;
	isUploading: boolean;
	onUpload: () => void;
	onDelete: () => void;
};

export function PendingFileCard({
	fileName,
	fileSize,
	isUploading,
	onUpload,
	onDelete,
}: Props) {
	return (
		<div className={uploadStyles.fileCard}>
			<p className="fr-text--md fr-mb-0">{fileName}</p>
			<p className="fr-text--xs fr-text--mention-grey fr-mb-1w">
				PDF – {formatFileSize(fileSize)}
			</p>
			<div className={uploadStyles.fileCardFooter}>
				<p className="fr-text--sm fr-text--mention-grey fr-mb-0">
					En attente d'envoi
				</p>
				<div>
					<button
						className="fr-btn fr-btn--secondary fr-btn--sm fr-mr-1w"
						disabled={isUploading}
						onClick={onUpload}
						type="button"
					>
						{isUploading ? "Envoi en cours…" : "Envoyer"}
					</button>
					<button
						className="fr-btn fr-btn--tertiary fr-btn--sm fr-icon-delete-line"
						disabled={isUploading}
						onClick={onDelete}
						title="Supprimer le fichier"
						type="button"
					>
						Supprimer
					</button>
				</div>
			</div>
		</div>
	);
}
