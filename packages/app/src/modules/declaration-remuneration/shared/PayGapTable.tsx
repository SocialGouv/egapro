import type { ReactElement } from "react";
import {
	displayDecimal,
	formatGap,
	gapLevel,
	normalizeDecimalInput,
	padDecimalOnBlur,
	resolveGap,
} from "~/modules/domain";
import type { PayGapField, PayGapRow } from "../types";
import common from "./common.module.scss";
import { payGapFieldId } from "./formError/payGapErrors";
import type { FieldError } from "./formError/types";
import { describedByForField, findFieldError } from "./formError/types";
import { GAP_LEVEL_LABELS, gapBadgeClass } from "./gapBadge";
import { numericInputClassName } from "./numericInputClassName";
import styles from "./PayGapTable.module.scss";

export const DEFAULT_PAY_GAP_ROWS: PayGapRow[] = [
	{ label: "Annuelle brute moyenne", womenValue: "", menValue: "" },
	{ label: "Horaire brute moyenne", womenValue: "", menValue: "" },
	{ label: "Annuelle brute médiane", womenValue: "", menValue: "" },
	{ label: "Horaire brute médiane", womenValue: "", menValue: "" },
];

export function handlePayGapRowChange(
	rows: PayGapRow[],
	index: number,
	field: PayGapField,
	value: string,
): PayGapRow[] | null {
	const normalized = normalizeDecimalInput(value);
	if (normalized === null) return null;
	if (normalized !== "" && Number.parseFloat(normalized) < 0) return null;
	return rows.map((row, i) =>
		i === index ? { ...row, [field]: normalized } : row,
	);
}

type PayGapTableProps = {
	caption: string;
	columnHeader: string | ReactElement;
	rows: PayGapRow[];
	onRowChange: (index: number, field: PayGapField, value: string) => void;
	className?: string;
	disabled?: boolean;
	readOnly?: boolean;
	/** Prefix of the generated input ids — also anchors the error messages. */
	idPrefix: string;
	/** Base id of the `FieldErrorAlert` the offending inputs point at. */
	errorAlertId?: string;
	errors?: readonly FieldError[];
};

export function PayGapTable({
	caption,
	columnHeader,
	rows,
	onRowChange,
	className,
	disabled = false,
	readOnly = false,
	idPrefix,
	errorAlertId,
	errors = [],
}: PayGapTableProps) {
	return (
		<div
			className={`fr-table fr-table--bordered fr-table--no-caption fr-mt-0 fr-mb-0 ${styles.fixedTable} ${className ?? ""}`}
		>
			<div className="fr-table__wrapper">
				<div className="fr-table__container">
					<div className="fr-table__content">
						<table>
							<caption>{caption}</caption>
							<colgroup>
								<col className={styles.colLabel} />
								<col className={styles.colValue} />
								<col className={styles.colValue} />
								<col className={styles.colGap} />
							</colgroup>
							<thead>
								<tr>
									<th scope="col">{columnHeader}</th>
									<th scope="col">Rémunération des femmes</th>
									<th scope="col">Rémunération des hommes</th>
									<th scope="col">
										<strong>Écart</strong>
										<br />
										<span className={common.fontRegular}>
											Seuil réglementaire : 5%
										</span>
									</th>
								</tr>
							</thead>
							<tbody>
								{rows.map((row, i) => {
									const gap = resolveGap(
										row.womenValue,
										row.menValue,
										row.gipReference,
									);
									const level = gapLevel(gap);
									const womenId = payGapFieldId(idPrefix, i, "womenValue");
									const menId = payGapFieldId(idPrefix, i, "menValue");
									const womenError = findFieldError(errors, womenId);
									const menError = findFieldError(errors, menId);
									return (
										<tr key={row.label}>
											<td>
												<strong>{row.label}</strong>
											</td>
											<td>
												<span className={styles.inputWithUnit}>
													<input
														aria-describedby={
															errorAlertId
																? describedByForField(errorAlertId, womenError)
																: undefined
														}
														aria-invalid={womenError ? true : undefined}
														aria-label={`${row.label} — Femmes`}
														className={numericInputClassName(
															Boolean(womenError),
														)}
														disabled={disabled}
														id={womenId}
														inputMode="decimal"
														onBlur={() =>
															padDecimalOnBlur(row.womenValue, (v) =>
																onRowChange(i, "womenValue", v),
															)
														}
														onChange={(e) =>
															onRowChange(i, "womenValue", e.target.value)
														}
														readOnly={readOnly}
														type="text"
														value={displayDecimal(row.womenValue)}
													/>
													<span aria-hidden="true">€</span>
												</span>
											</td>
											<td>
												<span className={styles.inputWithUnit}>
													<input
														aria-describedby={
															errorAlertId
																? describedByForField(errorAlertId, menError)
																: undefined
														}
														aria-invalid={menError ? true : undefined}
														aria-label={`${row.label} — Hommes`}
														className={numericInputClassName(Boolean(menError))}
														disabled={disabled}
														id={menId}
														inputMode="decimal"
														onBlur={() =>
															padDecimalOnBlur(row.menValue, (v) =>
																onRowChange(i, "menValue", v),
															)
														}
														onChange={(e) =>
															onRowChange(i, "menValue", e.target.value)
														}
														readOnly={readOnly}
														type="text"
														value={displayDecimal(row.menValue)}
													/>
													<span aria-hidden="true">€</span>
												</span>
											</td>
											<td>
												<span className={styles.gapDisplay}>
													{level === "high" && (
														<span className={gapBadgeClass(level)}>
															{GAP_LEVEL_LABELS[level]}
														</span>
													)}
													<span className={`fr-text--bold ${styles.gapValue}`}>
														{formatGap(gap)}
													</span>
												</span>
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
