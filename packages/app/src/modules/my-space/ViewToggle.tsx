"use client";

import { useState } from "react";

import type { ViewMode } from "./types";

type Props = {
	companyCount: number;
	listView: React.ReactNode;
	tableView: React.ReactNode;
};

export function ViewToggle({ companyCount, listView, tableView }: Props) {
	const [viewMode, setViewMode] = useState<ViewMode>("list");

	return (
		<>
			<div className="fr-grid-row fr-grid-row--middle fr-grid-row--gutters fr-mb-3w">
				<div className="fr-col">
					<p className="fr-text--bold fr-mb-0">
						{companyCount} {companyCount > 1 ? "entreprises" : "entreprise"}
					</p>
				</div>
				<div className="fr-col-auto">
					<fieldset className="fr-segmented fr-segmented--no-legend">
						<legend className="fr-segmented__legend">Mode d'affichage</legend>
						<div className="fr-segmented__elements">
							<div className="fr-segmented__element">
								<input
									checked={viewMode === "list"}
									id="view-list"
									name="view-mode"
									onChange={() => setViewMode("list")}
									type="radio"
									value="list"
								/>
								<label
									className="fr-icon-list-unordered fr-label"
									htmlFor="view-list"
								>
									Liste
								</label>
							</div>
							<div className="fr-segmented__element">
								<input
									checked={viewMode === "table"}
									id="view-table"
									name="view-mode"
									onChange={() => setViewMode("table")}
									type="radio"
									value="table"
								/>
								<label
									className="fr-icon-table-2 fr-label"
									htmlFor="view-table"
								>
									Tableau
								</label>
							</div>
						</div>
					</fieldset>
				</div>
			</div>
			{viewMode === "list" ? listView : tableView}
		</>
	);
}
