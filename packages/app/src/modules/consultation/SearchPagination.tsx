import Link from "next/link";
import { buildPageNumbers } from "~/modules/shared/Pagination";
import { type ConsultationSearchParams, searchHref } from "./searchParams";

type Props = {
	currentPage: number;
	totalPages: number;
	params: ConsultationSearchParams;
};

/**
 * Link-based twin of the shared `Pagination`: the result list is server
 * rendered, so each page must be a real URL — crawlable, shareable, and working
 * without JavaScript. Only the rendering differs; the page-window arithmetic is
 * the shared `buildPageNumbers`.
 */
export function SearchPagination({ currentPage, totalPages, params }: Props) {
	if (totalPages <= 1) return null;
	const pages = buildPageNumbers(currentPage, totalPages);

	return (
		<nav aria-label="Pagination des résultats" className="fr-pagination">
			<ul className="fr-pagination__list">
				<li>
					{currentPage > 1 ? (
						<Link
							className="fr-pagination__link fr-pagination__link--prev fr-pagination__link--lg-label"
							href={searchHref(params, { page: currentPage - 1 })}
						>
							Précédent
						</Link>
					) : (
						<span
							aria-disabled="true"
							className="fr-pagination__link fr-pagination__link--prev fr-pagination__link--lg-label"
						>
							Précédent
						</span>
					)}
				</li>
				{pages.map((item) =>
					typeof item === "number" ? (
						<li key={item}>
							<Link
								aria-current={item === currentPage ? "page" : undefined}
								className="fr-pagination__link"
								href={searchHref(params, { page: item })}
								title={`Page ${item}`}
							>
								{item}
							</Link>
						</li>
					) : (
						<li key={item}>
							<span className="fr-pagination__link fr-displayed-lg">…</span>
						</li>
					),
				)}
				<li>
					{currentPage < totalPages ? (
						<Link
							className="fr-pagination__link fr-pagination__link--next fr-pagination__link--lg-label"
							href={searchHref(params, { page: currentPage + 1 })}
						>
							Suivant
						</Link>
					) : (
						<span
							aria-disabled="true"
							className="fr-pagination__link fr-pagination__link--next fr-pagination__link--lg-label"
						>
							Suivant
						</span>
					)}
				</li>
			</ul>
		</nav>
	);
}
