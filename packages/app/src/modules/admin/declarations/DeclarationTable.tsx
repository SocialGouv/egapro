"use client";

import Link from "next/link";
import { formatShortDate, isCancelled } from "~/modules/domain";
import { DsfrTable } from "~/modules/shared/DsfrTable";
import { Pagination } from "~/modules/shared/Pagination";
import { useSortableTable } from "~/modules/shared/useSortableTable";
import type { SortColumn } from "./schemas";
import { SORT_COLUMNS } from "./schemas";

import { STATUS_LABELS } from "./shared/constants";
import type { DeclarationSearchRow } from "./types";

type Props = {
	rows: DeclarationSearchRow[];
	total: number;
	page: number;
	totalPages: number;
	sortBy: string;
	sortOrder: string;
};

const COLUMN_LABELS: Record<SortColumn, string> = {
	siren: "SIREN",
	companyName: "Entreprise",
	year: "Année",
	status: "Statut",
	declarantEmail: "Email déclarant",
	createdAt: "Date de dépôt",
};

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
			basePath: "/admin/declarations",
			sortBy,
			sortOrder,
		},
	);

	const renderSortIcon = (column: SortColumn) => {
		const icon = sortIcon(column);
		return icon ? <span aria-hidden="true">{icon}</span> : null;
	};

	return (
		<>
			<p className="fr-text--sm fr-text-mention--grey fr-mb-1w">
				{total} résultat{total > 1 ? "s" : ""}
			</p>
			<DsfrTable
				caption="Liste des déclarations avec SIREN, entreprise, année, statut, email déclarant et date de dépôt."
				className=""
			>
				<thead>
					<tr>
						{SORT_COLUMNS.map((col) => (
							<th aria-sort={ariaSort(col)} key={col} scope="col">
								<button
									className="fr-text--sm"
									onClick={() => handleSort(col)}
									type="button"
								>
									{COLUMN_LABELS[col]}
									{renderSortIcon(col)}
								</button>
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rows.map((row) => (
						<tr key={row.id}>
							<td>{row.siren}</td>
							<td>
								<Link href={`/admin/declarations/${row.id}`}>
									{row.companyName}
								</Link>
							</td>
							<td>{row.year}</td>
							<td>
								{isCancelled(row) ? (
									<span className="fr-badge fr-badge--warning">Annulée</span>
								) : (
									(STATUS_LABELS[row.status ?? ""] ?? row.status)
								)}
							</td>
							<td>{row.declarantEmail}</td>
							<td>{formatShortDate(row.createdAt)}</td>
						</tr>
					))}
					{rows.length === 0 && (
						<tr>
							<td colSpan={6}>Aucune déclaration trouvée.</td>
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
