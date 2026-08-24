import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { push, apiAccess } = vi.hoisted(() => ({
	push: vi.fn(),
	apiAccess: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	usePathname: vi.fn(),
	useRouter: () => ({
		push,
		replace: vi.fn(),
		back: vi.fn(),
		refresh: vi.fn(),
	}),
}));

// The subjection answer is deliberately not persisted: any access to the tRPC
// client from this screen is a product regression, not an implementation detail.
vi.mock("~/trpc/react", () => ({
	api: new Proxy(
		{},
		{
			get: (_target, property) => {
				apiAccess(property);
				return undefined;
			},
		},
	),
}));

import { SubjectionScreen } from "../SubjectionScreen";

const CAMPAIGN_YEAR = 2026;
const STEP_1_HREF = "/declaration-representation/etape/1";
const SELECTION_ERROR = "Veuillez sélectionner une option pour continuer.";
const NOT_CONCERNED_INFO = /Vous n'êtes pas assujetti à la publication/;
const SUBJECTION_QUESTION =
	/Indiquez si votre entreprise emploie au moins 1 000 salariés/;
const SUBJECTION_FIELDSET_NAME = /Nombre de salariés de l'entreprise/;

function renderScreen() {
	return render(<SubjectionScreen campaignYear={CAMPAIGN_YEAR} />);
}

function concernedRadio() {
	return screen.getByRole("radio", {
		name: /1 000 salariés ou plus sur les trois exercices/,
	});
}

function notConcernedRadio() {
	return screen.getByRole("radio", {
		name: /Moins de 1 000 salariés sur au moins un exercice/,
	});
}

function nextButton() {
	return screen.getByRole("button", { name: "Suivant" });
}

beforeEach(() => {
	push.mockReset();
	apiAccess.mockReset();
});

describe("SubjectionScreen — rendering", () => {
	it("asks the subjection question with the two exclusive answers", () => {
		renderScreen();

		expect(
			screen.getByRole("heading", {
				level: 1,
				name: `Démarche des indicateurs de représentation ${CAMPAIGN_YEAR}`,
			}),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", {
				level: 2,
				name: "L'entreprise est-elle concernée ?",
			}),
		).toBeInTheDocument();
		expect(
			screen.getByText(SUBJECTION_QUESTION, { selector: "p" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("group", { name: SUBJECTION_FIELDSET_NAME }),
		).toBeInTheDocument();
		expect(concernedRadio()).not.toBeChecked();
		expect(notConcernedRadio()).not.toBeChecked();
		expect(screen.getAllByRole("radio")).toHaveLength(2);
	});

	it("states the question first, before its rationale and the answer options", () => {
		const { container } = renderScreen();

		const paragraphs = Array.from(container.querySelectorAll("p")).map(
			(paragraph) => paragraph.textContent ?? "",
		);

		expect(paragraphs[0]).toMatch(SUBJECTION_QUESTION);
		expect(paragraphs[1]).toMatch(/Ce seuil détermine/);
		expect(paragraphs[2]).toMatch(/Tous les champs sont obligatoires/);
	});

	it("offers no way back: the funnel entry is the only navigation", () => {
		renderScreen();

		expect(
			screen.queryByRole("link", { name: "Retour" }),
		).not.toBeInTheDocument();
		expect(nextButton()).toBeInTheDocument();
		expect(screen.queryByText(NOT_CONCERNED_INFO)).not.toBeInTheDocument();
		expect(screen.queryByText(SELECTION_ERROR)).not.toBeInTheDocument();
	});

	it("declares the group icon side so DSFR keeps the button full width", () => {
		const { container } = renderScreen();

		// DSFR 1.14 clamps icon-carrying buttons of a group to an icon-only
		// 2.5rem box unless the group declares fr-btns-group--icon-*.
		const actions = container.querySelector(".fr-btns-group");
		expect(actions?.tagName).toBe("UL");
		expect(actions).toHaveClass("fr-btns-group--icon-right");
		expect(nextButton().parentElement).toHaveRole("listitem");
	});
});

describe("SubjectionScreen — no answer selected", () => {
	it("blocks the submission and explains that an option is required", async () => {
		renderScreen();

		await userEvent.click(nextButton());

		expect(screen.getByText(SELECTION_ERROR)).toBeInTheDocument();
		expect(push).not.toHaveBeenCalled();
	});

	it("keeps the way forward after rejecting the question", async () => {
		renderScreen();

		await userEvent.click(nextButton());

		expect(nextButton()).toBeInTheDocument();
	});

	it("flags both options as erroneous until one is picked", async () => {
		renderScreen();

		await userEvent.click(nextButton());

		for (const radio of screen.getAllByRole("radio")) {
			expect(document.querySelector(`label[for="${radio.id}"]`)).toHaveClass(
				"fr-label--error",
			);
		}
	});

	it("clears the erroneous styling once an option is picked", async () => {
		renderScreen();
		await userEvent.click(nextButton());

		await userEvent.click(concernedRadio());

		for (const radio of screen.getAllByRole("radio")) {
			expect(
				document.querySelector(`label[for="${radio.id}"]`),
			).not.toHaveClass("fr-label--error");
		}
	});

	it("clears the error as soon as an option is selected", async () => {
		renderScreen();
		await userEvent.click(nextButton());

		await userEvent.click(concernedRadio());

		expect(screen.queryByText(SELECTION_ERROR)).not.toBeInTheDocument();
	});
});

describe("SubjectionScreen — company concerned", () => {
	it("enters the funnel at the first step", async () => {
		renderScreen();

		await userEvent.click(concernedRadio());
		await userEvent.click(nextButton());

		expect(push).toHaveBeenCalledWith(STEP_1_HREF);
		expect(screen.queryByText(SELECTION_ERROR)).not.toBeInTheDocument();
		expect(screen.queryByText(NOT_CONCERNED_INFO)).not.toBeInTheDocument();
	});
});

describe("SubjectionScreen — company not concerned", () => {
	it("explains the exemption and closes the démarche without entering the funnel", async () => {
		renderScreen();

		await userEvent.click(notConcernedRadio());

		expect(screen.getByText(NOT_CONCERNED_INFO)).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Valider" })).toHaveAttribute(
			"href",
			"/mon-espace",
		);
		expect(
			screen.queryByRole("button", { name: "Suivant" }),
		).not.toBeInTheDocument();
		expect(push).not.toHaveBeenCalled();
	});

	it("restores the funnel entry when the answer is changed back", async () => {
		renderScreen();
		await userEvent.click(notConcernedRadio());

		await userEvent.click(concernedRadio());

		expect(screen.queryByText(NOT_CONCERNED_INFO)).not.toBeInTheDocument();
		expect(
			screen.queryByRole("link", { name: "Valider" }),
		).not.toBeInTheDocument();
		expect(nextButton()).toBeInTheDocument();
	});
});

describe("SubjectionScreen — no persistence", () => {
	it("never stores the answer, whichever option is submitted", async () => {
		const { unmount } = renderScreen();

		await userEvent.click(nextButton());
		await userEvent.click(concernedRadio());
		await userEvent.click(nextButton());
		unmount();

		renderScreen();
		await userEvent.click(notConcernedRadio());

		expect(apiAccess).not.toHaveBeenCalled();
	});

	it("asks the question again on every visit", async () => {
		const { unmount } = renderScreen();
		await userEvent.click(concernedRadio());
		unmount();

		renderScreen();

		expect(concernedRadio()).not.toBeChecked();
		expect(notConcernedRadio()).not.toBeChecked();
	});
});
