"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { formatShortDate } from "~/modules/domain";
import { Pagination } from "~/modules/shared/Pagination";
import type { SortColumn } from "./schemas";
import { SORT_COLUMNS } from "./schemas";

import { STATUS_LABELS } from "./shared/constants";
import { DsfrTable } from "./shared/DsfrTable";
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
	const router = useRouter();
	const searchParams = useSearchParams();

	const handleSort = useCallback(
		(column: SortColumn) => {
			const params = new URLSearchParams(searchParams.toString());
			if (sortBy === column) {
				params.set("sortOrder", sortOrder === "asc" ? "desc" : "asc");
			} else {
				params.set("sortBy", column);
				params.set("sortOrder", "asc");
			}
			params.set("page", "1");
			router.push(`/admin/declarations?${params.toString()}`);
		},
		[searchParams, sortBy, sortOrder, router],
	);

	const handlePageChange = useCallback(
		(newPage: number) => {
			const params = new URLSearchParams(searchParams.toString());
			params.set("page", String(newPage));
			router.push(`/admin/declarations?${params.toString()}`);
		},
		[searchParams, router],
	);

	const sortIcon = (column: SortColumn) => {
		if (sortBy !== column) return null;
		return sortOrder === "asc" ? " ▲" : " ▼";
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
							<th key={col} scope="col">
								<button
									className="fr-text--sm"
									onClick={() => handleSort(col)}
									type="button"
								>
									{COLUMN_LABELS[col]}
									{sortIcon(col)}
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
							<td>{STATUS_LABELS[row.status ?? ""] ?? row.status}</td>
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
