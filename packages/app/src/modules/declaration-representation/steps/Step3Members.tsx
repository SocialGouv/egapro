"use client";

import { useEffect, useId, useState } from "react";

import type { RepresentationComplianceVerdict } from "~/modules/domain";
import {
	computeRepresentationVerdict,
	getRepresentationCampaignYear,
	parseNumber,
	REPRESENTATION_TARGET_INITIAL,
	REPRESENTATION_TARGET_RAISED,
	REPRESENTATION_TARGET_RAISED_FROM_CAMPAIGN_YEAR,
} from "~/modules/domain";
import { membersSchema } from "../schemas";
import { ComplianceBadge } from "../shared/ComplianceBadge";
import { useRepresentationDraftContext } from "../shared/draft/DraftContext";
import type { PercentagePairValues } from "../shared/PercentagePairFields";
import { PercentagePairFields } from "../shared/PercentagePairFields";
import styles from "./Step3Members.module.scss";

const SELECTION_REQUIRED_MESSAGE =
	"Veuillez sélectionner une option pour continuer.";

function toPercentString(value: number | undefined): string {
	return value === undefined ? "" : String(value);
}

function parsePercent(raw: string): number | undefined {
	if (raw === "" || raw.endsWith(".") || raw.endsWith(",")) return undefined;
	const parsed = parseNumber(raw);
	return Number.isFinite(parsed) ? parsed : undefined;
}

function isDecidedVerdict(
	verdict: RepresentationComplianceVerdict | undefined,
): verdict is "compliant" | "non_compliant" {
	return verdict === "compliant" || verdict === "non_compliant";
}

function evaluateMembersGap(
	womenPercent: number | undefined,
	menPercent: number | undefined,
	campaignYear: number,
): { sumError: boolean; verdict: RepresentationComplianceVerdict | undefined } {
	if (womenPercent === undefined || menPercent === undefined) {
		return { sumError: false, verdict: undefined };
	}
	const result = membersSchema.safeParse({
		hasManagementBody: true,
		memberWomenPercent: womenPercent,
		memberMenPercent: menPercent,
	});
	if (!result.success) return { sumError: true, verdict: undefined };
	return {
		sumError: false,
		verdict: computeRepresentationVerdict(
			womenPercent,
			menPercent,
			campaignYear,
		),
	};
}

export function Step3Members() {
	const { draft, setDraftValues, year, isReadOnly, registerStepValidator } =
		useRepresentationDraftContext();
	const baseId = useId();

	const hasManagementBody = draft.hasManagementBody;
	const campaignYear = getRepresentationCampaignYear(year);
	const legendId = `${baseId}-legend`;
	const messagesId = `${baseId}-messages`;

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

	const { sumError, verdict } =
		hasManagementBody === true
			? evaluateMembersGap(
					draft.memberWomenPercent,
					draft.memberMenPercent,
					campaignYear,
				)
			: { sumError: false, verdict: undefined };
	const decidedVerdict = isDecidedVerdict(verdict) ? verdict : undefined;
	const isStepValid =
		hasManagementBody !== undefined &&
		(hasManagementBody === false || decidedVerdict !== undefined);
	const showSelectionError = hasManagementBody === undefined;

	useEffect(() => {
		registerStepValidator(() => isStepValid);
		return () => registerStepValidator(null);
	}, [isStepValid, registerStepValidator]);

	return (
		<div className="fr-mb-4w">
			<fieldset
				aria-labelledby={`${legendId} ${messagesId}`}
				className={`fr-fieldset ${styles.radioGroup} ${showSelectionError ? "fr-fieldset--error" : ""}`}
				role={showSelectionError ? "group" : undefined}
			>
				<legend
					className={`fr-fieldset__legend--regular fr-fieldset__legend ${styles.legend}`}
					id={legendId}
				>
					Indiquez si votre entreprise a mis en place une ou plusieurs instances
					dirigeantes pour déterminer si l'écart de représentation est
					calculable.
				</legend>
				<p className="fr-mb-2w">Tous les champs sont obligatoires.</p>
				<div
					className={`${styles.radioZone} ${showSelectionError ? styles.radioZoneError : ""}`}
				>
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
					<div
						aria-atomic="true"
						aria-live="polite"
						className="fr-messages-group"
						id={messagesId}
					>
						{showSelectionError ? (
							<p className="fr-message fr-message--error">
								{SELECTION_REQUIRED_MESSAGE}
							</p>
						) : null}
					</div>
				</div>
			</fieldset>

			{hasManagementBody === true ? (
				<div className="fr-mt-4w">
					<PercentagePairFields
						error={
							sumError
								? "La somme des pourcentages doit être égale à 100 %."
								: undefined
						}
						legend="Indiquez le pourcentage de représentation des femmes et des hommes parmi les membres des instances dirigeantes."
						onChange={handlePercentageChange}
						readOnly={isReadOnly}
						values={percentageValues}
					/>
				</div>
			) : null}
			<div aria-atomic="true" aria-live="polite" className="fr-mt-2w">
				{decidedVerdict ? <ComplianceBadge verdict={decidedVerdict} /> : null}
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
