import { render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getDefaultCampaignDeadlines } from "~/modules/domain";
import type { PanelVariant } from "../DeclarationProcessPanel";
import { DeclarationProcessPanel } from "../DeclarationProcessPanel";

const FUTURE_YEAR = 2099;
const PAST_YEAR = 2020;

const BASE_PROPS = {
	campaignDeadlines: getDefaultCampaignDeadlines(FUTURE_YEAR),
	year: FUTURE_YEAR,
	lastActionDate: null as string | null,
	compliancePath: null as string | null,
	secondDeclarationStatus: null as string | null,
	siren: "532847196",
	ctaHref: "/declaration-remuneration?siren=532847196",
};

function renderPanel(
	variant: PanelVariant,
	overrides: Partial<typeof BASE_PROPS> = {},
) {
	const { container } = render(
		<DeclarationProcessPanel
			{...BASE_PROPS}
			{...overrides}
			variant={variant}
		/>,
	);
	const dialog = container.querySelector("dialog");
	if (!dialog)
		throw new Error(
			"DeclarationProcessPanel did not render a <dialog> element",
		);
	return { panel: within(dialog), dialog, container };
}

describe("VerticalStepper — bouton œil (viewHref)", () => {
	describe("1ère déclaration — deadline future", () => {
		it("renders the view link with correct href", () => {
			const { dialog } = renderPanel("compliance");
			const link = dialog.querySelector<HTMLAnchorElement>(
				'a[title="Voir le récapitulatif de la déclaration"]',
			);
			expect(link).toBeInTheDocument();
			expect(link).toHaveAttribute(
				"href",
				"/declaration-remuneration/recapitulatif?siren=532847196",
			);
		});

		it("renders the sr-only text for accessibility", () => {
			const { panel } = renderPanel("compliance");
			expect(
				panel.getByText("Voir le récapitulatif de la déclaration"),
			).toBeInTheDocument();
		});
	});

	describe("1ère déclaration — deadline passée", () => {
		it("view link stays present after deadline", () => {
			const { dialog } = renderPanel("compliance", {
				campaignDeadlines: getDefaultCampaignDeadlines(PAST_YEAR),
			});
			const link = dialog.querySelector<HTMLAnchorElement>(
				'a[title="Voir le récapitulatif de la déclaration"]',
			);
			expect(link).toBeInTheDocument();
			expect(link).toHaveAttribute(
				"href",
				"/declaration-remuneration/recapitulatif?siren=532847196",
			);
		});

		it("Modifier link is hidden after deadline but view link remains", () => {
			const { panel, dialog } = renderPanel("compliance", {
				campaignDeadlines: getDefaultCampaignDeadlines(PAST_YEAR),
			});
			expect(panel.queryByText("Modifier")).not.toBeInTheDocument();
			expect(
				dialog.querySelector(
					'a[title="Voir le récapitulatif de la déclaration"]',
				),
			).toBeInTheDocument();
		});
	});

	describe("2nde déclaration — variant evaluation", () => {
		it("renders view link on the second declaration row (with type=correction)", () => {
			const { dialog } = renderPanel("evaluation", {
				secondDeclarationStatus: "submitted",
			});
			// Use partial href match to avoid CSS selector issues with & character
			const correctionLink = dialog.querySelector<HTMLAnchorElement>(
				'a[href*="type=correction"][title="Voir le récapitulatif de la déclaration"]',
			);
			expect(correctionLink).toBeInTheDocument();
			expect(correctionLink?.getAttribute("href")).toContain(
				"recapitulatif?siren=532847196",
			);
			expect(correctionLink?.getAttribute("href")).toContain("type=correction");
		});
	});

	describe("2nde déclaration — variant cse avec secondDeclarationSubmitted", () => {
		it("renders view link on the second declaration row (with type=correction)", () => {
			const { dialog } = renderPanel("cse", {
				secondDeclarationStatus: "submitted",
			});
			const correctionLink = dialog.querySelector<HTMLAnchorElement>(
				'a[href*="type=correction"][title="Voir le récapitulatif de la déclaration"]',
			);
			expect(correctionLink).toBeInTheDocument();
			expect(correctionLink?.getAttribute("href")).toContain(
				"recapitulatif?siren=532847196",
			);
			expect(correctionLink?.getAttribute("href")).toContain("type=correction");
		});
	});

	describe("TransmittedRow sans viewHref — pas de bouton œil sur ces lignes", () => {
		it("does not render view link on CSE avis row (closed variant, no decl1 row shown)", () => {
			// Step3Content in closed variant renders the CSE avis row (Modifier link
			// points to /avis-cse/etape/2) but without viewHref → no eye links at all.
			const { dialog } = renderPanel("closed");
			// Prove Step3Content actually rendered (the CSE modify link is present)
			expect(dialog.querySelector('a[href*="avis-cse"]')).toBeInTheDocument();
			// Confirm no eye link was added to this row
			const links = dialog.querySelectorAll(
				'a[title="Voir le récapitulatif de la déclaration"]',
			);
			expect(links).toHaveLength(0);
		});

		it("does not render view link for joint evaluation row (no type=correction link)", () => {
			// cse + joint_evaluation + secondDeclarationSubmitted=false:
			// Only decl1 view link is present (no type=correction), joint eval row has no viewHref.
			const { dialog } = renderPanel("cse", {
				compliancePath: "joint_evaluation",
				secondDeclarationStatus: null,
			});
			const correctionLink = dialog.querySelector('a[href*="type=correction"]');
			expect(correctionLink).not.toBeInTheDocument();
		});

		it("does not render view link for 2nd decl when secondDeclarationSubmitted is false", () => {
			// cse + no second submission: no type=correction link appears
			const { dialog } = renderPanel("cse", {
				compliancePath: "corrective_action",
				secondDeclarationStatus: null,
			});
			const correctionLink = dialog.querySelector('a[href*="type=correction"]');
			expect(correctionLink).not.toBeInTheDocument();
		});
	});
});
