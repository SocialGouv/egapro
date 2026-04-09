"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useState } from "react";

import type { CountyCode, RegionCode } from "~/modules/domain";
import { api } from "~/trpc/react";
import { DeleteModal, useDeleteModal } from "./DeleteConfirmationModal";
import { ImportReferentsModal, useImportModal } from "./ImportReferentsModal";
import { ReferentFormModal, useReferentFormModal } from "./ReferentFormModal";
import { ReferentTable } from "./ReferentTable";
import { SearchForm } from "./SearchForm";
import type { ReferentFormValues, SortColumn } from "./schemas";
import { DEFAULT_PAGE_SIZE } from "./schemas";
import type { ReferentSearchRow } from "./types";

function ExportButton() {
	const { data, refetch, isFetching } = api.adminReferents.exportAll.useQuery(
		undefined,
		{ enabled: false },
	);

	const handleExport = useCallback(
		async (format: "json" | "csv") => {
			const result = data ?? (await refetch()).data;
			if (!result) return;

			let content: string;
			let mimeType: string;
			let extension: string;

			if (format === "csv") {
				const headers = [
					"region",
					"county",
					"name",
					"type",
					"value",
					"principal",
					"substituteName",
					"substituteEmail",
				];
				const csvRows = [
					headers.join(";"),
					...result.map((r) =>
						headers
							.map((h) => {
								const val = r[h as keyof typeof r] ?? "";
								return `"${String(val).replace(/"/g, '""')}"`;
							})
							.join(";"),
					),
				];
				content = csvRows.join("\n");
				mimeType = "text/csv;charset=utf-8";
				extension = "csv";
			} else {
				content = JSON.stringify(result, null, 2);
				mimeType = "application/json";
				extension = "json";
			}

			const blob = new Blob([content], { type: mimeType });
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `referents.${extension}`;
			link.click();
			URL.revokeObjectURL(url);
		},
		[data, refetch],
	);

	return (
		<div className="fr-btns-group fr-btns-group--inline fr-btns-group--sm">
			<button
				className="fr-btn fr-btn--secondary fr-btn--sm fr-btn--icon-left fr-icon-download-line"
				disabled={isFetching}
				onClick={() => handleExport("json")}
				type="button"
			>
				Export JSON
			</button>
			<button
				className="fr-btn fr-btn--secondary fr-btn--sm fr-btn--icon-left fr-icon-download-line"
				disabled={isFetching}
				onClick={() => handleExport("csv")}
				type="button"
			>
				Export CSV
			</button>
		</div>
	);
}

function ReferentsContent() {
	const searchParams = useSearchParams();
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [deleteError, setDeleteError] = useState<string | null>(null);
	const [editingReferent, setEditingReferent] =
		useState<ReferentSearchRow | null>(null);
	const {
		modalRef: deleteModalRef,
		open: openDeleteModal,
		close: closeDeleteModal,
	} = useDeleteModal();
	const { createRef, editRef, openCreate, closeCreate, openEdit, closeEdit } =
		useReferentFormModal();
	const {
		modalRef: importModalRef,
		open: openImport,
		close: closeImport,
	} = useImportModal();

	const input = {
		query: searchParams.get("query") ?? undefined,
		region: (searchParams.get("region") as RegionCode) || undefined,
		county: (searchParams.get("county") as CountyCode) || undefined,
		page: Number(searchParams.get("page") ?? "1"),
		pageSize: Number(searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE)),
		sortBy: (searchParams.get("sortBy") as SortColumn) ?? "region",
		sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") ?? "asc",
	};

	const { data, isLoading, refetch } =
		api.adminReferents.search.useQuery(input);
	const deleteMutation = api.adminReferents.delete.useMutation({
		onSuccess: () => {
			setSelectedIds(new Set());
			setDeleteError(null);
			refetch();
		},
		onError: () => {
			setDeleteError("La suppression a échoué. Veuillez réessayer.");
		},
	});
	const createMutation = api.adminReferents.create.useMutation({
		onSuccess: () => refetch(),
	});
	const updateMutation = api.adminReferents.update.useMutation({
		onSuccess: () => refetch(),
	});

	const handleDelete = useCallback(() => {
		if (selectedIds.size === 0) return;
		deleteMutation.mutate({ ids: [...selectedIds] });
	}, [selectedIds, deleteMutation]);

	const handleEdit = useCallback(
		(row: ReferentSearchRow) => {
			setEditingReferent(row);
			openEdit();
		},
		[openEdit],
	);

	const handleCreateSubmit = useCallback(
		(data: ReferentFormValues & { id?: string }) => {
			createMutation.mutate(
				data as Parameters<typeof createMutation.mutate>[0],
			);
		},
		[createMutation],
	);

	const handleEditSubmit = useCallback(
		(data: ReferentFormValues & { id?: string }) => {
			if (!data.id) return;
			updateMutation.mutate(
				data as Parameters<typeof updateMutation.mutate>[0],
			);
		},
		[updateMutation],
	);

	if (isLoading) {
		return <p>Chargement...</p>;
	}

	return (
		<>
			<SearchForm />
			<div className="fr-grid-row fr-grid-row--middle fr-mb-2w">
				<div className="fr-col">
					<ul className="fr-btns-group fr-btns-group--inline">
						<li>
							<button
								className="fr-btn fr-btn--icon-left fr-icon-add-circle-line"
								onClick={openCreate}
								type="button"
							>
								Ajouter
							</button>
						</li>
						<li>
							<button
								className="fr-btn fr-btn--secondary fr-btn--icon-left fr-icon-upload-line"
								onClick={openImport}
								type="button"
							>
								Importer
							</button>
						</li>
					</ul>
				</div>
				<div className="fr-col-auto">
					<ExportButton />
				</div>
			</div>
			{deleteError && (
				<div
					aria-live="polite"
					className="fr-alert fr-alert--error fr-alert--sm fr-mb-2w"
				>
					<p>{deleteError}</p>
				</div>
			)}
			{selectedIds.size > 0 && (
				<div className="fr-mb-2w">
					<button
						className="fr-btn fr-btn--secondary fr-btn--icon-left fr-icon-delete-line"
						onClick={openDeleteModal}
						type="button"
					>
						Supprimer la sélection ({selectedIds.size})
					</button>
				</div>
			)}
			{data && (
				<ReferentTable
					onEdit={handleEdit}
					onSelectionChange={setSelectedIds}
					page={data.page}
					rows={data.rows}
					selectedIds={selectedIds}
					sortBy={input.sortBy}
					sortOrder={input.sortOrder}
					total={data.total}
					totalPages={data.totalPages}
				/>
			)}
			<DeleteModal
				count={selectedIds.size}
				modalRef={deleteModalRef}
				onClose={closeDeleteModal}
				onConfirm={handleDelete}
			/>
			<ReferentFormModal
				modalRef={createRef}
				mode="create"
				onClose={closeCreate}
				onSubmit={handleCreateSubmit}
			/>
			<ReferentFormModal
				modalRef={editRef}
				mode="edit"
				onClose={closeEdit}
				onSubmit={handleEditSubmit}
				referent={editingReferent}
			/>
			<ImportReferentsModal
				modalRef={importModalRef}
				onClose={closeImport}
				onSuccess={() => refetch()}
			/>
		</>
	);
}

export function AdminReferentsPage() {
	return (
		<>
			<h1 className="fr-h3 fr-mb-4w">Liste des référents Egapro</h1>
			<Suspense fallback={<p>Chargement...</p>}>
				<ReferentsContent />
			</Suspense>
		</>
	);
}
