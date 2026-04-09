type PaginationProps = {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
};

export function Pagination({
	currentPage,
	totalPages,
	onPageChange,
}: PaginationProps) {
	const pages = buildPageNumbers(currentPage, totalPages);

	return (
		<nav aria-label="Pagination" className="fr-pagination fr-mt-2w">
			<ul className="fr-pagination__list">
				<li>
					<button
						aria-disabled={currentPage === 1}
						className="fr-pagination__link fr-pagination__link--first"
						disabled={currentPage === 1}
						onClick={() => onPageChange(1)}
						title="Première page"
						type="button"
					>
						Première page
					</button>
				</li>
				<li>
					<button
						aria-disabled={currentPage === 1}
						className="fr-pagination__link fr-pagination__link--prev fr-pagination__link--lg-label"
						disabled={currentPage === 1}
						onClick={() => onPageChange(currentPage - 1)}
						title="Page précédente"
						type="button"
					>
						Page précédente
					</button>
				</li>
				{pages.map((item) =>
					item === "ellipsis-start" || item === "ellipsis-end" ? (
						<li key={item}>
							<span className="fr-pagination__link fr-hidden fr-unhidden-lg">
								…
							</span>
						</li>
					) : (
						<li key={item}>
							<button
								aria-current={item === currentPage ? "page" : undefined}
								className="fr-pagination__link"
								onClick={() => onPageChange(item)}
								title={`Page ${item}`}
								type="button"
							>
								{item}
							</button>
						</li>
					),
				)}
				<li>
					<button
						aria-disabled={currentPage === totalPages}
						className="fr-pagination__link fr-pagination__link--next fr-pagination__link--lg-label"
						disabled={currentPage === totalPages}
						onClick={() => onPageChange(currentPage + 1)}
						title="Page suivante"
						type="button"
					>
						Page suivante
					</button>
				</li>
				<li>
					<button
						aria-disabled={currentPage === totalPages}
						className="fr-pagination__link fr-pagination__link--last"
						disabled={currentPage === totalPages}
						onClick={() => onPageChange(totalPages)}
						title="Dernière page"
						type="button"
					>
						Dernière page
					</button>
				</li>
			</ul>
		</nav>
	);
}

type PageItem = number | "ellipsis-start" | "ellipsis-end";

export function buildPageNumbers(
	currentPage: number,
	totalPages: number,
): PageItem[] {
	if (totalPages <= 7) {
		return Array.from({ length: totalPages }, (_, i) => i + 1);
	}

	const pages: PageItem[] = [1];

	if (currentPage > 3) {
		pages.push("ellipsis-start");
	}

	const start = Math.max(2, currentPage - 1);
	const end = Math.min(totalPages - 1, currentPage + 1);

	for (let i = start; i <= end; i++) {
		pages.push(i);
	}

	if (currentPage < totalPages - 2) {
		pages.push("ellipsis-end");
	}

	pages.push(totalPages);
	return pages;
}
