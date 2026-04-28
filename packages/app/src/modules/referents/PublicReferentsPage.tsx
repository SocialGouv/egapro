"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback } from "react";

import type { CountyCode, RegionCode } from "~/modules/domain";
import { Breadcrumb } from "~/modules/layout/Breadcrumb";
import { Pagination } from "~/modules/shared/Pagination";
import { api } from "~/trpc/react";

import { PublicReferentList } from "./PublicReferentList";
import { PublicReferentsSearchForm } from "./PublicReferentsSearchForm";
import { PUBLIC_PAGE_SIZE } from "./shared/constants";

function ReferentsContent() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const input = {
		region: (searchParams.get("region") as RegionCode) || undefined,
		county: (searchParams.get("county") as CountyCode) || undefined,
		page: Number(searchParams.get("page") ?? "1"),
		pageSize: PUBLIC_PAGE_SIZE,
	};

	// Require at least one filter before hitting the search endpoint — the full
	// referent list must never be returned (anti-harvest + UX: forcing a filter
	// gives results users actually need instead of a paginated dump).
	const hasFilter = Boolean(input.region || input.county);

	const { data, isLoading, isError } = api.publicReferents.search.useQuery(
		input,
		{ enabled: hasFilter, placeholderData: (prev) => prev },
	);

	const handlePageChange = useCallback(
		(page: number) => {
			const params = new URLSearchParams(searchParams.toString());
			params.set("page", String(page));
			router.push(`/referents?${params.toString()}`);
		},
		[router, searchParams],
	);

	return (
		<>
			<PublicReferentsSearchForm />
			{!hasFilter && (
				<p className="fr-text--lg fr-text-mention--grey fr-my-4w">
					Sélectionnez au moins un filtre (région ou département) pour lancer la
					recherche.
				</p>
			)}
			{hasFilter && isLoading && !data && (
				<p aria-live="polite">Chargement des résultats…</p>
			)}
			{hasFilter && isError && (
				<div aria-live="polite" className="fr-alert fr-alert--error">
					<p>
						Une erreur est survenue lors de la recherche. Veuillez réessayer.
					</p>
				</div>
			)}
			{hasFilter && data && (
				<>
					<p
						aria-live="polite"
						className="fr-text--sm fr-text-mention--grey fr-mb-2w"
					>
						{data.total} référent{data.total > 1 ? "s" : ""} trouvé
						{data.total > 1 ? "s" : ""}
					</p>
					<PublicReferentList rows={data.rows} />
					{data.totalPages > 1 && (
						<Pagination
							currentPage={data.page}
							onPageChange={handlePageChange}
							totalPages={data.totalPages}
						/>
					)}
				</>
			)}
		</>
	);
}

export function PublicReferentsPage() {
	return (
		<main className="fr-container fr-py-6w" id="content" tabIndex={-1}>
			<Breadcrumb
				items={[
					{ label: "Accueil", href: "/" },
					{ label: "Référents Égalité Professionnelle" },
				]}
			/>
			<h1 className="fr-h1 fr-mt-4w">Référents Égalité Professionnelle</h1>
			<p className="fr-text--lead fr-mb-4w">
				Trouvez le référent Égalité Professionnelle de votre région ou de votre
				département pour vous accompagner dans vos démarches.
			</p>
			<Suspense fallback={<p>Chargement…</p>}>
				<ReferentsContent />
			</Suspense>
		</main>
	);
}
