"use client";

import type { ReactNode } from "react";
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
	hasNoSanction: boolean;
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
	hasNoSanction,
}: Props) {
	const currentYear = getCurrentYear();
	const currentYearDeclarations = declarations.filter(
		(d) => d.year >= currentYear,
	);
	const previousDeclarations = declarations.filter((d) => d.year < currentYear);

	const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0] ?? 10);
	const [currentPage, setCurrentPage] = useState(1);

	const totalRows =
		currentYearDeclarations.length + previousDeclarations.length;
	const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
	const safePage = Math.min(currentPage, totalPages);
	const startIndex = (safePage - 1) * pageSize;
	const endIndex = startIndex + pageSize;

	const visibleCurrentDeclarations = currentYearDeclarations.slice(
		startIndex,
		endIndex,
	);
	const remainingSlots = endIndex - currentYearDeclarations.length;
	const visiblePreviousDeclarations =
		remainingSlots > 0
			? previousDeclarations.slice(
					Math.max(0, startIndex - currentYearDeclarations.length),
					remainingSlots,
				)
			: [];

	function handlePageSizeChange(newSize: number) {
		setPageSize(newSize);
		setCurrentPage(1);
	}

	return (
		<div className="fr-container fr-my-6w">
			<div className="fr-grid-row fr-grid-row--middle fr-grid-row--gutters fr-mb-3w">
				<div className="fr-col">
					<h2 className="fr-mb-0">En cours</h2>
				</div>
				{hasNoSanction && (
					<div className="fr-col-auto">
						<a
							className="fr-btn fr-btn--secondary fr-btn--icon-left fr-icon-download-line"
							download
							href="/api/no-sanction-pdf"
						>
							Télécharger l'attestation de non sanction (PDF)
						</a>
					</div>
				)}
			</div>
			{visibleCurrentDeclarations.length > 0 && (
				<DeclarationsTable
					caption={
						<>
							Ce tableau présente la liste des démarches en cours.
							<br />
							Chaque ligne correspond à une démarche, avec les informations
							suivantes : le type de démarche, l'année concernée, l'étape
							actuelle, la date d'échéance, l'état d'avancement et les
							ressources disponibles.
						</>
					}
					declarations={visibleCurrentDeclarations}
					hasCse={hasCse}
					siren={siren}
					userPhone={userPhone}
				/>
			)}
			{visiblePreviousDeclarations.length > 0 && (
				<>
					<h2 className="fr-mt-6w fr-mb-3w">Années précédentes</h2>
					<DeclarationsTable
						caption={
							<>
								Ce tableau présente l'historique des démarches.
								<br />
								Chaque ligne correspond à une démarche passée, avec les
								informations suivantes : le type de démarche, l'année concernée,
								les différentes étapes, les échéances, l'état final et les
								ressources associées.
							</>
						}
						declarations={visiblePreviousDeclarations}
						hasCse={hasCse}
						siren={siren}
						userPhone={userPhone}
					/>
				</>
			)}
			<div className="fr-table">
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

type DeclarationsTableProps = {
	declarations: DeclarationItem[];
	caption: ReactNode;
	siren: string;
	userPhone: string | null;
	hasCse: boolean | null;
};

function DeclarationsTable({
	declarations,
	caption,
	siren,
	userPhone,
	hasCse,
}: DeclarationsTableProps) {
	return (
		<div className="fr-table">
			<div className="fr-table__wrapper">
				<div className="fr-table__container">
					<div className="fr-table__content">
						<table>
							<caption className="fr-sr-only">{caption}</caption>
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
								{declarations.map((declaration) => (
									<tr key={`${declaration.type}-${declaration.year}`}>
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
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
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
