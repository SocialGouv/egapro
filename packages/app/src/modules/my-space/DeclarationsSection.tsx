"use client";

import { useState } from "react";

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
};

function formatDate(date: Date | null): string {
	if (!date) return "-";
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

export function DeclarationsSection({ siren, declarations, userPhone }: Props) {
	const currentYear = new Date().getFullYear();
	const currentYearDeclarations = declarations.filter(
		(d) => d.year >= currentYear,
	);
	const previousDeclarations = declarations.filter((d) => d.year < currentYear);

	const allRows = [
		...currentYearDeclarations.map((d) => ({ kind: "row" as const, declaration: d })),
		...(previousDeclarations.length > 0
			? [{ kind: "separator" as const, declaration: null }]
			: []),
		...previousDeclarations.map((d) => ({ kind: "row" as const, declaration: d })),
	];

	const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]!);
	const visibleRows = allRows.slice(0, pageSize);

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
										<th scope="col">Date limite de la déclaration</th>
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
										) : (
											<DeclarationRow
												declaration={row.declaration!}
												key={`${row.declaration!.type}-${row.declaration!.year}-${i}`}
												siren={siren}
												userPhone={userPhone}
											/>
										),
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
							onChange={(e) => setPageSize(Number(e.target.value))}
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
		</div>
	);
}

type DeclarationRowProps = {
	declaration: DeclarationItem;
	siren: string;
	userPhone: string | null;
};

function DeclarationRow({
	declaration,
	siren,
	userPhone,
}: DeclarationRowProps) {
	return (
		<tr>
			<td>
				<DeclarationLink
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
