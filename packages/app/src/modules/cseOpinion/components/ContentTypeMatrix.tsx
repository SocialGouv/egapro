"use client";

import { TooltipButton } from "~/modules/declaration-remuneration/shared/TooltipButton";
import { NewTabNotice } from "~/modules/layout/shared/NewTabNotice";
import { formatFileSize } from "~/modules/shared";

import type { AssociationMap, ContentTypeColumn, UploadedFile } from "../types";
import styles from "./ContentTypeMatrix.module.scss";

const ACTIONS_HEADER_ID = "matrix-col-actions";

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

function fileMeta(fileSize: number | null): string {
	const size = formatFileSize(fileSize);
	return size ? `PDF – ${size}` : "PDF";
}

function tooltipId(column: ContentTypeColumn): string {
	return `matrix-tooltip-${column.declarationNumber}-${column.type}`;
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
		<div className={`fr-table ${styles.matrix}`}>
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
											<span className={styles.columnLabel}>
												{column.label}
												<TooltipButton
													id={tooltipId(column)}
													label={`Informations sur « ${column.label}${column.declarationLabel ? ` — ${column.declarationLabel}` : ""} »`}
													text={column.description}
												/>
											</span>
											{column.declarationLabel && (
												<span className={styles.columnSubLabel}>
													{column.declarationLabel}
												</span>
											)}
										</th>
									))}
									<th
										className="fr-cell--center"
										id={ACTIONS_HEADER_ID}
										scope="col"
									>
										<span className="fr-sr-only">Actions</span>
									</th>
								</tr>
							</thead>
							<tbody>
								{files.map((file) => {
									const fileHeaderId = `matrix-file-${file.id}`;
									return (
										<tr key={file.id}>
											<th
												className={`fr-cell--fixed fr-cell--multiline ${styles.fileHeaderCell}`}
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
														{fileMeta(file.fileSize)}
													</span>
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
															<label className="fr-label" htmlFor={inputId}>
																<span className="fr-sr-only">
																	{checkboxLabel(column, file.fileName)}
																</span>
															</label>
														</div>
													</td>
												);
											})}
											<td
												className="fr-cell--center"
												headers={`${fileHeaderId} ${ACTIONS_HEADER_ID}`}
											>
												<button
													aria-label={
														deletingFileId === file.id
															? `Suppression de ${file.fileName} en cours`
															: `Supprimer ${file.fileName}`
													}
													className="fr-btn fr-btn--secondary fr-btn--sm fr-icon-delete-line"
													disabled={disabled || deletingFileId === file.id}
													onClick={() => onDelete(file.id)}
													type="button"
												/>
											</td>
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
