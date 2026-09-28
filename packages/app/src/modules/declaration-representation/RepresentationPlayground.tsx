"use client";

import { useState } from "react";

import type { RepresentationComplianceVerdict } from "~/modules/domain";
import { ComplianceBadge } from "./shared/ComplianceBadge";
import type { PercentagePairValues } from "./shared/PercentagePairFields";
import { PercentagePairFields } from "./shared/PercentagePairFields";

const VERDICTS: RepresentationComplianceVerdict[] = [
	"compliant",
	"non_compliant",
	"not_applicable",
];

export function RepresentationPlayground() {
	const [values, setValues] = useState<PercentagePairValues>({
		womenPercent: "",
		menPercent: "",
	});

	return (
		<main className="fr-container fr-py-6w" id="content" tabIndex={-1}>
			<h1 className="fr-h3">Représentation équilibrée — Playground</h1>
			<p className="fr-text--sm fr-text-mention--grey">
				Page réservée au développement : rendu isolé des composants partagés du
				funnel de représentation équilibrée.
			</p>

			<h2 className="fr-h5 fr-mt-4w">ComplianceBadge</h2>
			<ul className="fr-badges-group" id="compliance-badges">
				{VERDICTS.map((verdict) => (
					<li id={`compliance-badge-${verdict}`} key={verdict}>
						<ComplianceBadge verdict={verdict} />
					</li>
				))}
			</ul>

			<h2 className="fr-h5 fr-mt-4w">PercentagePairFields</h2>
			<div id="percentage-pair-fields">
				<PercentagePairFields
					legend="Indiquez le pourcentage de représentation des femmes et des hommes parmi les cadres dirigeants."
					onChange={setValues}
					values={values}
				/>
			</div>
			<p className="fr-text--sm" id="percentage-pair-values">
				Femmes : {values.womenPercent || "—"} · Hommes :{" "}
				{values.menPercent || "—"}
			</p>
		</main>
	);
}
