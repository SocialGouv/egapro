"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { api } from "~/trpc/react";

import { DeclarationTable } from "./DeclarationTable";
import { SearchForm } from "./SearchForm";
import type { SearchDeclarationsOutput, SortColumn } from "./schemas";
import { DEFAULT_PAGE_SIZE } from "./schemas";

function DeclarationsContent() {
	const searchParams = useSearchParams();

	const input = {
		query: searchParams.get("query") ?? undefined,
		email: searchParams.get("email") ?? undefined,
		year: searchParams.get("year")
			? Number(searchParams.get("year"))
			: undefined,
		dateFrom: searchParams.get("dateFrom") ?? undefined,
		dateTo: searchParams.get("dateTo") ?? undefined,
		status: (searchParams.get("status") ||
			undefined) as SearchDeclarationsOutput["status"],
		page: Number(searchParams.get("page") ?? "1"),
		pageSize: Number(searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE)),
		sortBy: (searchParams.get("sortBy") as SortColumn) ?? "createdAt",
		sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") ?? "desc",
	};

	const { data, isLoading } = api.adminDeclarations.search.useQuery(input);

	if (isLoading) {
		return <p>Chargement...</p>;
	}

	return (
		<>
			<SearchForm />
			{data && (
				<DeclarationTable
					page={data.page}
					rows={data.rows}
					sortBy={input.sortBy}
					sortOrder={input.sortOrder}
					total={data.total}
					totalPages={data.totalPages}
				/>
			)}
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
