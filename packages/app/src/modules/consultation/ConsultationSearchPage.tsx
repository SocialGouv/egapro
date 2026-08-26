import { redirect } from "next/navigation";
import { Breadcrumb } from "~/modules/layout/Breadcrumb";
import { searchPublicDeclarations } from "~/server/services/publicDeclarationsService";
import { PUBLIC_PAGE_SIZE } from "./constants";
import { PublicSearchForm } from "./PublicSearchForm";
import { SearchPagination } from "./SearchPagination";
import { SearchResultItem } from "./SearchResultItem";
import {
	hasSearchCriteria,
	parseConsultationSearchParams,
	toPublicSearchInput,
} from "./searchParams";

type Props = {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function exportHref(
	params: ReturnType<typeof parseConsultationSearchParams>,
	format: "csv" | "json" | "xlsx",
) {
	const input = toPublicSearchInput(params);
	const query = new URLSearchParams({ format });
	for (const [key, value] of Object.entries(input)) {
		if (key !== "limit" && key !== "offset" && value !== undefined) {
			query.set(key, String(value));
		}
	}
	return `/api/public/declarations/export?${query.toString()}`;
}

export async function ConsultationSearchPage({ searchParams }: Props) {
	const params = parseConsultationSearchParams(await searchParams);
	const hasCriteria = hasSearchCriteria(params);
	const result = hasCriteria
		? await searchPublicDeclarations(toPublicSearchInput(params))
		: null;
	const totalPages = result ? Math.ceil(result.count / PUBLIC_PAGE_SIZE) : 0;
	if (result && totalPages > 0 && params.page > totalPages) {
		const query = new URLSearchParams();
		for (const [key, value] of Object.entries(params)) {
			if (key !== "page" && value !== "" && value !== undefined) {
				query.set(key, String(value));
			}
		}
		query.set("page", String(totalPages));
		redirect(`/index-egapro/recherche?${query.toString()}`);
	}
	return (
		<main className="fr-container fr-py-6w" id="content" tabIndex={-1}>
			<Breadcrumb
				items={[
					{ label: "Accueil", href: "/" },
					{ label: "Consulter les résultats" },
				]}
			/>
			<h1 className="fr-h1 fr-mt-4w">
				Consulter les résultats d’égalité professionnelle
			</h1>
			<p className="fr-text--lead fr-mb-5w">
				Recherchez une entreprise par son SIREN, sa raison sociale ou sa
				localisation et consultez ses indicateurs de rémunération publiés.
			</p>
			<PublicSearchForm values={params} />

			{!hasCriteria && (
				<div className="fr-callout fr-icon-information-line fr-mt-5w">
					<h2 className="fr-callout__title">Commencez votre recherche</h2>
					<p className="fr-callout__text">
						Saisissez un SIREN ou un nom, ou utilisez un des filtres proposés.
					</p>
				</div>
			)}
			{result && result.count === 0 && (
				<div className="fr-alert fr-alert--info fr-mt-5w">
					<h2 className="fr-alert__title">
						Aucune entreprise trouvée pour ces critères
					</h2>
					<p>
						Vérifiez le SIREN ou élargissez votre recherche en retirant un
						filtre.
					</p>
				</div>
			)}
			{result && result.count > 0 && (
				<section aria-labelledby="results-heading" className="fr-mt-6w">
					<div className="fr-grid-row fr-grid-row--middle fr-mb-2w">
						<h2 className="fr-h3 fr-col" id="results-heading">
							{result.count.toLocaleString("fr-FR")} entreprise
							{result.count > 1 ? "s" : ""} trouvée{result.count > 1 ? "s" : ""}
						</h2>
						<div className="fr-col-auto">
							<a
								className="fr-link fr-icon-download-line fr-link--icon-left"
								href={exportHref(params, "xlsx")}
							>
								Télécharger les résultats (.xlsx)
							</a>
						</div>
					</div>
					<div>
						{result.data.map((declaration) => (
							<SearchResultItem
								declaration={declaration}
								key={declaration.siren}
							/>
						))}
					</div>
					<SearchPagination
						currentPage={params.page}
						params={params}
						totalPages={totalPages}
					/>
				</section>
			)}
			<p className="fr-text--sm fr-text-mention--grey fr-mt-6w">
				Source : données issues des déclarations EgaPro et des calculs GIP-MDS.
				L’indicateur G et les avis CSE ne sont jamais publiés.
			</p>
			<p className="fr-text--sm">
				<a className="fr-link" href="/api/public/docs">
					Documentation de l’API publique
				</a>
				{" · "}
				<a
					className="fr-link fr-icon-rss-line fr-link--icon-left"
					href="/index-egapro/actualites.xml"
				>
					Flux RSS
				</a>
			</p>
		</main>
	);
}
