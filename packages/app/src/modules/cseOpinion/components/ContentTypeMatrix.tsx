"use client";

import { NewTabNotice } from "~/modules/layout/shared/NewTabNotice";
import { apiV1FileHref } from "~/modules/routes";
import { formatFileMeta } from "~/modules/shared";
import { TooltipButton } from "~/modules/shared/TooltipButton";
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
	hiddenColumnIds?: ReadonlySet<string>;
};

function columnHeaderId(column: ContentTypeColumn): string {
	return `matrix-col-${column.declarationNumber}-${column.type}`;
}

function fileMeta(fileSize: number | null): string {
	return formatFileMeta("PDF", fileSize);
}

function tooltipId(column: ContentTypeColumn): string {
	return `matrix-tooltip-${column.declarationNumber}-${column.type}`;
}

function columnName(column: ContentTypeColumn): string {
	return column.declarationLabel
		? `${column.label} — ${column.declarationLabel}`
		: column.label;
}

function checkboxLabel(column: ContentTypeColumn, fileName: string): string {
	return `${columnName(column)} — ${fileName}`;
}

function tableCaption(
	visibleColumns: ContentTypeColumn[],
	hiddenColumns: ContentTypeColumn[],
): string {
	if (visibleColumns.length > 0 || hiddenColumns.length === 0) {
		return "Associez chaque fichier déposé aux types de contenu requis.";
	}
	return `Fichier déposé associé au type d'avis : ${hiddenColumns.map(columnName).join(", ")}.`;
}

export function ContentTypeMatrix({
	files,
	columns,
	associations,
	onToggle,
	onDelete,
	deletingFileId,
	disabled = false,
	hiddenColumnIds,
}: Props) {
	const visibleColumns = hiddenColumnIds
		? columns.filter((column) => !hiddenColumnIds.has(column.id))
		: columns;
	const hiddenColumns = hiddenColumnIds
		? columns.filter((column) => hiddenColumnIds.has(column.id))
		: [];

	return (
		<div className={`fr-table fr-table--no-caption ${styles.matrix}`}>
			<div className="fr-table__wrapper">
				<div className="fr-table__container">
					<div className="fr-table__content">
						<table>
							<caption>{tableCaption(visibleColumns, hiddenColumns)}</caption>
							<thead>
								<tr>
									<th className="fr-cell--fixed fr-cell--multiline" scope="col">
										Fichier(s) déposé(s)
									</th>
									{visibleColumns.map((column) => (
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
													label={`Informations sur « ${columnName(column)} »`}
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
														href={apiV1FileHref(file.id)}
														rel="noopener noreferrer"
														target="_blank"
														title={`Visualiser ${file.fileName}`}
													>
														{file.fileName}
														<NewTabNotice />
													</a>
													<span className="fr-text--xs fr-text-mention--grey fr-mb-0">
														{fileMeta(file.fileSize)}
													</span>
												</span>
											</th>
											{visibleColumns.map((column) => {
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
