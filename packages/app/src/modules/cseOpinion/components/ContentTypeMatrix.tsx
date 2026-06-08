"use client";

import { NewTabNotice } from "~/modules/layout/shared/NewTabNotice";

import type { AssociationMap, ContentTypeColumn, UploadedFile } from "../types";
import styles from "./ContentTypeMatrix.module.scss";

type Props = {
	files: UploadedFile[];
	columns: ContentTypeColumn[];
	associations: AssociationMap;
	onToggle: (columnId: string, fileId: string, checked: boolean) => void;
	onDelete: (fileId: string) => void;
	deletingFileId: string | null;
	disabled?: boolean;
};

function columnHeaderId(column: ContentTypeColumn): string {
	return `matrix-col-${column.declarationNumber}-${column.type}`;
}

function checkboxLabel(column: ContentTypeColumn, fileName: string): string {
	const declarationPart = column.declarationLabel
		? ` — ${column.declarationLabel}`
		: "";
	return `${column.label}${declarationPart} — ${fileName}`;
}

export function ContentTypeMatrix({
	files,
	columns,
	associations,
	onToggle,
	onDelete,
	deletingFileId,
	disabled = false,
}: Props) {
	return (
		<div className={`fr-table fr-table--bordered ${styles.matrix}`}>
			<div className="fr-table__wrapper">
				<div className="fr-table__container">
					<div className="fr-table__content">
						<table>
							<caption className="fr-sr-only">
								Associez chaque fichier déposé aux types de contenu requis.
							</caption>
							<thead>
								<tr>
									<th className="fr-cell--fixed" scope="col">
										Fichier
									</th>
									{columns.map((column) => (
										<th
											className={`fr-cell--multiline ${styles.columnHeader}`}
											id={columnHeaderId(column)}
											key={column.id}
											scope="col"
										>
											<span className={styles.columnLabel}>{column.label}</span>
											{column.declarationLabel && (
												<span className={styles.columnSubLabel}>
													{column.declarationLabel}
												</span>
											)}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{files.map((file) => {
									const fileHeaderId = `matrix-file-${file.id}`;
									return (
										<tr key={file.id}>
											<th
												className="fr-cell--fixed fr-cell--multiline"
												id={fileHeaderId}
												scope="row"
											>
												<span className={styles.fileCell}>
													<a
														className="fr-link"
														href={`/api/v1/files/${file.id}`}
														rel="noopener noreferrer"
														target="_blank"
														title={`Visualiser ${file.fileName}`}
													>
														{file.fileName}
														<NewTabNotice />
													</a>
													<span className="fr-text--xs fr-text--mention-grey fr-mb-0">
														PDF
													</span>
													<button
														className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-icon-delete-line fr-btn--icon-left"
														disabled={disabled || deletingFileId === file.id}
														onClick={() => onDelete(file.id)}
														type="button"
													>
														{deletingFileId === file.id
															? "Suppression…"
															: "Supprimer"}
													</button>
												</span>
											</th>
											{columns.map((column) => {
												const associatedFileId =
													associations[column.id] ?? null;
												const checked = associatedFileId === file.id;
												const lockedByOther =
													associatedFileId !== null &&
													associatedFileId !== file.id;
												const inputId = `matrix-${file.id}-${column.id}`;
												return (
													<td
														className={`fr-cell--center ${styles.checkboxCell}`}
														headers={`${fileHeaderId} ${columnHeaderId(column)}`}
														key={column.id}
													>
														<div className="fr-checkbox-group fr-checkbox-group--sm">
															<input
																checked={checked}
																disabled={disabled || lockedByOther}
																id={inputId}
																onChange={(event) =>
																	onToggle(
																		column.id,
																		file.id,
																		event.target.checked,
																	)
																}
																type="checkbox"
															/>
															<label
																className="fr-label fr-sr-only"
																htmlFor={inputId}
															>
																{checkboxLabel(column, file.fileName)}
															</label>
														</div>
													</td>
												);
											})}
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
}
