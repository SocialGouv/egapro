"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import type { SortColumn } from "./schemas";
import { SORT_COLUMNS } from "./schemas";
import { formatDate, STATUS_LABELS } from "./shared/constants";
import { Pagination } from "./shared/Pagination";
import type { DeclarationSearchRow } from "./types";

type Props = {
	rows: DeclarationSearchRow[];
	total: number;
	page: number;
	totalPages: number;
	sortBy: string;
	sortOrder: string;
	selectedIds: Set<string>;
	onSelectionChange: (ids: Set<string>) => void;
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
	selectedIds,
	onSelectionChange,
}: Props) {
	const router = useRouter();
	const searchParams = useSearchParams();

	const allSelected =
		rows.length > 0 && rows.every((r) => selectedIds.has(r.id));

	const toggleAll = useCallback(() => {
		if (allSelected) {
			onSelectionChange(new Set());
		} else {
			onSelectionChange(new Set(rows.map((r) => r.id)));
		}
	}, [allSelected, rows, onSelectionChange]);

	const toggleOne = useCallback(
		(id: string) => {
			const next = new Set(selectedIds);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			onSelectionChange(next);
		},
		[selectedIds, onSelectionChange],
	);

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
			<div className="fr-table">
				<div className="fr-table__wrapper">
					<div className="fr-table__container">
						<div className="fr-table__content">
							<table>
								<caption className="fr-sr-only">
									Liste des déclarations. Chaque ligne correspond à une
									déclaration avec le SIREN, le nom de l'entreprise, l'année, le
									statut, l'email du déclarant et la date de dépôt.
								</caption>
								<thead>
									<tr>
										<th scope="col">
											<div className="fr-checkbox-group fr-checkbox-group--sm">
												<input
													checked={allSelected}
													id="select-all"
													onChange={toggleAll}
													type="checkbox"
												/>
												<label className="fr-label" htmlFor="select-all">
													<span className="fr-sr-only">Tout sélectionner</span>
												</label>
											</div>
										</th>
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
											<td>
												<div className="fr-checkbox-group fr-checkbox-group--sm">
													<input
														checked={selectedIds.has(row.id)}
														id={`select-${row.id}`}
														onChange={() => toggleOne(row.id)}
														type="checkbox"
													/>
													<label
														className="fr-label"
														htmlFor={`select-${row.id}`}
													>
														<span className="fr-sr-only">
															Sélectionner {row.companyName}
														</span>
													</label>
												</div>
											</td>
											<td>{row.siren}</td>
											<td>
												<Link href={`/admin/declarations/${row.id}`}>
													{row.companyName}
												</Link>
											</td>
											<td>{row.year}</td>
											<td>{STATUS_LABELS[row.status ?? ""] ?? row.status}</td>
											<td>{row.declarantEmail}</td>
											<td>{formatDate(row.createdAt)}</td>
										</tr>
									))}
									{rows.length === 0 && (
										<tr>
											<td colSpan={7}>Aucune déclaration trouvée.</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
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
