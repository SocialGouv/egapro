import Image from "next/image";
import { redirect } from "next/navigation";
import { env } from "~/env.js";
import { JsonLd } from "~/modules/shared/JsonLd";
import { searchPublicDeclarations } from "~/server/services/publicDeclarationsService";
import styles from "./ConsultationSearchPage.module.scss";
import { DownloadDataModal } from "./DownloadDataModal";
import { PageSizeSelect } from "./PageSizeSelect";
import { PublicSearchForm } from "./PublicSearchForm";
import { SearchPagination } from "./SearchPagination";
import { SearchResultItem } from "./SearchResultItem";
import {
	buildSearchQuery,
	type ConsultationSearchParams,
	exportHref,
	parseConsultationSearchParams,
	searchHref,
	toPublicSearchInput,
} from "./searchParams";
import { searchPageStructuredData } from "./structuredData";

type Props = {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function resultsLabel(count: number): string {
	const formatted = count.toLocaleString("fr-FR");
	return count > 1
		? `${formatted} entreprises déclarantes`
		: `${formatted} entreprise déclarante`;
}

function redirectToLastPage(
	params: ConsultationSearchParams,
	totalPages: number,
): never {
	redirect(searchHref(params, { page: totalPages }));
}

export async function ConsultationSearchPage({ searchParams }: Props) {
	const params = parseConsultationSearchParams(await searchParams);
	const result = await searchPublicDeclarations(toPublicSearchInput(params));
	const totalPages = Math.ceil(result.count / params.limit);
	const searchQuery = buildSearchQuery(params);
	if (totalPages > 0 && params.page > totalPages) {
		redirectToLastPage(params, totalPages);
	}

	return (
		<main className="fr-container fr-py-6w" id="content" tabIndex={-1}>
			<JsonLd
				data={searchPageStructuredData(new URL(env.NEXTAUTH_URL).origin)}
			/>
			<div className="fr-grid-row fr-grid-row--gutters">
				<div className="fr-col-12 fr-col-md-8">
					<h1 className="fr-mb-3w">
						Rechercher une entreprise et consulter ses résultats
					</h1>
					<p className="fr-mb-2w">
						Recherchez une entreprise par son nom ou son numéro SIREN (9
						chiffres).
					</p>
					<PublicSearchForm values={params} />
				</div>
				<div
					aria-hidden="true"
					className="fr-hidden fr-unhidden-md fr-col-md-4 fr-px-6w"
				>
					<Image
						alt=""
						height={228}
						src="/assets/images/home/search-illustration.svg"
						unoptimized
						width={212}
					/>
				</div>
			</div>

			<section aria-labelledby="results-heading" className="fr-mt-6w">
				<div className={styles.resultsHeader}>
					<h2 className={styles.resultsTitle} id="results-heading">
						{resultsLabel(result.count)}
					</h2>
					<DownloadDataModal
						declarationsHref={exportHref(
							"/api/public/declarations/export",
							params,
						)}
						representationsHref={exportHref(
							"/api/public/representations/export",
							params,
						)}
					/>
				</div>

				{result.count === 0 ? (
					<div className="fr-alert fr-alert--info">
						<h3 className="fr-alert__title">
							Aucune entreprise trouvée pour ces critères
						</h3>
						<p>
							Vérifiez le numéro SIREN ou élargissez votre recherche en retirant
							un filtre.
						</p>
					</div>
				) : (
					<>
						<div>
							{result.data.map((declaration) => (
								<SearchResultItem
									declaration={declaration}
									key={declaration.siren}
									searchQuery={searchQuery}
								/>
							))}
						</div>
						<div className={styles.listFooter}>
							<PageSizeSelect params={params} />
							<SearchPagination
								currentPage={params.page}
								params={params}
								totalPages={totalPages}
							/>
						</div>
					</>
				)}
			</section>

			<div className="fr-callout fr-mt-6w">
				<h2 className="fr-callout__title">
					Vous préférez une vue d’ensemble ?
				</h2>
				<p className="fr-callout__text">
					Explorez les tendances nationales par taille d’entreprise.
				</p>
				<a className="fr-btn" href="/stats">
					Statistiques générales
				</a>
			</div>
		</main>
	);
}
