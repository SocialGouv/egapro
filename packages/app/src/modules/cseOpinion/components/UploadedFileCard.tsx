"use client";

import uploadStyles from "../Step2Upload.module.scss";
import { formatFileSize } from "../shared/formatFileSize";

type Props = {
	fileName: string;
	fileSize: number;
	disabled?: boolean;
	onDelete: () => void;
};

export function UploadedFileCard({
	fileName,
	fileSize,
	disabled,
	onDelete,
}: Props) {
	return (
		<div className={uploadStyles.fileCard}>
			<p className="fr-text--md fr-mb-0">{fileName}</p>
			<p className="fr-text--xs fr-text--mention-grey fr-mb-1w">
				PDF – {formatFileSize(fileSize)}
			</p>
			<div className={uploadStyles.fileCardFooter}>
				<p className="fr-message fr-message--valid fr-mb-0">
					Importation réussie
				</p>
				<button
					className="fr-btn fr-btn--tertiary fr-btn--sm fr-icon-delete-line"
					disabled={disabled}
					onClick={onDelete}
					title="Supprimer le fichier"
					type="button"
				>
					Supprimer
				</button>
			</div>
		</div>
	);
}
