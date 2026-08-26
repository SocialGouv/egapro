import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { push, declareNotSubjectMutate, declareNotSubjectState } = vi.hoisted(
	() => ({
		push: vi.fn(),
		declareNotSubjectMutate: vi.fn(),
		declareNotSubjectState: {
			error: null as { message: string } | null,
			isPending: false,
			onSuccess: undefined as (() => void) | undefined,
		},
	}),
);

vi.mock("next/navigation", () => ({
	usePathname: vi.fn(),
	useRouter: () => ({
		push,
		replace: vi.fn(),
		back: vi.fn(),
		refresh: vi.fn(),
	}),
}));

vi.mock("~/trpc/react", () => ({
	api: {
		representationDeclaration: {
			declareNotSubject: {
				useMutation: ({ onSuccess }: { onSuccess: () => void }) => {
					declareNotSubjectState.onSuccess = onSuccess;
					return {
						error: declareNotSubjectState.error,
						isPending: declareNotSubjectState.isPending,
						mutate: declareNotSubjectMutate,
					};
				},
			},
		},
	},
}));

import {
	REPRESENTATION_CAMPAIGN_YEAR,
	REPRESENTATION_YEAR,
} from "~/modules/declaration-representation/__tests__/fixtures";
import { SubjectionScreen } from "../SubjectionScreen";

const STEP_1_HREF = "/declaration-representation/etape/1";
const MY_SPACE_HREF = "/mon-espace";
const SELECTION_ERROR = "Veuillez sélectionner une option pour continuer.";
const NOT_CONCERNED_INFO = /Vous n'êtes pas assujetti à la publication/;
const SUBJECTION_QUESTION =
	/Indiquez si votre entreprise emploie au moins 1 000 salariés/;
const SUBJECTION_FIELDSET_NAME = /Nombre de salariés de l'entreprise/;

function renderScreen(initialAnswer?: "concerned" | "not_concerned") {
	return render(
		<SubjectionScreen
			campaignYear={REPRESENTATION_CAMPAIGN_YEAR}
			initialAnswer={initialAnswer}
			year={REPRESENTATION_YEAR}
		/>,
	);
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

function validateButton() {
	return screen.getByRole("button", { name: "Valider" });
}

beforeEach(() => {
	push.mockReset();
	declareNotSubjectMutate.mockReset();
	declareNotSubjectState.error = null;
	declareNotSubjectState.isPending = false;
	declareNotSubjectState.onSuccess = undefined;
});

describe("SubjectionScreen — rendering", () => {
	it("asks the subjection question with the two exclusive answers", () => {
		renderScreen();

		expect(
			screen.getByRole("heading", {
				level: 1,
				name: `Démarche des indicateurs de représentation ${REPRESENTATION_CAMPAIGN_YEAR}`,
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
		expect(declareNotSubjectMutate).not.toHaveBeenCalled();
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
	it("enters the funnel at the first step without recording anything", async () => {
		renderScreen();

		await userEvent.click(concernedRadio());
		await userEvent.click(nextButton());

		expect(push).toHaveBeenCalledWith(STEP_1_HREF);
		expect(declareNotSubjectMutate).not.toHaveBeenCalled();
		expect(screen.queryByText(SELECTION_ERROR)).not.toBeInTheDocument();
		expect(screen.queryByText(NOT_CONCERNED_INFO)).not.toBeInTheDocument();
	});
});

describe("SubjectionScreen — company not concerned (T3-S1)", () => {
	it("explains the exemption and swaps the funnel entry for a validation", async () => {
		renderScreen();

		await userEvent.click(notConcernedRadio());

		expect(screen.getByText(NOT_CONCERNED_INFO)).toBeInTheDocument();
		expect(validateButton()).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Suivant" }),
		).not.toBeInTheDocument();
		expect(push).not.toHaveBeenCalled();
		expect(declareNotSubjectMutate).not.toHaveBeenCalled();
	});

	it("records the exemption for the reference year on validation", async () => {
		renderScreen();

		await userEvent.click(notConcernedRadio());
		await userEvent.click(validateButton());

		expect(declareNotSubjectMutate).toHaveBeenCalledWith({
			year: REPRESENTATION_YEAR,
		});
		expect(push).not.toHaveBeenCalled();
	});

	it("closes the démarche back to Mon espace once the exemption is recorded", () => {
		renderScreen("not_concerned");

		act(() => declareNotSubjectState.onSuccess?.());

		expect(push).toHaveBeenCalledWith(MY_SPACE_HREF);
	});

	it("holds the validation while the recording is in flight", async () => {
		declareNotSubjectState.isPending = true;
		renderScreen("not_concerned");

		expect(validateButton()).toBeDisabled();

		await userEvent.click(validateButton());

		expect(declareNotSubjectMutate).not.toHaveBeenCalled();
	});

	it("restores the funnel entry when the answer is changed back", async () => {
		renderScreen();
		await userEvent.click(notConcernedRadio());

		await userEvent.click(concernedRadio());

		expect(screen.queryByText(NOT_CONCERNED_INFO)).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Valider" }),
		).not.toBeInTheDocument();
		expect(nextButton()).toBeInTheDocument();
	});
});

describe("SubjectionScreen — recording failure (T3-S4)", () => {
	it("surfaces the failure without leaving the screen", () => {
		declareNotSubjectState.error = {
			message: "La campagne de déclaration est fermée.",
		};
		renderScreen("not_concerned");

		const alert = screen.getByRole("alert");
		expect(alert).toHaveTextContent("La campagne de déclaration est fermée.");
		expect(alert).toHaveClass("fr-alert--error");
		expect(push).not.toHaveBeenCalled();
	});

	it("keeps the validation available for a retry", async () => {
		declareNotSubjectState.error = { message: "Une erreur est survenue." };
		renderScreen("not_concerned");

		await userEvent.click(validateButton());

		expect(declareNotSubjectMutate).toHaveBeenCalledWith({
			year: REPRESENTATION_YEAR,
		});
	});
});

describe("SubjectionScreen — returning declarant (T3-S2)", () => {
	it("pre-fills the recorded exemption without recording it again", () => {
		renderScreen("not_concerned");

		expect(notConcernedRadio()).toBeChecked();
		expect(concernedRadio()).not.toBeChecked();
		expect(screen.getByText(NOT_CONCERNED_INFO)).toBeInTheDocument();
		expect(validateButton()).toBeEnabled();
		expect(declareNotSubjectMutate).not.toHaveBeenCalled();
	});

	it("lets the declarant switch to the funnel without recording anything (T3-S3)", async () => {
		renderScreen("not_concerned");

		await userEvent.click(concernedRadio());
		await userEvent.click(nextButton());

		expect(push).toHaveBeenCalledWith(STEP_1_HREF);
		expect(declareNotSubjectMutate).not.toHaveBeenCalled();
		expect(screen.queryByText(NOT_CONCERNED_INFO)).not.toBeInTheDocument();
	});

	it("asks the question again when nothing was recorded", async () => {
		const { unmount } = renderScreen();
		await userEvent.click(concernedRadio());
		unmount();

		renderScreen();

		expect(concernedRadio()).not.toBeChecked();
		expect(notConcernedRadio()).not.toBeChecked();
	});
});
