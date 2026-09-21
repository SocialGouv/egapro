"use client";

import { useEffect, useState } from "react";

import type { CampaignDeadlines, DeclarationFsmStatus } from "~/modules/domain";
import {
	getDeclarationDisplayContext,
	getDefaultCampaignDeadlines,
} from "~/modules/domain";
import { DECLARATION_REMUNERATION } from "~/modules/routes";
import {
	DECLARATION_PROCESS_PANEL_ID,
	DeclarationProcessPanel,
	type PanelVariant,
} from "./DeclarationProcessPanel";

const VARIANTS: PanelVariant[] = [
	"start",
	"compliance_choice",
	"compliance",
	"evaluation",
	"cse",
	"closed",
];

// The playground picks a `variant` directly, so each one needs a representative FSM status to preview the "Modifier" gating.
const VARIANT_FSM_STATUS: Record<PanelVariant, DeclarationFsmStatus | null> = {
	start: "draft",
	compliance_choice: "awaiting_compliance_path_choice",
	compliance: "corrective_actions_chosen",
	evaluation: "joint_evaluation_chosen",
	cse: "awaiting_cse_opinion",
	closed: "demarche_completed",
};

const COMPLIANCE_PATHS = [
	"corrective_action",
	"joint_evaluation",
	"justify",
] as const;

type DatePreset = "future" | "past" | "custom";

function toInputDate(d: Date): string {
	const t = d.getTime();
	if (Number.isNaN(t)) return "";
	// Use UTC-shifted ISO to avoid TZ drift on toISOString.
	const tzOffset = d.getTimezoneOffset() * 60_000;
	return new Date(t - tzOffset).toISOString().slice(0, 10);
}

function buildPresetDeadlines(preset: "future" | "past"): CampaignDeadlines {
	// Reuse the domain deadline rules; the playground only picks a base year
	// far in the future or in the past to force the "open" / "closed" states.
	const base = preset === "future" ? 2099 : 2020;
	return getDefaultCampaignDeadlines(base);
}

type PlaygroundRadioProps = {
	id: string;
	name: string;
	label: string;
	checked: boolean;
	onChange: () => void;
	compact?: boolean;
};

function PlaygroundRadio({
	id,
	name,
	label,
	checked,
	onChange,
	compact = false,
}: PlaygroundRadioProps) {
	const className = compact
		? "fr-radio-group fr-radio-group--sm"
		: "fr-radio-group";
	return (
		<div className={className}>
			<input
				checked={checked}
				id={id}
				name={name}
				onChange={onChange}
				type="radio"
			/>
			<label className="fr-label" htmlFor={id}>
				{label}
			</label>
		</div>
	);
}

type PlaygroundCheckboxProps = {
	id: string;
	label: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
};

function PlaygroundCheckbox({
	id,
	label,
	checked,
	onChange,
}: PlaygroundCheckboxProps) {
	return (
		<div className="fr-checkbox-group">
			<input
				checked={checked}
				id={id}
				onChange={(event) => onChange(event.currentTarget.checked)}
				type="checkbox"
			/>
			<label className="fr-label" htmlFor={id}>
				{label}
			</label>
		</div>
	);
}

type DeadlineDateInputProps = {
	deadlineKey: keyof CampaignDeadlines;
	value: Date | null;
	onChange: (key: keyof CampaignDeadlines, value: string) => void;
};

function DeadlineDateInput({
	deadlineKey,
	value,
	onChange,
}: DeadlineDateInputProps) {
	return (
		<div className="fr-col-12 fr-col-md-4">
			<div className="fr-input-group">
				<label className="fr-label" htmlFor={`deadline-${deadlineKey}`}>
					{deadlineKey}
				</label>
				<input
					className="fr-input"
					id={`deadline-${deadlineKey}`}
					onChange={(event) => onChange(deadlineKey, event.currentTarget.value)}
					type="date"
					value={value ? toInputDate(value) : ""}
				/>
			</div>
		</div>
	);
}

/**
 * Dev playground for the DeclarationProcessPanel. Lets you pick any variant
 * and any deadline configuration (future / past / custom per-field) and opens
 * the panel inline so you can visually verify the Modifier button gating.
 */
export function PanelPlayground() {
	const [variant, setVariant] = useState<PanelVariant>("compliance");
	const [compliancePath, setCompliancePath] =
		useState<(typeof COMPLIANCE_PATHS)[number]>("corrective_action");
	const [secondDeclarationSubmitted, setSecondDeclarationSubmitted] =
		useState(true);
	const [cseOpinionRequired, setCseOpinionRequired] = useState(true);
	const [compliancePathApplicable, setCompliancePathApplicable] =
		useState(true);
	const [hasPrefillData, setHasPrefillData] = useState(true);
	const [indicatorGRequired, setIndicatorGRequired] = useState(true);
	const [preset, setPreset] = useState<DatePreset>("future");
	const [deadlines, setDeadlines] = useState<CampaignDeadlines>(
		buildPresetDeadlines("future"),
	);

	useEffect(() => {
		if (preset === "future" || preset === "past") {
			setDeadlines(buildPresetDeadlines(preset));
		}
	}, [preset]);

	function updateDeadline(key: keyof CampaignDeadlines, value: string) {
		if (!value) return;
		const parsed = new Date(`${value}T00:00:00`);
		if (Number.isNaN(parsed.getTime())) return;
		setPreset("custom");
		setDeadlines((prev) => ({ ...prev, [key]: parsed }));
	}

	function renderVariantOption(value: PanelVariant) {
		return (
			<PlaygroundRadio
				checked={variant === value}
				id={`variant-${value}`}
				key={value}
				label={value}
				name="variant"
				onChange={() => setVariant(value)}
			/>
		);
	}

	function renderCompliancePathOption(
		value: (typeof COMPLIANCE_PATHS)[number],
	) {
		return (
			<PlaygroundRadio
				checked={compliancePath === value}
				id={`path-${value}`}
				key={value}
				label={value}
				name="compliancePath"
				onChange={() => setCompliancePath(value)}
			/>
		);
	}

	function renderDeadlineInput(key: keyof CampaignDeadlines) {
		return (
			<DeadlineDateInput
				deadlineKey={key}
				key={key}
				onChange={updateDeadline}
				value={deadlines[key]}
			/>
		);
	}

	return (
		<main className="fr-container fr-py-6w" id="content" tabIndex={-1}>
			<h1 className="fr-h3">DeclarationProcessPanel — Playground</h1>
			<p className="fr-text--sm fr-text-mention--grey">
				Dev-only page to visually test the panel with arbitrary variant and
				deadline combinations.
			</p>

			<div className="fr-grid-row fr-grid-row--gutters fr-mb-4w">
				<div className="fr-col-12 fr-col-md-6">
					<fieldset className="fr-fieldset">
						<legend className="fr-fieldset__legend fr-text--regular">
							Variant
						</legend>
						<div className="fr-fieldset__content">
							{VARIANTS.map(renderVariantOption)}
						</div>
					</fieldset>
				</div>

				<div className="fr-col-12 fr-col-md-6">
					<fieldset className="fr-fieldset">
						<legend className="fr-fieldset__legend fr-text--regular">
							Compliance path
						</legend>
						<div className="fr-fieldset__content">
							{COMPLIANCE_PATHS.map(renderCompliancePathOption)}
						</div>
					</fieldset>

					<PlaygroundCheckbox
						checked={secondDeclarationSubmitted}
						id="second-decl-submitted"
						label="Seconde déclaration soumise"
						onChange={setSecondDeclarationSubmitted}
					/>

					<PlaygroundCheckbox
						checked={compliancePathApplicable}
						id="compliance-path-applicable"
						label="Parcours de conformité applicable (étape 2 visible)"
						onChange={setCompliancePathApplicable}
					/>

					<PlaygroundCheckbox
						checked={hasPrefillData}
						id="has-prefill-data"
						label="Données préremplies disponibles"
						onChange={setHasPrefillData}
					/>

					<PlaygroundCheckbox
						checked={indicatorGRequired}
						id="indicator-g-required"
						label="Indicateur G requis"
						onChange={setIndicatorGRequired}
					/>

					<PlaygroundCheckbox
						checked={cseOpinionRequired}
						id="cse-opinion-required"
						label="Avis CSE requis (étape 3 visible)"
						onChange={setCseOpinionRequired}
					/>
				</div>
			</div>

			<fieldset className="fr-fieldset fr-mb-4w">
				<legend className="fr-fieldset__legend fr-text--regular">
					Deadlines
				</legend>
				<div className="fr-fieldset__content">
					<PlaygroundRadio
						checked={preset === "future"}
						compact
						id="preset-future"
						label="Toutes futures (2099) — boutons Modifier visibles"
						name="preset"
						onChange={() => setPreset("future")}
					/>
					<PlaygroundRadio
						checked={preset === "past"}
						compact
						id="preset-past"
						label="Toutes passées (2020) — boutons Modifier cachés"
						name="preset"
						onChange={() => setPreset("past")}
					/>
					<PlaygroundRadio
						checked={preset === "custom"}
						compact
						id="preset-custom"
						label="Personnalisé (modifier un champ ci-dessous)"
						name="preset"
						onChange={() => setPreset("custom")}
					/>
				</div>
			</fieldset>

			<div className="fr-grid-row fr-grid-row--gutters fr-mb-4w">
				{(Object.keys(deadlines) as (keyof CampaignDeadlines)[]).map(
					renderDeadlineInput,
				)}
			</div>

			<div className="fr-btns-group fr-btns-group--inline fr-mb-4w">
				<button
					aria-controls={DECLARATION_PROCESS_PANEL_ID}
					className="fr-btn"
					data-fr-opened="false"
					type="button"
				>
					Ouvrir le panel
				</button>
			</div>

			<DeclarationProcessPanel
				campaignDeadlines={deadlines}
				compliancePathApplicable={compliancePathApplicable}
				cseOpinionRequired={cseOpinionRequired}
				ctaHref={DECLARATION_REMUNERATION}
				declarationFsmStatus={VARIANT_FSM_STATUS[variant]}
				displayContext={getDeclarationDisplayContext({
					firstDeclarationPathChoice: compliancePath,
					secondDeclarationPathChoice: null,
					cseRequired: cseOpinionRequired,
				})}
				hasPrefillData={hasPrefillData}
				hasSubmittedSecondDeclaration={secondDeclarationSubmitted}
				indicatorGRequired={indicatorGRequired}
				lastActionDate="12 mars 2026"
				lockedByOther={false}
				lockHolder={null}
				siren="000000000"
				variant={variant}
				year={2027}
			/>
		</main>
	);
}
