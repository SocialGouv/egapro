import { render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
	REPRESENTATION_FUNNEL_ROOT,
	stepHref,
	TOTAL_REPRESENTATION_STEPS,
} from "~/modules/declaration-representation";
import type { RepresentationCampaign } from "~/modules/domain";
import { RepresentationProcessPanel } from "../RepresentationProcessPanel";
import type { DeclarationItem } from "../types";

const SIREN = "532847196";
const CAMPAIGN_YEAR = 2026;
const RECAP_HREF = stepHref(TOTAL_REPRESENTATION_STEPS);

// The panel resolves the campaign window against the real clock, so the open
// window is stretched wide enough to stay open whenever the suite runs.
const OPEN_CAMPAIGN: RepresentationCampaign = {
	campaignStartDate: new Date(2000, 0, 1),
	campaignEndDate: new Date(2099, 11, 31),
	declarationDeadline: new Date(CAMPAIGN_YEAR, 2, 1),
};

const CLOSED_CAMPAIGN: RepresentationCampaign = {
	campaignStartDate: new Date(2019, 0, 1),
	campaignEndDate: new Date(2019, 11, 31),
	declarationDeadline: new Date(2019, 2, 1),
};

function makeDeclaration(
	overrides: Partial<DeclarationItem> = {},
): DeclarationItem {
	return {
		type: "representation",
		siren: SIREN,
		year: CAMPAIGN_YEAR,
		status: "to_complete",
		fsmStatus: null,
		currentStep: 0,
		updatedAt: null,
		firstDeclarationPathChoice: null,
		secondDeclarationPathChoice: null,
		hasSubmittedSecondDeclaration: false,
		hasSubmittedCseOpinion: false,
		cseRequired: false,
		hasJointEvaluationFile: false,
		hasPrefillData: false,
		...overrides,
	};
}

const DRAFT = makeDeclaration({ status: "in_progress", currentStep: 3 });
const SUBMITTED = makeDeclaration({
	status: "done",
	currentStep: TOTAL_REPRESENTATION_STEPS,
});

function renderPanel({
	campaign = OPEN_CAMPAIGN,
	declaration,
}: {
	campaign?: RepresentationCampaign;
	declaration?: DeclarationItem;
} = {}) {
	const { container } = render(
		<RepresentationProcessPanel
			campaign={campaign}
			campaignYear={CAMPAIGN_YEAR}
			declaration={declaration}
		/>,
	);
	const dialog = container.querySelector("dialog") as HTMLElement;
	return { panel: within(dialog), dialog };
}

function getCta(dialog: HTMLElement) {
	return dialog.querySelector("a.fr-btn");
}

describe("RepresentationProcessPanel", () => {
	it("renders a labelled modal dialog carrying the panel id", () => {
		const { dialog } = renderPanel();
		expect(dialog).toHaveAttribute("id", "representation-process-panel");
		expect(dialog).toHaveAttribute("aria-modal", "true");
		const titleId = dialog.getAttribute("aria-labelledby");
		expect(dialog.querySelector(`#${titleId}`)?.tagName).toBe("H2");
	});

	it("renders the title with the campaign year", () => {
		const { panel } = renderPanel();
		const title = panel.getByText(
			`Démarche des indicateurs de représentation ${CAMPAIGN_YEAR}`,
		);
		expect(title).toBeInTheDocument();
		expect(title.tagName).toBe("H2");
	});

	it("renders the Rixain reminder with both representation targets", () => {
		const { panel } = renderPanel();
		expect(panel.getByText(/loi Rixain/)).toBeInTheDocument();
		expect(
			panel.getByText("30 % minimum de chaque sexe depuis le 1ᵉʳ mars 2026"),
		).toBeInTheDocument();
		expect(
			panel.getByText("40 % minimum de chaque sexe à compter du 1ᵉʳ mars 2029"),
		).toBeInTheDocument();
	});

	it("renders the campaign deadline on the declaration step", () => {
		const { panel } = renderPanel();
		expect(panel.getByText("Échéance : 1ᵉʳ mars 2026")).toBeInTheDocument();
	});

	it("renders the deadline overridden by the back-office campaign", () => {
		const { panel } = renderPanel({
			campaign: {
				...OPEN_CAMPAIGN,
				declarationDeadline: new Date(CAMPAIGN_YEAR, 3, 15),
			},
		});
		expect(panel.getByText("Échéance : 15 avril 2026")).toBeInTheDocument();
	});

	it("renders help section buttons", () => {
		const { dialog } = renderPanel();
		const texts = [...dialog.querySelectorAll("button.fr-link")].map(
			(b) => b.textContent,
		);
		expect(texts).toContain("Détail des étapes");
		expect(texts).toContain("Centre d'aide");
	});

	it("describes the CTA link by the panel title", () => {
		const { dialog } = renderPanel();
		const describedBy = getCta(dialog)?.getAttribute("aria-describedby");
		expect(describedBy).toBeTruthy();
		expect(dialog.querySelector(`#${describedBy}`)).toHaveTextContent(
			/Démarche des indicateurs de représentation/,
		);
	});

	describe("variant: start", () => {
		it('renders a "Commencer" CTA pointing to the funnel entry point', () => {
			const { dialog } = renderPanel();
			const cta = getCta(dialog);
			expect(cta).toHaveTextContent(/^Commencer$/);
			expect(cta).toHaveAttribute("href", REPRESENTATION_FUNNEL_ROOT);
		});

		it("marks the subjection check as the current step", () => {
			const { panel } = renderPanel();
			expect(panel.getAllByText("Étape en cours")).toHaveLength(1);
			expect(
				panel.getByText("Vérification de l'assujettissement"),
			).toBeInTheDocument();
		});

		it("keeps the declaration step collapsed to its heading", () => {
			const { panel } = renderPanel();
			expect(
				panel.getByText("Déclaration des écarts de représentation"),
			).toBeInTheDocument();
			expect(panel.queryByText("Cadres dirigeants")).not.toBeInTheDocument();
		});

		it("does not render a last action date when the démarche was never touched", () => {
			const { panel } = renderPanel({ declaration: makeDeclaration() });
			expect(panel.queryByText(/Dernière action/)).not.toBeInTheDocument();
		});
	});

	describe("variant: draft", () => {
		it('renders a "Reprendre" CTA pointing to the step the draft stopped at', () => {
			const { dialog } = renderPanel({ declaration: DRAFT });
			const cta = getCta(dialog);
			expect(cta).toHaveTextContent(/^Reprendre$/);
			expect(cta).toHaveAttribute("href", stepHref(3));
		});

		it("expands the declaration step into its three bullets", () => {
			const { panel } = renderPanel({ declaration: DRAFT });
			expect(panel.getByText("Écarts de représentation")).toBeInTheDocument();
			expect(panel.getByText("Cadres dirigeants")).toBeInTheDocument();
			expect(panel.getByText("Instances dirigeantes")).toBeInTheDocument();
			expect(
				panel.getByText("Informations de publication"),
			).toBeInTheDocument();
		});

		it("marks the subjection check as done and the declaration as current", () => {
			const { panel } = renderPanel({ declaration: DRAFT });
			expect(panel.getAllByText("Étape terminée")).toHaveLength(1);
			expect(panel.getAllByText("Étape en cours")).toHaveLength(1);
		});

		it("renders the last action date of the draft", () => {
			const { panel } = renderPanel({
				declaration: makeDeclaration({
					status: "in_progress",
					currentStep: 3,
					updatedAt: new Date(2026, 1, 10),
				}),
			});
			expect(
				panel.getByText("Dernière action le 10 février 2026"),
			).toBeInTheDocument();
		});

		it("does not announce the démarche as closed", () => {
			const { panel } = renderPanel({ declaration: DRAFT });
			expect(panel.queryByText("Démarche close")).not.toBeInTheDocument();
		});
	});

	describe("variant: submitted", () => {
		it('renders a "Voir la déclaration" CTA pointing to the recap', () => {
			const { dialog } = renderPanel({ declaration: SUBMITTED });
			const cta = getCta(dialog);
			expect(cta).toHaveTextContent(/^Voir la déclaration$/);
			expect(cta).toHaveAttribute("href", RECAP_HREF);
		});

		it("marks both steps as done", () => {
			const { panel } = renderPanel({ declaration: SUBMITTED });
			expect(panel.getAllByText("Étape terminée")).toHaveLength(2);
			expect(panel.queryByText("Étape en cours")).not.toBeInTheDocument();
		});

		it("does not announce the démarche as closed while the campaign is open", () => {
			const { panel } = renderPanel({ declaration: SUBMITTED });
			expect(panel.queryByText("Démarche close")).not.toBeInTheDocument();
		});
	});

	describe("campaign closed", () => {
		const declarations: Array<[string, DeclarationItem | undefined]> = [
			["no démarche", undefined],
			["an untouched démarche", makeDeclaration()],
			["a draft", DRAFT],
			["a submitted démarche", SUBMITTED],
		];

		for (const [label, declaration] of declarations) {
			it(`announces the démarche as closed with ${label}`, () => {
				const { panel, dialog } = renderPanel({
					campaign: CLOSED_CAMPAIGN,
					declaration,
				});
				expect(panel.getByText("Démarche close")).toBeInTheDocument();
				expect(
					panel.getByText("Cette démarche est terminée."),
				).toBeInTheDocument();
				const cta = getCta(dialog);
				expect(cta).toHaveTextContent(/^Voir la déclaration$/);
				expect(cta).toHaveAttribute("href", RECAP_HREF);
			});
		}
	});
});
