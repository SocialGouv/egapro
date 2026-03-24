"use client";

import { useState } from "react";

import { getCurrentYear } from "~/modules/domain";

import { DeclarationLink } from "./DeclarationLink";
import { getDeclarationStepLabel } from "./DeclarationStepLabel";
import { StatusBadge } from "./StatusBadge";
import type { DeclarationItem, DeclarationType } from "./types";

const TYPE_LABELS: Record<DeclarationType, string> = {
	remuneration: "Rémunération",
	representation: "Représentation",
};

type Props = {
	siren: string;
	declarations: DeclarationItem[];
	userPhone: string | null;
	hasCse: boolean | null;
};

function formatDate(date: Date | null): string {
	if (!date) return "Aucune";
	return new Intl.DateTimeFormat("fr-FR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	}).format(date);
}

const TYPE_DEADLINES: Record<DeclarationType, string> = {
	remuneration: "01/06",
	representation: "01/03",
};

function getDeadline(declaration: DeclarationItem): string {
	if (declaration.status === "done") return "Clôturée";
	return `${TYPE_DEADLINES[declaration.type]}/${declaration.year}`;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export function DeclarationsSection({
	siren,
	declarations,
	userPhone,
	hasCse,
}: Props) {
	const currentYear = getCurrentYear();
	const currentYearDeclarations = declarations.filter(
		(d) => d.year >= currentYear,
	);
	const previousDeclarations = declarations.filter((d) => d.year < currentYear);

	const allRows = [
		...currentYearDeclarations.map((d) => ({
			kind: "row" as const,
			declaration: d,
		})),
		...(previousDeclarations.length > 0
			? [{ kind: "separator" as const, declaration: null }]
			: []),
		...previousDeclarations.map((d) => ({
			kind: "row" as const,
			declaration: d,
		})),
	];

	const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0] ?? 10);
	const [currentPage, setCurrentPage] = useState(1);

	const totalPages = Math.max(1, Math.ceil(allRows.length / pageSize));
	const safePage = Math.min(currentPage, totalPages);
	const startIndex = (safePage - 1) * pageSize;
	const visibleRows = allRows.slice(startIndex, startIndex + pageSize);

	function handlePageSizeChange(newSize: number) {
		setPageSize(newSize);
		setCurrentPage(1);
	}

	return (
		<div className="fr-container fr-my-6w">
			<h2>Déclarations</h2>
			<div className="fr-table">
				<div className="fr-table__wrapper">
					<div className="fr-table__container">
						<div className="fr-table__content">
							<table>
								<caption className="fr-sr-only">
									Liste des déclarations de l'entreprise
								</caption>
								<thead>
									<tr>
										<th scope="col">Déclaration</th>
										<th scope="col">Année</th>
										<th scope="col">Étape</th>
										<th scope="col">Statut</th>
										<th scope="col">Échéance</th>
										<th scope="col">Mise à jour</th>
									</tr>
								</thead>
								<tbody>
									{visibleRows.map((row, i) =>
										row.kind === "separator" ? (
											<tr key="separator">
												<td className="fr-text--bold" colSpan={6}>
													Années précédentes
												</td>
											</tr>
										) : row.declaration ? (
											<DeclarationRow
												declaration={row.declaration}
												hasCse={hasCse}
												key={`${row.declaration.type}-${row.declaration.year}-${i}`}
												siren={siren}
												userPhone={userPhone}
											/>
										) : null,
									)}
								</tbody>
							</table>
						</div>
					</div>
				</div>
				<div className="fr-table__footer--start">
					<div className="fr-select-group">
						<label className="fr-sr-only fr-label" htmlFor="table-page-size">
							Nombre de lignes par page
						</label>
						<select
							className="fr-select"
							id="table-page-size"
							onChange={(e) => handlePageSizeChange(Number(e.target.value))}
							value={pageSize}
						>
							{PAGE_SIZE_OPTIONS.map((size) => (
								<option key={size} value={size}>
									{size} lignes par page
								</option>
							))}
						</select>
					</div>
				</div>
			</div>
			{totalPages > 1 && (
				<Pagination
					currentPage={safePage}
					onPageChange={setCurrentPage}
					totalPages={totalPages}
				/>
			)}
		</div>
	);
}

type DeclarationRowProps = {
	declaration: DeclarationItem;
	siren: string;
	userPhone: string | null;
	hasCse: boolean | null;
};

function DeclarationRow({
	declaration,
	siren,
	userPhone,
	hasCse,
}: DeclarationRowProps) {
	return (
		<tr>
			<td>
				<DeclarationLink
					hasCse={hasCse}
					siren={siren}
					type={declaration.type}
					userPhone={userPhone}
				>
					{TYPE_LABELS[declaration.type]}
				</DeclarationLink>
			</td>
			<td>{declaration.year}</td>
			<td>{getDeclarationStepLabel(declaration.currentStep)}</td>
			<td>
				<StatusBadge status={declaration.status} />
			</td>
			<td>{getDeadline(declaration)}</td>
			<td>{formatDate(declaration.updatedAt)}</td>
		</tr>
	);
}

type PaginationProps = {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
};

function Pagination({
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
				{pages.map((page) =>
					page === "ellipsis-start" || page === "ellipsis-end" ? (
						<li key={page}>
							<span className="fr-pagination__link fr-hidden fr-unhidden-lg">
								…
							</span>
						</li>
					) : (
						<li key={page}>
							<button
								aria-current={page === currentPage ? "page" : undefined}
								className="fr-pagination__link"
								onClick={() => onPageChange(page)}
								title={`Page ${page}`}
								type="button"
							>
								{page}
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

function buildPageNumbers(currentPage: number, totalPages: number): PageItem[] {
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
