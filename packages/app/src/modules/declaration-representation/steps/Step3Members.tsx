"use client";

import { useId, useState } from "react";

import type { RepresentationComplianceVerdict } from "~/modules/domain";
import {
	computeRepresentationVerdict,
	getRepresentationCampaignYear,
	parseNumber,
	REPRESENTATION_TARGET_INITIAL,
	REPRESENTATION_TARGET_RAISED,
	REPRESENTATION_TARGET_RAISED_FROM_CAMPAIGN_YEAR,
} from "~/modules/domain";
import { ComplianceBadge } from "../shared/ComplianceBadge";
import { useRepresentationDraftContext } from "../shared/draft/DraftContext";
import type { PercentagePairValues } from "../shared/PercentagePairFields";
import { PercentagePairFields } from "../shared/PercentagePairFields";

function toPercentString(value: number | undefined): string {
	return value === undefined ? "" : String(value);
}

function parsePercent(raw: string): number | undefined {
	if (raw === "") return undefined;
	const parsed = parseNumber(raw);
	return Number.isFinite(parsed) ? parsed : undefined;
}

function isDecidedVerdict(
	verdict: RepresentationComplianceVerdict | undefined,
): verdict is "compliant" | "non_compliant" {
	return verdict === "compliant" || verdict === "non_compliant";
}

export function Step3Members() {
	const { draft, setDraftValues, year, isReadOnly } =
		useRepresentationDraftContext();
	const baseId = useId();

	const hasManagementBody = draft.hasManagementBody;
	const campaignYear = getRepresentationCampaignYear(year);

	// Raw strings, not re-derived from the draft on render (would drop an in-progress decimal separator).
	const [percentageValues, setPercentageValues] =
		useState<PercentagePairValues>(() => ({
			womenPercent: toPercentString(draft.memberWomenPercent),
			menPercent: toPercentString(draft.memberMenPercent),
		}));

	function handleSelect(next: boolean) {
		if (next) {
			setDraftValues({ hasManagementBody: true });
			return;
		}
		setDraftValues({
			hasManagementBody: false,
			memberWomenPercent: undefined,
			memberMenPercent: undefined,
		});
		setPercentageValues({ womenPercent: "", menPercent: "" });
	}

	function handlePercentageChange(values: PercentagePairValues) {
		setPercentageValues(values);
		setDraftValues({
			memberWomenPercent: parsePercent(values.womenPercent),
			memberMenPercent: parsePercent(values.menPercent),
		});
	}

	const verdict =
		hasManagementBody === true &&
		draft.memberWomenPercent !== undefined &&
		draft.memberMenPercent !== undefined
			? computeRepresentationVerdict(
					draft.memberWomenPercent,
					draft.memberMenPercent,
					campaignYear,
				)
			: undefined;

	return (
		<div className="fr-mb-4w">
			<fieldset className="fr-fieldset">
				<legend className="fr-fieldset__legend--regular fr-fieldset__legend">
					Indiquez si votre entreprise a mis en place une ou plusieurs instances
					dirigeantes pour déterminer si l'écart de représentation est
					calculable.
				</legend>
				<p className="fr-mb-2w">Tous les champs sont obligatoires.</p>
				<div className="fr-fieldset__element">
					<div className="fr-radio-group fr-radio-rich">
						<input
							checked={hasManagementBody === false}
							disabled={isReadOnly}
							id={`${baseId}-none`}
							name={`${baseId}-has-management-body`}
							onChange={() => handleSelect(false)}
							type="radio"
						/>
						<label className="fr-label" htmlFor={`${baseId}-none`}>
							Aucune instance dirigeante
							<span className="fr-hint-text">
								L'écart ne peut pas être calculé.
							</span>
						</label>
					</div>
				</div>
				<div className="fr-fieldset__element">
					<div className="fr-radio-group fr-radio-rich">
						<input
							checked={hasManagementBody === true}
							disabled={isReadOnly}
							id={`${baseId}-some`}
							name={`${baseId}-has-management-body`}
							onChange={() => handleSelect(true)}
							type="radio"
						/>
						<label className="fr-label" htmlFor={`${baseId}-some`}>
							Au moins une instance dirigeante
							<span className="fr-hint-text">L'écart doit être calculé.</span>
						</label>
					</div>
				</div>
			</fieldset>

			{hasManagementBody === true ? (
				<div className="fr-mt-4w">
					<PercentagePairFields
						legend="Indiquez le pourcentage de représentation des femmes et des hommes parmi les membres des instances dirigeantes."
						onChange={handlePercentageChange}
						readOnly={isReadOnly}
						values={percentageValues}
					/>
				</div>
			) : null}
			<div aria-atomic="true" aria-live="polite" className="fr-mt-2w">
				{isDecidedVerdict(verdict) ? (
					<ComplianceBadge verdict={verdict} />
				) : null}
			</div>

			<section className="fr-accordion fr-mt-4w">
				<h3 className="fr-accordion__title">
					<button
						aria-controls={`${baseId}-definitions`}
						aria-expanded="false"
						className="fr-accordion__btn"
						type="button"
					>
						Définitions membres des instances dirigeantes et seuils
						réglementaires
					</button>
				</h3>
				<div className="fr-collapse" id={`${baseId}-definitions`}>
					<p>
						Sont concernés les membres des instances dirigeantes telles que
						définies à l'article L.23-12-1 du Code de commerce.
					</p>
					<p>
						La loi impose un quota minimum de {REPRESENTATION_TARGET_INITIAL} %
						de chaque sexe parmi les membres des instances dirigeantes, porté à{" "}
						{REPRESENTATION_TARGET_RAISED} % à compter de la campagne{" "}
						{REPRESENTATION_TARGET_RAISED_FROM_CAMPAIGN_YEAR}.
					</p>
				</div>
			</section>
		</div>
	);
}
