"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useState } from "react";

import { api } from "~/trpc/react";

import { DeclarationTable } from "./DeclarationTable";
import { DeleteModal, useDeleteModal } from "./DeleteConfirmationModal";
import { SearchForm } from "./SearchForm";
import type { SortColumn } from "./schemas";
import { DEFAULT_PAGE_SIZE } from "./schemas";

function DeclarationsContent() {
	const searchParams = useSearchParams();
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const { modalRef, open: openModal, close: closeModal } = useDeleteModal();

	const input = {
		query: searchParams.get("query") ?? undefined,
		email: searchParams.get("email") ?? undefined,
		year: searchParams.get("year")
			? Number(searchParams.get("year"))
			: undefined,
		dateFrom: searchParams.get("dateFrom") ?? undefined,
		dateTo: searchParams.get("dateTo") ?? undefined,
		status: (searchParams.get("status") as "draft" | "submitted") || undefined,
		index: searchParams.get("index")
			? Number(searchParams.get("index"))
			: undefined,
		indexOperator:
			(searchParams.get("indexOperator") as "gt" | "lt" | "eq") || undefined,
		page: Number(searchParams.get("page") ?? "1"),
		pageSize: Number(searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE)),
		sortBy: (searchParams.get("sortBy") as SortColumn) ?? "createdAt",
		sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") ?? "desc",
	};

	const { data, isLoading, refetch } =
		api.adminDeclarations.search.useQuery(input);
	const deleteMutation = api.adminDeclarations.delete.useMutation({
		onSuccess: () => {
			setSelectedIds(new Set());
			refetch();
		},
	});

	const handleDelete = useCallback(() => {
		if (selectedIds.size === 0) return;
		deleteMutation.mutate({ ids: [...selectedIds] });
	}, [selectedIds, deleteMutation]);

	if (isLoading) {
		return <p>Chargement...</p>;
	}

	return (
		<>
			<SearchForm />
			{selectedIds.size > 0 && (
				<div className="fr-mb-2w">
					<button
						className="fr-btn fr-btn--secondary fr-btn--icon-left fr-icon-delete-line"
						onClick={openModal}
						type="button"
					>
						Supprimer la sélection ({selectedIds.size})
					</button>
				</div>
			)}
			{data && (
				<DeclarationTable
					onSelectionChange={setSelectedIds}
					page={data.page}
					pageSize={data.pageSize}
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
				modalRef={modalRef}
				onClose={closeModal}
				onConfirm={handleDelete}
			/>
		</>
	);
}

export function AdminDeclarationsPage() {
	return (
		<div className="fr-container fr-py-4w">
			<h1 className="fr-h3 fr-mb-4w">Déclarations</h1>
			<Suspense fallback={<p>Chargement...</p>}>
				<DeclarationsContent />
			</Suspense>
		</div>
	);
}
