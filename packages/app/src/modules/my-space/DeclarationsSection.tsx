"use client";

import { useState } from "react";

import type {
	CampaignDeadlines,
	RepresentationCampaign,
} from "~/modules/domain";
import {
	formatShortDate,
	getCurrentYear,
	getDeclarationProcessStepDeadline,
} from "~/modules/domain";

import { Pagination } from "~/modules/shared/Pagination";

import { DeclarationLink } from "./DeclarationLink";
import { getDeclarationProcessStepLabel } from "./DeclarationStepLabel";
import styles from "./DeclarationsSection.module.scss";
import {
	DocumentsPanel,
	getDocumentResourceCount,
	getDocumentsPanelId,
} from "./DocumentsPanel";
import { RepresentationProcessPanel } from "./RepresentationProcessPanel";
import { StatusBadge } from "./StatusBadge";
import type { DeclarationItem, DeclarationType } from "./types";

const TYPE_LABELS: Record<DeclarationType, string> = {
	remuneration: "Rémunération",
	representation: "Représentation",
};

type Props = {
	campaignDeadlines: CampaignDeadlines;
	declarations: DeclarationItem[];
	userPhone: string | null;
	hasCse: boolean | null;
	cseApplicable: boolean;
	representationCampaign: RepresentationCampaign;
};

function getDeadlineCell(
	declaration: DeclarationItem,
	campaignDeadlines: CampaignDeadlines,
	representationCampaign: RepresentationCampaign,
): string {
	if (declaration.type === "representation") {
		return formatShortDate(representationCampaign.declarationDeadline);
	}
	const deadline = getDeclarationProcessStepDeadline(
		declaration.fsmStatus,
		campaignDeadlines,
	);
	if (deadline === null) return "Clôturée";
	return formatShortDate(deadline);
}

const PAGE_SIZE_OPTIONS = [10, 25, 50];
const PAGE_SIZE_SELECTOR_THRESHOLD = 20;

export function DeclarationsSection({
	campaignDeadlines,
	declarations,
	userPhone,
	hasCse,
	cseApplicable,
	representationCampaign,
}: Props) {
	const currentYear = getCurrentYear();
	const currentYearDeclarations = declarations.filter(
		(d) => d.year >= currentYear,
	);
	const previousDeclarations = declarations.filter((d) => d.year < currentYear);
	const currentRepresentationDeclaration = declarations.find(
		(d) => d.type === "representation" && d.year === currentYear,
	);

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
			<h2 className="fr-h3 fr-mb-4w" id="demarches-en-cours-title">
				Démarche en cours
			</h2>
			{visibleCurrentDeclarations.length > 0 && (
				<DeclarationsTable
					campaignDeadlines={campaignDeadlines}
					cseApplicable={cseApplicable}
					declarations={visibleCurrentDeclarations}
					hasCse={hasCse}
					labelledById="demarches-en-cours-title"
					representationCampaign={representationCampaign}
					userPhone={userPhone}
				/>
			)}
			{visiblePreviousDeclarations.length > 0 && (
				<>
					<h2 className="fr-h3 fr-mt-6w fr-mb-3w" id="annees-precedentes-title">
						Années précédentes
					</h2>
					<DeclarationsTable
						campaignDeadlines={campaignDeadlines}
						cseApplicable={cseApplicable}
						declarations={visiblePreviousDeclarations}
						hasCse={hasCse}
						labelledById="annees-precedentes-title"
						representationCampaign={representationCampaign}
						userPhone={userPhone}
					/>
				</>
			)}
			{totalRows > PAGE_SIZE_SELECTOR_THRESHOLD && (
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
			)}
			{totalPages > 1 && (
				<Pagination
					currentPage={safePage}
					onPageChange={setCurrentPage}
					totalPages={totalPages}
				/>
			)}
			<RepresentationProcessPanel
				campaign={representationCampaign}
				campaignYear={currentYear}
				declaration={currentRepresentationDeclaration}
			/>
		</div>
	);
}

type DeclarationsTableProps = {
	campaignDeadlines: CampaignDeadlines;
	declarations: DeclarationItem[];
	labelledById: string;
	userPhone: string | null;
	hasCse: boolean | null;
	cseApplicable: boolean;
	representationCampaign: RepresentationCampaign;
};

function DeclarationsTable({
	campaignDeadlines,
	declarations,
	labelledById,
	userPhone,
	hasCse,
	cseApplicable,
	representationCampaign,
}: DeclarationsTableProps) {
	return (
		<div className={`fr-table ${styles.tableNoCaptionOffset}`}>
			<div className="fr-table__wrapper">
				<div className="fr-table__container">
					<div className="fr-table__content">
						<table aria-labelledby={labelledById} className={styles.tableSm}>
							<thead>
								<tr>
									<th scope="col">Déclaration</th>
									<th scope="col">Année</th>
									<th scope="col">Étape</th>
									<th scope="col">Échéance</th>
									<th scope="col">État</th>
									<th scope="col">Ressources</th>
								</tr>
							</thead>
							<tbody>
								{declarations.map((declaration) => {
									const resourceCount = getDocumentResourceCount(declaration);
									return (
										<tr key={`${declaration.type}-${declaration.year}`}>
											<td>
												<DeclarationLink
													cseApplicable={cseApplicable}
													hasCse={hasCse}
													type={declaration.type}
													userPhone={userPhone}
												>
													{TYPE_LABELS[declaration.type]}
												</DeclarationLink>
											</td>
											<td>{declaration.year}</td>
											<td>{getDeclarationProcessStepLabel(declaration)}</td>
											<td>
												{getDeadlineCell(
													declaration,
													campaignDeadlines,
													representationCampaign,
												)}
											</td>
											<td>
												<StatusBadge status={declaration.status} />
											</td>
											<td>
												{resourceCount > 0 ? (
													<>
														<button
															aria-controls={getDocumentsPanelId(declaration)}
															className={`fr-link fr-link--sm ${styles.linkUnderlined}`}
															data-fr-opened="false"
															type="button"
														>
															Documents ({resourceCount})
														</button>
														<DocumentsPanel declaration={declaration} />
													</>
												) : (
													"Aucune"
												)}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
}
