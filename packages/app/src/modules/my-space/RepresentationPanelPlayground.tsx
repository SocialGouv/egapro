"use client";

import { useState } from "react";

import type { RepresentationCampaign } from "~/modules/domain";
import {
	civilDate,
	getRepresentationCampaignEndDate,
	getRepresentationCampaignStartDate,
} from "~/modules/domain";
import { LAST_REPRESENTATION_STEP } from "~/modules/routes";
import {
	REPRESENTATION_PROCESS_PANEL_ID,
	RepresentationProcessPanel,
} from "./RepresentationProcessPanel";
import type { DeclarationItem, LockHolderDisplay } from "./types";

// Mirrors the panel variants; the closed one needs a campaign that is over.
const VARIANTS = [
	"start",
	"draft",
	"submitted",
	"not_subject",
	"closed",
] as const;
type PlaygroundVariant = (typeof VARIANTS)[number];

const VARIANT_LABELS: Record<PlaygroundVariant, string> = {
	start: "start — pas commencé",
	draft: "draft — en cours",
	submitted: "submitted — transmise",
	not_subject: "not_subject — non-assujettie",
	closed: "closed — campagne fermée",
};

const LOCK_HOLDER: LockHolderDisplay = {
	firstName: "Jeanne",
	lastName: "Dupont",
	email: "[EMAIL_REDACTED]",
	lockTimeoutMinutes: 30,
};

// A campaign that ended long ago, so the panel takes its "closed" branch.
const CLOSED_CAMPAIGN: RepresentationCampaign = {
	campaignStartDate: civilDate(2019, 0, 1),
	campaignEndDate: civilDate(2019, 11, 31),
	declarationDeadline: civilDate(2019, 2, 1),
};

const DEFAULT_CAMPAIGN_YEAR = 2026;

function toInputDate(date: Date): string {
	return date.toISOString().slice(0, 10);
}

function toCampaign(
	campaignYear: number,
	campaignEndDate: Date,
): RepresentationCampaign {
	return {
		campaignStartDate: getRepresentationCampaignStartDate(campaignYear),
		campaignEndDate,
		declarationDeadline: civilDate(campaignYear, 2, 1),
	};
}

function makeDeclaration(variant: PlaygroundVariant): DeclarationItem {
	const base: DeclarationItem = {
		type: "representation",
		siren: "000000000",
		year: DEFAULT_CAMPAIGN_YEAR,
		status: "to_complete",
		fsmStatus: null,
		currentStep: 0,
		updatedAt: new Date("2026-03-12T09:00:00Z"),
		firstDeclarationPathChoice: null,
		secondDeclarationPathChoice: null,
		hasSubmittedSecondDeclaration: false,
		secondDeclarationStep: null,
		hasSubmittedJointEvaluation: false,
		hasSubmittedCseOpinion: false,
		cseRequired: false,
		hasJointEvaluationFile: false,
		formalNoticeAvailable: false,
		hasSubmittedFormalNoticeJointEvaluation: false,
		hasPrefillData: false,
		deadline: null,
		notSubject: false,
	};

	switch (variant) {
		case "start":
			return { ...base, status: "to_complete", currentStep: 0 };
		case "draft":
			return { ...base, status: "in_progress", currentStep: 3 };
		case "submitted":
		case "closed":
			return {
				...base,
				status: "done",
				currentStep: LAST_REPRESENTATION_STEP,
			};
		case "not_subject":
			// A non-subject row is stored "done" with no step and the flag set.
			return { ...base, status: "done", currentStep: 0, notSubject: true };
	}
}

/**
 * Dev playground for the RepresentationProcessPanel: pick a variant, the
 * campaign year (the end date follows the 1 March → 28/29 February rule), and
 * whether another co-declarant holds the lock, then open the panel inline.
 */
export function RepresentationPanelPlayground() {
	const [variant, setVariant] = useState<PlaygroundVariant>("submitted");
	const [campaignYear, setCampaignYear] = useState(DEFAULT_CAMPAIGN_YEAR);
	const [campaignEndDate, setCampaignEndDate] = useState(() =>
		toInputDate(getRepresentationCampaignEndDate(DEFAULT_CAMPAIGN_YEAR)),
	);
	const [lockedByOther, setLockedByOther] = useState(false);

	const parsedEndDate = new Date(`${campaignEndDate}T00:00:00Z`);
	const isClosed = variant === "closed";
	const campaign = isClosed
		? CLOSED_CAMPAIGN
		: toCampaign(
				campaignYear,
				Number.isNaN(parsedEndDate.getTime())
					? getRepresentationCampaignEndDate(campaignYear)
					: parsedEndDate,
			);

	function selectYear(year: number) {
		setCampaignYear(year);
		setCampaignEndDate(toInputDate(getRepresentationCampaignEndDate(year)));
	}

	return (
		<section className="fr-mt-8w">
			<h2 className="fr-h4">RepresentationProcessPanel — Playground</h2>
			<p className="fr-text--sm fr-text-mention--grey">
				Dev-only section: variants, lock held by another co-declarant and
				campaign year of the representation panel.
			</p>

			<div className="fr-grid-row fr-grid-row--gutters fr-mb-4w">
				<div className="fr-col-12 fr-col-md-6">
					<fieldset className="fr-fieldset">
						<legend className="fr-fieldset__legend fr-text--regular">
							Variante
						</legend>
						<div className="fr-fieldset__content">
							{VARIANTS.map((value) => (
								<div className="fr-radio-group" key={value}>
									<input
										checked={variant === value}
										id={`representation-variant-${value}`}
										name="representation-variant"
										onChange={() => setVariant(value)}
										type="radio"
									/>
									<label
										className="fr-label"
										htmlFor={`representation-variant-${value}`}
									>
										{VARIANT_LABELS[value]}
									</label>
								</div>
							))}
						</div>
					</fieldset>
				</div>

				<div className="fr-col-12 fr-col-md-6">
					<div className="fr-input-group">
						<label className="fr-label" htmlFor="representation-campaign-year">
							Année de campagne
						</label>
						<input
							className="fr-input"
							id="representation-campaign-year"
							min={2024}
							onChange={(event) =>
								selectYear(Number(event.currentTarget.value))
							}
							type="number"
							value={campaignYear}
						/>
					</div>

					<div className="fr-input-group">
						<label className="fr-label" htmlFor="representation-campaign-end">
							Fin de campagne (mention « Modifiable jusqu'au »)
						</label>
						<input
							className="fr-input"
							id="representation-campaign-end"
							onChange={(event) =>
								setCampaignEndDate(event.currentTarget.value)
							}
							type="date"
							value={campaignEndDate}
						/>
					</div>

					<div className="fr-checkbox-group">
						<input
							checked={lockedByOther}
							id="representation-locked"
							onChange={(event) =>
								setLockedByOther(event.currentTarget.checked)
							}
							type="checkbox"
						/>
						<label className="fr-label" htmlFor="representation-locked">
							Verrou détenu par un autre co-déclarant
						</label>
					</div>
				</div>
			</div>

			<div className="fr-btns-group fr-btns-group--inline fr-mb-4w">
				<button
					aria-controls={REPRESENTATION_PROCESS_PANEL_ID}
					className="fr-btn"
					data-fr-opened="false"
					type="button"
				>
					Ouvrir le panneau représentation
				</button>
			</div>

			<RepresentationProcessPanel
				campaign={campaign}
				campaignYear={campaignYear}
				declaration={makeDeclaration(variant)}
				lockedByOther={lockedByOther}
				lockHolder={lockedByOther ? LOCK_HOLDER : null}
			/>
		</section>
	);
}
