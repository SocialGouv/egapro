"use client";

import { useEffect, useState } from "react";

import type {
	ExecutivesCount,
	RepresentationComplianceVerdict,
} from "~/modules/domain";
import {
	computeRepresentationVerdict,
	getRepresentationCampaignYear,
	getRepresentationTarget,
	parseNumber,
	REPRESENTATION_TARGET_INITIAL,
	REPRESENTATION_TARGET_RAISED,
	REPRESENTATION_TARGET_RAISED_FROM_CAMPAIGN_YEAR,
} from "~/modules/domain";
import { executivesSchema } from "../schemas";
import { ComplianceBadge } from "../shared/ComplianceBadge";
import { useRepresentationDraftContext } from "../shared/draft/DraftContext";
import type { PercentagePairValues } from "../shared/PercentagePairFields";
import { PercentagePairFields } from "../shared/PercentagePairFields";
import styles from "./Step2Executives.module.scss";

const EXECUTIVES_COUNT_GROUP_NAME = "executives-count";
const LEGEND_ID = `${EXECUTIVES_COUNT_GROUP_NAME}-legend`;
const MESSAGES_ID = `${EXECUTIVES_COUNT_GROUP_NAME}-messages`;
const ACCORDION_ID = `${EXECUTIVES_COUNT_GROUP_NAME}-definitions`;
const SELECTION_REQUIRED_MESSAGE =
	"Veuillez sélectionner une option pour continuer.";

const EXECUTIVES_COUNT_OPTIONS: {
	value: ExecutivesCount;
	label: string;
	hint: string;
}[] = [
	{
		value: "none",
		label: "Aucun cadre dirigeant",
		hint: "L'écart ne peut pas être calculé.",
	},
	{
		value: "one",
		label: "Un cadre dirigeant",
		hint: "L'écart ne peut pas être calculé.",
	},
	{
		value: "two_or_more",
		label: "Deux cadres dirigeants ou plus",
		hint: "L'écart doit être calculé.",
	},
];

function parsePercent(raw: string): number | undefined {
	if (raw === "" || raw.endsWith(".") || raw.endsWith(",")) return undefined;
	const value = parseNumber(raw);
	return Number.isFinite(value) ? value : undefined;
}

function formatPercent(value: number | undefined): string {
	return value === undefined ? "" : String(value);
}

function evaluateExecutivesGap(
	womenPercent: number | undefined,
	menPercent: number | undefined,
	campaignYear: number,
): { sumError: boolean; verdict: RepresentationComplianceVerdict | null } {
	if (womenPercent === undefined || menPercent === undefined) {
		return { sumError: false, verdict: null };
	}
	const result = executivesSchema.safeParse({
		executivesCount: "two_or_more",
		executiveWomenPercent: womenPercent,
		executiveMenPercent: menPercent,
	});
	if (!result.success) return { sumError: true, verdict: null };
	return {
		sumError: false,
		verdict: computeRepresentationVerdict(
			womenPercent,
			menPercent,
			campaignYear,
		),
	};
}

function gapReminderTitle(
	verdict: "compliant" | "non_compliant",
	target: number,
): string {
	return verdict === "compliant"
		? `Objectif de ${target} % atteint`
		: `Objectif de ${target} % non atteint`;
}

type ExecutiveCountOptionProps = {
	checked: boolean;
	disabled: boolean;
	hint: string;
	id: string;
	label: string;
	onSelect: () => void;
	value: ExecutivesCount;
};

function ExecutiveCountOption({
	checked,
	disabled,
	hint,
	id,
	label,
	onSelect,
	value,
}: ExecutiveCountOptionProps) {
	return (
		<div className="fr-fieldset__element">
			<div className="fr-radio-group fr-radio-rich">
				<input
					checked={checked}
					disabled={disabled}
					id={id}
					name={EXECUTIVES_COUNT_GROUP_NAME}
					onChange={onSelect}
					type="radio"
					value={value}
				/>
				<label className="fr-label" htmlFor={id}>
					{label}
					<span className="fr-hint-text">{hint}</span>
				</label>
			</div>
		</div>
	);
}

export function Step2Executives() {
	const { draft, setDraftValues, year, isReadOnly, setStepValid } =
		useRepresentationDraftContext();
	const [percentInputs, setPercentInputs] = useState<PercentagePairValues>({
		womenPercent: formatPercent(draft.executiveWomenPercent),
		menPercent: formatPercent(draft.executiveMenPercent),
	});

	function handleCountChange(next: ExecutivesCount) {
		if (next === draft.executivesCount) return;
		setPercentInputs({ womenPercent: "", menPercent: "" });
		setDraftValues({
			executivesCount: next,
			executiveWomenPercent: undefined,
			executiveMenPercent: undefined,
		});
	}

	function handlePercentChange(values: PercentagePairValues) {
		setPercentInputs(values);
		setDraftValues({
			executiveWomenPercent: parsePercent(values.womenPercent),
			executiveMenPercent: parsePercent(values.menPercent),
		});
	}

	const hasSelection = draft.executivesCount !== undefined;
	const campaignYear = getRepresentationCampaignYear(year);
	const { sumError, verdict } = evaluateExecutivesGap(
		draft.executiveWomenPercent,
		draft.executiveMenPercent,
		campaignYear,
	);
	const knownVerdict: "compliant" | "non_compliant" | null =
		verdict === "compliant" || verdict === "non_compliant" ? verdict : null;
	const target = getRepresentationTarget(campaignYear);
	const reminderClassName =
		knownVerdict === "compliant"
			? styles.reminderCompliant
			: styles.reminderNonCompliant;
	const isStepValid =
		hasSelection &&
		(draft.executivesCount !== "two_or_more" || knownVerdict !== null);
	const showSelectionError = !hasSelection;

	useEffect(() => {
		setStepValid(isStepValid);
	}, [isStepValid, setStepValid]);

	return (
		<div>
			<fieldset
				aria-labelledby={`${LEGEND_ID} ${MESSAGES_ID}`}
				className={`fr-fieldset ${styles.radioGroup} ${showSelectionError ? "fr-fieldset--error" : ""}`}
				role={showSelectionError ? "group" : undefined}
			>
				<legend
					className={`fr-fieldset__legend--regular fr-fieldset__legend ${styles.legend}`}
					id={LEGEND_ID}
				>
					Indiquez le nombre de cadres dirigeants dans votre entreprise pour
					déterminer si l'écart de représentation est calculable.
				</legend>
				<p className="fr-mb-2w">Tous les champs sont obligatoires.</p>
				{EXECUTIVES_COUNT_OPTIONS.map((option) => (
					<ExecutiveCountOption
						checked={draft.executivesCount === option.value}
						disabled={isReadOnly}
						hint={option.hint}
						id={`${EXECUTIVES_COUNT_GROUP_NAME}-${option.value}`}
						key={option.value}
						label={option.label}
						onSelect={() => handleCountChange(option.value)}
						value={option.value}
					/>
				))}
				<div aria-live="polite" className="fr-messages-group" id={MESSAGES_ID}>
					{showSelectionError ? (
						<p className="fr-message fr-message--error">
							{SELECTION_REQUIRED_MESSAGE}
						</p>
					) : null}
				</div>
			</fieldset>

			{draft.executivesCount === "two_or_more" ? (
				<div className="fr-mt-4w">
					<PercentagePairFields
						error={
							sumError
								? "La somme des pourcentages doit être égale à 100 %."
								: undefined
						}
						legend="Indiquez le pourcentage de représentation des femmes et des hommes parmi les cadres dirigeants."
						onChange={handlePercentChange}
						readOnly={isReadOnly}
						trailingContent={
							knownVerdict ? (
								<ComplianceBadge verdict={knownVerdict} />
							) : undefined
						}
						values={percentInputs}
					/>
					{knownVerdict ? (
						<div aria-atomic="true" aria-live="polite" className="fr-mt-2w">
							<div className={`fr-callout ${reminderClassName}`}>
								<p className="fr-callout__text">
									<strong>{gapReminderTitle(knownVerdict, target)}</strong>{" "}
									Depuis le 1er mars 2026, le sexe sous-représenté doit
									représenter au moins {REPRESENTATION_TARGET_INITIAL} % des
									cadres dirigeants. À partir du 1er mars{" "}
									{REPRESENTATION_TARGET_RAISED_FROM_CAMPAIGN_YEAR}, ce seuil
									passera à {REPRESENTATION_TARGET_RAISED} %.
								</p>
							</div>
						</div>
					) : null}
				</div>
			) : null}

			<section className="fr-accordion fr-mt-4w">
				<h3 className="fr-accordion__title">
					<button
						aria-controls={ACCORDION_ID}
						aria-expanded="false"
						className="fr-accordion__btn"
						type="button"
					>
						Définition cadre dirigeant et seuil réglementaire
					</button>
				</h3>
				<div className="fr-collapse" id={ACCORDION_ID}>
					<p>
						Sont concernés les cadres dirigeants tels que définis à l'article
						L.3111-2 du Code du travail.
					</p>
					<p>
						La loi impose un quota minimum de {REPRESENTATION_TARGET_INITIAL} %
						de chaque sexe parmi les cadres dirigeants, porté à{" "}
						{REPRESENTATION_TARGET_RAISED} % à compter de la campagne{" "}
						{REPRESENTATION_TARGET_RAISED_FROM_CAMPAIGN_YEAR}.
					</p>
				</div>
			</section>
		</div>
	);
}
