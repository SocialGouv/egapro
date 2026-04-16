"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type SortOrder = "asc" | "desc";

type Params = {
	basePath: string;
	sortBy: string;
	sortOrder: string;
};

/**
 * Shared sort + pagination URL-state helpers for admin tables. Both
 * DeclarationTable and ReferentTable used to duplicate this block; extracting
 * it keeps the route-specific pieces minimal and removes the SonarCloud
 * "duplicated lines" signal on new admin tables.
 */
export function useSortableTable({ basePath, sortBy, sortOrder }: Params) {
	const router = useRouter();
	const searchParams = useSearchParams();

	const handleSort = useCallback(
		(column: string) => {
			const params = new URLSearchParams(searchParams.toString());
			if (sortBy === column) {
				params.set("sortOrder", sortOrder === "asc" ? "desc" : "asc");
			} else {
				params.set("sortBy", column);
				params.set("sortOrder", "asc");
			}
			params.set("page", "1");
			router.push(`${basePath}?${params.toString()}`);
		},
		[basePath, router, searchParams, sortBy, sortOrder],
	);

	const handlePageChange = useCallback(
		(newPage: number) => {
			const params = new URLSearchParams(searchParams.toString());
			params.set("page", String(newPage));
			router.push(`${basePath}?${params.toString()}`);
		},
		[basePath, router, searchParams],
	);

	const ariaSort = useCallback(
		(column: string): "ascending" | "descending" | undefined => {
			if (sortBy !== column) return undefined;
			return sortOrder === "asc" ? "ascending" : "descending";
		},
		[sortBy, sortOrder],
	);

	const sortIcon = useCallback(
		(column: string): string | null => {
			if (sortBy !== column) return null;
			return (sortOrder as SortOrder) === "asc" ? " ▲" : " ▼";
		},
		[sortBy, sortOrder],
	);

	return { handleSort, handlePageChange, ariaSort, sortIcon };
}
