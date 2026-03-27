import type { ReactElement } from "react";
import {
	computeGap,
	displayDecimal,
	formatGap,
	gapLevel,
	normalizeDecimalInput,
} from "~/modules/domain";
import type { PayGapField, PayGapRow } from "../types";
import common from "./common.module.scss";
import { GAP_LEVEL_LABELS, gapBadgeClass } from "./gapBadge";
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
};

export function PayGapTable({
	caption,
	columnHeader,
	rows,
	onRowChange,
	className,
}: PayGapTableProps) {
	return (
		<div
			className={`fr-table fr-table--no-caption fr-mt-0 fr-mb-0 ${className ?? ""}`}
		>
			<div className="fr-table__wrapper">
				<div className="fr-table__container">
					<div className="fr-table__content">
						<table>
							<caption>{caption}</caption>
							<thead>
								<tr>
									<th scope="col">{columnHeader}</th>
									<th scope="col">Femmes</th>
									<th scope="col">Hommes</th>
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
									const gap = computeGap(row.womenValue, row.menValue);
									const level = gapLevel(gap);
									return (
										<tr key={row.label}>
											<td>
												<strong>{row.label}</strong>
											</td>
											<td>
												<span className={styles.inputWithUnit}>
													<input
														aria-label={`${row.label} — Femmes`}
														className="fr-input"
														inputMode="decimal"
														onChange={(e) =>
															onRowChange(i, "womenValue", e.target.value)
														}
														type="text"
														value={displayDecimal(row.womenValue)}
													/>
													<span aria-hidden="true">€</span>
												</span>
											</td>
											<td>
												<span className={styles.inputWithUnit}>
													<input
														aria-label={`${row.label} — Hommes`}
														className="fr-input"
														inputMode="decimal"
														onChange={(e) =>
															onRowChange(i, "menValue", e.target.value)
														}
														type="text"
														value={displayDecimal(row.menValue)}
													/>
													<span aria-hidden="true">€</span>
												</span>
											</td>
											<td>
												<span className={styles.gapDisplay}>
													<span className="fr-text--bold">
														{formatGap(gap)}
													</span>
													{level === "high" && (
														<span className={gapBadgeClass(level)}>
															{GAP_LEVEL_LABELS[level]}
														</span>
													)}
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
