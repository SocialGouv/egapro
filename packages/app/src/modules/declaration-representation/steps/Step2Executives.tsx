"use client";

import { useState } from "react";

import type {
	ExecutivesCount,
	RepresentationComplianceVerdict,
} from "~/modules/domain";
import {
	computeRepresentationVerdict,
	getRepresentationCampaignYear,
	getRepresentationTarget,
} from "~/modules/domain";
import { executivesSchema } from "../schemas";
import { ComplianceBadge } from "../shared/ComplianceBadge";
import { useRepresentationDraftContext } from "../shared/draft/DraftContext";
import type { PercentagePairValues } from "../shared/PercentagePairFields";
import { PercentagePairFields } from "../shared/PercentagePairFields";

const EXECUTIVES_COUNT_GROUP_NAME = "executives-count";

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
	const value = Number(raw.replace(",", "."));
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
	const { draft, setDraftValues, year, isReadOnly } =
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

	const campaignYear = getRepresentationCampaignYear(year);
	const { sumError, verdict } = evaluateExecutivesGap(
		draft.executiveWomenPercent,
		draft.executiveMenPercent,
		campaignYear,
	);
	const knownVerdict: "compliant" | "non_compliant" | null =
		verdict === "compliant" || verdict === "non_compliant" ? verdict : null;
	const target = getRepresentationTarget(campaignYear);
	const alertVariantClass =
		knownVerdict === "compliant" ? "fr-alert--info" : "fr-alert--warning";

	return (
		<div>
			<fieldset className="fr-fieldset">
				<legend className="fr-fieldset__legend--regular fr-fieldset__legend">
					Indiquez le nombre de cadres dirigeants dans votre entreprise pour
					déterminer si l'écart de représentation est calculable.
					<span className="fr-hint-text">
						Tous les champs sont obligatoires.
					</span>
				</legend>
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
						values={percentInputs}
					/>
					<div aria-atomic="true" aria-live="polite">
						{knownVerdict ? (
							<>
								<div className="fr-mt-2w">
									<ComplianceBadge verdict={knownVerdict} />
								</div>
								<div
									className={`fr-alert fr-alert--sm fr-mt-2w ${alertVariantClass}`}
								>
									<p>
										<strong>{gapReminderTitle(knownVerdict, target)}</strong>{" "}
										Depuis le 1er mars 2026, le sexe sous-représenté doit
										représenter au moins 30 % des cadres dirigeants. À partir du
										1er mars 2029, ce seuil passera à 40 %.
									</p>
								</div>
							</>
						) : null}
					</div>
				</div>
			) : null}
		</div>
	);
}
