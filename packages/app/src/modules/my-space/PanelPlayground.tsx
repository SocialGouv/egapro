"use client";

import { useEffect, useState } from "react";

import type { CampaignDeadlines, DeclarationFsmStatus } from "~/modules/domain";
import {
	getDeclarationDisplayContext,
	getDefaultCampaignDeadlines,
} from "~/modules/domain";
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

	function getDeadlineInputValue(value: Date | null): string {
		return value ? toInputDate(value) : "";
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
							{VARIANTS.map((v) => (
								<div className="fr-radio-group" key={v}>
									<input
										checked={variant === v}
										id={`variant-${v}`}
										name="variant"
										onChange={() => setVariant(v)}
										type="radio"
									/>
									<label className="fr-label" htmlFor={`variant-${v}`}>
										{v}
									</label>
								</div>
							))}
						</div>
					</fieldset>
				</div>

				<div className="fr-col-12 fr-col-md-6">
					<fieldset className="fr-fieldset">
						<legend className="fr-fieldset__legend fr-text--regular">
							Compliance path
						</legend>
						<div className="fr-fieldset__content">
							{COMPLIANCE_PATHS.map((p) => (
								<div className="fr-radio-group" key={p}>
									<input
										checked={compliancePath === p}
										id={`path-${p}`}
										name="compliancePath"
										onChange={() => setCompliancePath(p)}
										type="radio"
									/>
									<label className="fr-label" htmlFor={`path-${p}`}>
										{p}
									</label>
								</div>
							))}
						</div>
					</fieldset>

					<div className="fr-checkbox-group">
						<input
							checked={secondDeclarationSubmitted}
							id="second-decl-submitted"
							onChange={(e) =>
								setSecondDeclarationSubmitted(e.currentTarget.checked)
							}
							type="checkbox"
						/>
						<label className="fr-label" htmlFor="second-decl-submitted">
							Seconde déclaration soumise
						</label>
					</div>

					<div className="fr-checkbox-group">
						<input
							checked={compliancePathApplicable}
							id="compliance-path-applicable"
							onChange={(e) =>
								setCompliancePathApplicable(e.currentTarget.checked)
							}
							type="checkbox"
						/>
						<label className="fr-label" htmlFor="compliance-path-applicable">
							Parcours de conformité applicable (étape 2 visible)
						</label>
					</div>

					<div className="fr-checkbox-group">
						<input
							checked={hasPrefillData}
							id="has-prefill-data"
							onChange={(e) => setHasPrefillData(e.currentTarget.checked)}
							type="checkbox"
						/>
						<label className="fr-label" htmlFor="has-prefill-data">
							Données préremplies disponibles
						</label>
					</div>

					<div className="fr-checkbox-group">
						<input
							checked={cseOpinionRequired}
							id="cse-opinion-required"
							onChange={(e) => setCseOpinionRequired(e.currentTarget.checked)}
							type="checkbox"
						/>
						<label className="fr-label" htmlFor="cse-opinion-required">
							Avis CSE requis (étape 3 visible)
						</label>
					</div>
				</div>
			</div>

			<fieldset className="fr-fieldset fr-mb-4w">
				<legend className="fr-fieldset__legend fr-text--regular">
					Deadlines
				</legend>
				<div className="fr-fieldset__content">
					<div className="fr-radio-group fr-radio-group--sm">
						<input
							checked={preset === "future"}
							id="preset-future"
							name="preset"
							onChange={() => setPreset("future")}
							type="radio"
						/>
						<label className="fr-label" htmlFor="preset-future">
							Toutes futures (2099) — boutons Modifier visibles
						</label>
					</div>
					<div className="fr-radio-group fr-radio-group--sm">
						<input
							checked={preset === "past"}
							id="preset-past"
							name="preset"
							onChange={() => setPreset("past")}
							type="radio"
						/>
						<label className="fr-label" htmlFor="preset-past">
							Toutes passées (2020) — boutons Modifier cachés
						</label>
					</div>
					<div className="fr-radio-group fr-radio-group--sm">
						<input
							checked={preset === "custom"}
							id="preset-custom"
							name="preset"
							onChange={() => setPreset("custom")}
							type="radio"
						/>
						<label className="fr-label" htmlFor="preset-custom">
							Personnalisé (modifier un champ ci-dessous)
						</label>
					</div>
				</div>
			</fieldset>

			<div className="fr-grid-row fr-grid-row--gutters fr-mb-4w">
				{(Object.keys(deadlines) as (keyof CampaignDeadlines)[]).map((key) => (
					<div className="fr-col-12 fr-col-md-4" key={key}>
						<div className="fr-input-group">
							<label className="fr-label" htmlFor={`deadline-${key}`}>
								{key}
							</label>
							<input
								className="fr-input"
								id={`deadline-${key}`}
								onChange={(e) => updateDeadline(key, e.currentTarget.value)}
								type="date"
								value={getDeadlineInputValue(deadlines[key])}
							/>
						</div>
					</div>
				))}
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
				ctaHref="/declaration-remuneration?siren=000000000"
				declarationFsmStatus={VARIANT_FSM_STATUS[variant]}
				displayContext={getDeclarationDisplayContext({
					firstDeclarationPathChoice: compliancePath,
					secondDeclarationPathChoice: null,
					cseRequired: cseOpinionRequired,
				})}
				hasPrefillData={hasPrefillData}
				hasSubmittedSecondDeclaration={secondDeclarationSubmitted}
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
