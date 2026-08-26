import Link from "next/link";
import type { ConsultationSearchParams } from "./searchParams";

type Props = {
	currentPage: number;
	totalPages: number;
	params: ConsultationSearchParams;
};

function pageHref(params: ConsultationSearchParams, page: number): string {
	const query = new URLSearchParams();
	for (const [key, value] of Object.entries(params)) {
		if (key !== "page" && value !== "" && value !== undefined) {
			query.set(key, String(value));
		}
	}
	query.set("page", String(page));
	return `/index-egapro/recherche?${query.toString()}`;
}

export function SearchPagination({ currentPage, totalPages, params }: Props) {
	if (totalPages <= 1) return null;
	const pages = Array.from(
		{ length: totalPages },
		(_, index) => index + 1,
	).filter(
		(page) =>
			page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1,
	);
	return (
		<nav
			aria-label="Pagination des résultats"
			className="fr-pagination fr-mt-4w"
		>
			<ul className="fr-pagination__list">
				{currentPage > 1 && (
					<li>
						<Link
							className="fr-pagination__link fr-pagination__link--prev fr-pagination__link--lg-label"
							href={pageHref(params, currentPage - 1)}
							title="Page précédente"
						>
							Page précédente
						</Link>
					</li>
				)}
				{pages.map((page, index) => (
					<li key={page}>
						{index > 0 && pages[index - 1] !== page - 1 && (
							<span className="fr-pagination__link">…</span>
						)}
						<Link
							aria-current={page === currentPage ? "page" : undefined}
							className="fr-pagination__link"
							href={pageHref(params, page)}
							title={`Page ${page}`}
						>
							{page}
						</Link>
					</li>
				))}
				{currentPage < totalPages && (
					<li>
						<Link
							className="fr-pagination__link fr-pagination__link--next fr-pagination__link--lg-label"
							href={pageHref(params, currentPage + 1)}
							title="Page suivante"
						>
							Page suivante
						</Link>
					</li>
				)}
			</ul>
		</nav>
	);
}
