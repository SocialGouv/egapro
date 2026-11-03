import styles from "./Pagination.module.scss";

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
	const isFirstPage = currentPage === 1;
	const isLastPage = currentPage === totalPages;

	return (
		<nav aria-label="Pagination" className="fr-pagination fr-mt-2w">
			<ul className="fr-pagination__list">
				<li>
					<StepButton
						className="fr-pagination__link--first"
						inactive={isFirstPage}
						label="Première page"
						onActivate={() => onPageChange(1)}
					/>
				</li>
				<li>
					<StepButton
						className="fr-pagination__link--prev fr-pagination__link--lg-label"
						inactive={isFirstPage}
						label="Page précédente"
						onActivate={() => onPageChange(currentPage - 1)}
					/>
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
					<StepButton
						className="fr-pagination__link--next fr-pagination__link--lg-label"
						inactive={isLastPage}
						label="Page suivante"
						onActivate={() => onPageChange(currentPage + 1)}
					/>
				</li>
				<li>
					<StepButton
						className="fr-pagination__link--last"
						inactive={isLastPage}
						label="Dernière page"
						onActivate={() => onPageChange(totalPages)}
					/>
				</li>
			</ul>
		</nav>
	);
}

type StepButtonProps = {
	className: string;
	inactive: boolean;
	label: string;
	onActivate: () => void;
};

/**
 * First / previous / next / last button. When it cannot act it is marked
 * `aria-disabled` and ignores activation, but is never `disabled`: a button
 * that turns `disabled` while focused — « Première page » once page 1 is
 * reached — drops keyboard focus to `<body>` (RGAA 7.3).
 */
function StepButton({
	className,
	inactive,
	label,
	onActivate,
}: StepButtonProps) {
	const inactiveClassName = inactive ? styles.inactive : "";
	return (
		<button
			aria-disabled={inactive || undefined}
			className={`fr-pagination__link ${className} ${inactiveClassName}`}
			onClick={inactive ? undefined : onActivate}
			title={label}
			type="button"
		>
			{label}
		</button>
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
