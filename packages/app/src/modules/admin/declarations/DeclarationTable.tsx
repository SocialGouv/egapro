"use client";

import Link from "next/link";
import { formatShortDate } from "~/modules/domain";
import { ADMIN_DECLARATIONS, adminDeclarationHref } from "~/modules/routes";
import { DsfrTable } from "~/modules/shared/DsfrTable";
import { Pagination } from "~/modules/shared/Pagination";
import { TooltipButton } from "~/modules/shared/TooltipButton";
import { useSortableTable } from "~/modules/shared/useSortableTable";
import styles from "./DeclarationTable.module.scss";
import type { SortColumn } from "./schemas";
import {
	columnHelpLabel,
	DEMARCHE_STATUS_BADGE_CLASSES,
	DEMARCHE_STATUS_COLUMN_LABEL,
	DEMARCHE_STATUS_HELP,
	DEMARCHE_STATUS_LABELS,
	LAST_TRANSMITTED_STEP_COLUMN_LABEL,
	LAST_TRANSMITTED_STEP_HELP,
	NEXT_STEP_COLUMN_LABEL,
	NEXT_STEP_HELP,
	STATUS_DATE_COLUMN_LABEL,
	STATUS_DATE_HELP,
	WORKFORCE_LABEL,
} from "./shared/constants";
import type { DeclarationSearchRow } from "./types";

type Props = {
	rows: DeclarationSearchRow[];
	total: number;
	page: number;
	totalPages: number;
	sortBy: string;
	sortOrder: string;
};

type Column = {
	key: string;
	label: string;
	sortKey?: SortColumn;
	help?: string;
};

const COLUMNS: ReadonlyArray<Column> = [
	{ key: "siren", label: "SIREN", sortKey: "siren" },
	{ key: "company-name", label: "Entreprise", sortKey: "companyName" },
	{ key: "year", label: "Année", sortKey: "year" },
	{ key: "workforce", label: WORKFORCE_LABEL, sortKey: "workforce" },
	{
		key: "demarche-status",
		label: DEMARCHE_STATUS_COLUMN_LABEL,
		sortKey: "demarcheStatus",
		help: DEMARCHE_STATUS_HELP,
	},
	{
		key: "last-transmitted-step",
		label: LAST_TRANSMITTED_STEP_COLUMN_LABEL,
		help: LAST_TRANSMITTED_STEP_HELP,
	},
	{ key: "next-step", label: NEXT_STEP_COLUMN_LABEL, help: NEXT_STEP_HELP },
	{
		key: "declarant-email",
		label: "Email déclarant",
		sortKey: "declarantEmail",
	},
	{
		key: "status-date",
		label: STATUS_DATE_COLUMN_LABEL,
		sortKey: "statusDate",
		help: STATUS_DATE_HELP,
	},
];

export function DeclarationTable({
	rows,
	total,
	page,
	totalPages,
	sortBy,
	sortOrder,
}: Props) {
	const { handleSort, handlePageChange, ariaSort, sortIcon } = useSortableTable(
		{
			basePath: ADMIN_DECLARATIONS,
			sortBy,
			sortOrder,
		},
	);

	const renderSortIcon = (column: SortColumn) => {
		const icon = sortIcon(column);
		return icon ? <span aria-hidden="true">{icon}</span> : null;
	};

	const renderHeader = ({ key, label, sortKey, help }: Column) => (
		<th
			aria-sort={sortKey ? ariaSort(sortKey) : undefined}
			key={key}
			scope="col"
		>
			{sortKey ? (
				<button
					className="fr-text--sm"
					onClick={() => handleSort(sortKey)}
					type="button"
				>
					{label}
					{renderSortIcon(sortKey)}
				</button>
			) : (
				<span className="fr-text--sm">{label}</span>
			)}
			{help && (
				<TooltipButton
					id={`tooltip-admin-declarations-${key}`}
					label={columnHelpLabel(label)}
					text={help}
				/>
			)}
		</th>
	);

	return (
		<>
			<p className="fr-text--sm fr-text-mention--grey fr-mb-1w">
				{total} résultat{total > 1 ? "s" : ""}
			</p>
			<DsfrTable
				caption="Liste des déclarations avec SIREN, entreprise, année, effectif annuel moyen issu du fichier GIP-MDS, statut de la démarche, dernière étape transmise, prochaine étape, email déclarant et date."
				className=""
			>
				<thead>
					<tr>{COLUMNS.map(renderHeader)}</tr>
				</thead>
				<tbody>
					{rows.map((row) => (
						<tr key={row.id}>
							<td>{row.siren}</td>
							<td>
								<Link
									className={styles.companyLink}
									href={adminDeclarationHref(row.id)}
								>
									{row.companyName}
								</Link>
							</td>
							<td>{row.year}</td>
							<td>{row.workforce ?? "—"}</td>
							<td>
								<span
									className={`fr-badge fr-badge--sm fr-badge--no-icon ${DEMARCHE_STATUS_BADGE_CLASSES[row.demarcheStatus]}`}
								>
									{DEMARCHE_STATUS_LABELS[row.demarcheStatus]}
								</span>
							</td>
							<td>{row.lastTransmittedStep ?? "—"}</td>
							<td>{row.nextStep ?? "—"}</td>
							<td>{row.declarantEmail}</td>
							<td>{formatShortDate(row.statusDate)}</td>
						</tr>
					))}
					{rows.length === 0 && (
						<tr>
							<td colSpan={COLUMNS.length}>Aucune déclaration trouvée.</td>
						</tr>
					)}
				</tbody>
			</DsfrTable>
			{totalPages > 1 && (
				<Pagination
					currentPage={page}
					onPageChange={handlePageChange}
					totalPages={totalPages}
				/>
			)}
		</>
	);
}
