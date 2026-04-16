"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import type { CountyCode, RegionCode } from "~/modules/domain";
import { COUNTIES, REGIONS } from "~/modules/domain";
import { DsfrTable } from "~/modules/shared/DsfrTable";

import type { SortColumn } from "./schemas";
import { SORT_COLUMNS } from "./schemas";
import { COLUMN_LABELS } from "./shared/constants";
import type { ReferentSearchRow } from "./types";

type Props = {
	rows: ReferentSearchRow[];
	total: number;
	page: number;
	totalPages: number;
	sortBy: string;
	sortOrder: string;
	selectedIds: Set<string>;
	onSelectionChange: (ids: Set<string>) => void;
	onEdit: (row: ReferentSearchRow) => void;
};

export function ReferentTable({
	rows,
	total,
	page,
	totalPages,
	sortBy,
	sortOrder,
	selectedIds,
	onSelectionChange,
	onEdit,
}: Props) {
	const router = useRouter();
	const searchParams = useSearchParams();

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
			router.push(`/admin/liste-referents?${params.toString()}`);
		},
		[searchParams, sortBy, sortOrder, router],
	);

	const handlePageChange = useCallback(
		(newPage: number) => {
			const params = new URLSearchParams(searchParams.toString());
			params.set("page", String(newPage));
			router.push(`/admin/liste-referents?${params.toString()}`);
		},
		[searchParams, router],
	);

	const ariaSort = (column: SortColumn) => {
		if (sortBy !== column) return undefined;
		return sortOrder === "asc"
			? ("ascending" as const)
			: ("descending" as const);
	};

	const sortIcon = (column: SortColumn) => {
		if (sortBy !== column) return null;
		return <span aria-hidden="true">{sortOrder === "asc" ? " ▲" : " ▼"}</span>;
	};

	return (
		<>
			<p className="fr-text--sm fr-text-mention--grey fr-mb-1w">
				{total} résultat{total > 1 ? "s" : ""}
			</p>
			<DsfrTable
				caption="Liste des référents avec région, département, nom, valeur, principal."
				className=""
			>
				<thead>
					<tr>
						<th className="fr-cell--fixed" scope="col">
							<span className="fr-sr-only">Sélectionner</span>
						</th>
						{SORT_COLUMNS.map((col) => (
							<th aria-sort={ariaSort(col)} key={col} scope="col">
								<button
									className="fr-text--sm"
									onClick={() => handleSort(col)}
									type="button"
								>
									{COLUMN_LABELS[col] ?? col}
									{sortIcon(col)}
								</button>
							</th>
						))}
						<th scope="col">Actions</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((row) => (
						<tr key={row.id}>
							<th className="fr-cell--fixed" scope="row">
								<div className="fr-checkbox-group fr-checkbox-group--sm">
									<input
										checked={selectedIds.has(row.id)}
										data-fr-row-select="true"
										id={`select-${row.id}`}
										onChange={() => toggleOne(row.id)}
										type="checkbox"
									/>
									<label className="fr-label" htmlFor={`select-${row.id}`}>
										Sélectionner {row.name}
									</label>
								</div>
							</th>
							<td>
								{REGIONS[row.region as RegionCode] ?? row.region} ({row.region})
							</td>
							<td>
								{row.county
									? `${COUNTIES[row.county as CountyCode] ?? row.county} (${row.county})`
									: "—"}
							</td>
							<td>
								{row.name}
								{row.substituteName && (
									<>
										<br />
										<span className="fr-text--xs fr-text-mention--grey">
											{row.substituteName}
										</span>
									</>
								)}
							</td>
							<td>
								<a
									className="fr-text--sm"
									href={
										row.type === "email" ? `mailto:${row.value}` : row.value
									}
								>
									<span
										aria-hidden="true"
										className={
											row.type === "email"
												? "fr-icon-mail-fill fr-icon--sm fr-mr-1v"
												: "fr-icon-link fr-icon--sm fr-mr-1v"
										}
									/>
									{row.value}
								</a>
								{row.substituteEmail && (
									<>
										<br />
										<a
											className="fr-text--xs"
											href={`mailto:${row.substituteEmail}`}
										>
											{row.substituteEmail}
										</a>
									</>
								)}
							</td>
							<td>
								<span
									aria-hidden="true"
									className={
										row.principal
											? "fr-icon-checkbox-fill fr-text-default--success"
											: "fr-icon-close-circle-fill fr-text-default--error"
									}
								/>
								<span className="fr-sr-only">
									{row.principal ? "Oui" : "Non"}
								</span>
							</td>
							<td>
								<button
									className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-icon-edit-fill fr-btn--icon-left"
									onClick={() => onEdit(row)}
									type="button"
								>
									Modifier
								</button>
							</td>
						</tr>
					))}
					{rows.length === 0 && (
						<tr>
							<td colSpan={8}>Aucun référent trouvé.</td>
						</tr>
					)}
				</tbody>
			</DsfrTable>
			{totalPages > 1 && (
				<p className="fr-text--sm">
					Page {page} sur {totalPages} —{" "}
					{page > 1 && (
						<button
							className="fr-link fr-mr-2w"
							onClick={() => handlePageChange(page - 1)}
							type="button"
						>
							Précédent
						</button>
					)}
					{page < totalPages && (
						<button
							className="fr-link"
							onClick={() => handlePageChange(page + 1)}
							type="button"
						>
							Suivant
						</button>
					)}
				</p>
			)}
		</>
	);
}
