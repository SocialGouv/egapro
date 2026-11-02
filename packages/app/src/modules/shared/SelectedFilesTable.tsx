import { NewTabNotice } from "~/modules/layout/shared/NewTabNotice";
import { DsfrTable } from "./DsfrTable";
import styles from "./FileUpload.module.scss";
import { formatFileMeta } from "./uploadConfig";

export function getExtensionLabel(name: string): string {
	const ext = name.split(".").pop()?.toUpperCase();
	return ext ?? "Fichier";
}

type Props = {
	title: string;
	files: File[];
	objectUrls: string[];
	disabled: boolean;
	onRemove: (index: number) => void;
};

export function SelectedFilesTable({
	title,
	files,
	objectUrls,
	disabled,
	onRemove,
}: Props) {
	return (
		<DsfrTable caption={title} className="fr-mt-4w fr-mb-0">
			<thead>
				<tr>
					<th scope="col">{title}</th>
					<th className={styles.actionsColumn} scope="col">
						<span className="fr-sr-only">Actions</span>
					</th>
				</tr>
			</thead>
			<tbody>
				{files.map((file, index) => (
					<tr key={file.name}>
						<td>
							<span className={styles.fileCardInfo}>
								{objectUrls[index] ? (
									<a
										className="fr-link"
										href={objectUrls[index]}
										rel="noopener noreferrer"
										target="_blank"
									>
										{file.name}
										<NewTabNotice />
									</a>
								) : (
									file.name
								)}
								<span className="fr-text--xs fr-text-mention--grey fr-mb-0">
									{formatFileMeta(getExtensionLabel(file.name), file.size)}
								</span>
							</span>
						</td>
						<td className="fr-cell--center">
							<button
								className="fr-btn fr-btn--secondary fr-btn--sm fr-icon-delete-line"
								disabled={disabled}
								onClick={() => onRemove(index)}
								title={`Supprimer ${file.name}`}
								type="button"
							>
								<span className="fr-sr-only">Supprimer {file.name}</span>
							</button>
						</td>
					</tr>
				))}
			</tbody>
		</DsfrTable>
	);
}
