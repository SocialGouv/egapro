import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { push, replace, mutate, mutateAsync, submitMutate } = vi.hoisted(() => ({
	push: vi.fn(),
	replace: vi.fn(),
	mutate: vi.fn(),
	mutateAsync: vi.fn(),
	submitMutate: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	usePathname: vi.fn(),
	useRouter: () => ({
		push,
		replace,
		back: vi.fn(),
		refresh: vi.fn(),
	}),
}));

vi.mock("~/trpc/react", () => ({
	api: {
		representationDeclaration: {
			saveDraft: {
				useMutation: () => ({ mutate, mutateAsync, isPending: false }),
			},
			submit: {
				useMutation: () => ({
					mutate: submitMutate,
					isPending: false,
					error: null,
				}),
			},
		},
	},
}));

import { StepPageClient } from "../StepPageClient";
import type { RepresentationDraft } from "../types";
import {
	COMPUTABLE_EXECUTIVES,
	MISMATCHED_EXECUTIVES,
	NO_EXECUTIVES,
	NO_MANAGEMENT_BODY,
	VALID_REFERENCE_PERIOD,
	VALIDATION_MESSAGES,
	WEBSITE_PUBLICATION,
} from "./fixtures";

const CAMPAIGN_YEAR = 2026;
const YEAR = 2025;
const CLOSED_BANNER = "La campagne de représentation équilibrée est close";
const TWO_OR_MORE = /^Deux cadres dirigeants ou plus/;
const NONE = /^Aucun cadre dirigeant/;
const NO_MANAGEMENT_BODY_LABEL = /^Aucune instance dirigeante/;
const SUMMARY_STEP = 5;
const STEP_3_HREF = "/declaration-representation/etape/3";
const STEP_4_HREF = "/declaration-representation/etape/4";
const STEP_5_HREF = "/declaration-representation/etape/5";
const NO_COMPUTABLE_GAP = { ...NO_EXECUTIVES, ...NO_MANAGEMENT_BODY };

const SAVED_MISMATCHED_EXECUTIVES: RepresentationDraft = {
	currentStep: 2,
	...MISMATCHED_EXECUTIVES,
};

const SAVED_NO_EXECUTIVES: RepresentationDraft = {
	currentStep: 2,
	...NO_EXECUTIVES,
};

type RenderStepOptions = {
	step?: number;
	campaignOpen?: boolean;
	currentStep?: number;
	initialDraft?: RepresentationDraft;
};

function renderStep({
	step = 2,
	campaignOpen = true,
	currentStep = 2,
	initialDraft,
}: RenderStepOptions = {}) {
	return render(
		<StepPageClient
			campaignOpen={campaignOpen}
			campaignYear={CAMPAIGN_YEAR}
			initialDraft={initialDraft ?? { currentStep }}
			step={step}
			year={YEAR}
		/>,
	);
}

function nextButton() {
	return screen.getByRole("button", { name: "Suivant" });
}

async function enterWomenPercent(value: string) {
	await userEvent.click(screen.getByRole("radio", { name: TWO_OR_MORE }));
	await userEvent.type(screen.getByLabelText(/Femmes/), value);
}

async function retypeMenPercent(value: string) {
	await userEvent.clear(screen.getByLabelText(/Hommes/));
	if (value !== "")
		await userEvent.type(screen.getByLabelText(/Hommes/), value);
}

beforeEach(() => {
	push.mockReset();
	replace.mockReset();
	mutate.mockReset();
	mutateAsync.mockReset().mockResolvedValue(undefined);
});

describe("StepPageClient — rendering", () => {
	it("renders the funnel heading, the stepper and the step content", () => {
		renderStep();

		expect(
			screen.getByRole("heading", {
				level: 1,
				name: `Démarche des indicateurs de représentation ${CAMPAIGN_YEAR}`,
			}),
		).toBeInTheDocument();
		expect(screen.getByText("Étape 2 sur 5")).toBeInTheDocument();
		expect(
			screen.getByRole("radio", { name: /^Deux cadres dirigeants ou plus/ }),
		).toBeInTheDocument();
	});

	it("renders the summary screen on the last step", () => {
		renderStep({ step: SUMMARY_STEP, currentStep: SUMMARY_STEP });

		expect(
			screen.getByText(/Vérifiez les informations avant de soumettre/),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Soumettre" }),
		).toBeInTheDocument();
	});

	it("renders nothing for a step outside the funnel", () => {
		const { container } = renderStep({ step: 6 });

		expect(container).toBeEmptyDOMElement();
	});
});

describe("StepPageClient — navigation", () => {
	it("links back to the previous step", () => {
		renderStep({ step: 3, currentStep: 3 });

		expect(screen.getByRole("link", { name: "Précédent" })).toHaveAttribute(
			"href",
			"/declaration-representation/etape/2",
		);
	});

	it("links back to the funnel root from the first step", () => {
		renderStep({ step: 1, currentStep: 1 });

		expect(screen.getByRole("link", { name: "Précédent" })).toHaveAttribute(
			"href",
			"/declaration-representation",
		);
	});

	it("keeps the navigation out of a .fr-btns-group so labels stay full width", () => {
		const { container } = renderStep({ step: 2, currentStep: 2 });

		// DSFR 1.14 clamps any icon-carrying .fr-btn inside a .fr-btns-group to
		// an icon-only 2.5rem box, truncating the "Suivant" / "Précédent" labels.
		const previous = screen.getByRole("link", { name: "Précédent" });
		expect(container.querySelector(".fr-btns-group")).toBeNull();
		expect(previous.parentElement).toContainElement(nextButton());
	});

	it("saves the progress before routing to the next step", async () => {
		renderStep({ step: 2, initialDraft: SAVED_NO_EXECUTIVES });

		await userEvent.click(screen.getByRole("button", { name: "Suivant" }));

		expect(mutateAsync).toHaveBeenCalledWith({
			year: YEAR,
			currentStep: 3,
			draft: { currentStep: 3, ...NO_EXECUTIVES },
		});
		expect(push).toHaveBeenCalledWith(STEP_3_HREF);
	});

	it("disables the button while the progress is being saved", async () => {
		let resolveSave: () => void = () => undefined;
		mutateAsync.mockImplementationOnce(
			() =>
				new Promise<void>((resolve) => {
					resolveSave = resolve;
				}),
		);
		renderStep({ step: 2, initialDraft: SAVED_NO_EXECUTIVES });

		await userEvent.click(screen.getByRole("button", { name: "Suivant" }));

		const button = screen.getByRole("button", { name: "Enregistrement…" });
		expect(button).toBeDisabled();
		expect(push).not.toHaveBeenCalled();

		await act(async () => {
			resolveSave();
		});

		expect(push).toHaveBeenCalledWith(STEP_3_HREF);
	});

	it("keeps the user on the step and explains the failure when the save fails", async () => {
		mutateAsync.mockRejectedValueOnce(new Error("network"));
		renderStep({ step: 2, initialDraft: SAVED_NO_EXECUTIVES });

		await userEvent.click(screen.getByRole("button", { name: "Suivant" }));

		expect(screen.getByRole("alert")).toHaveTextContent(
			"L'enregistrement de votre progression a échoué. Veuillez réessayer.",
		);
		expect(push).not.toHaveBeenCalled();
		expect(screen.getByRole("button", { name: "Suivant" })).toBeEnabled();
	});

	it("offers no next step on the last step", () => {
		renderStep({ step: 5, currentStep: 5 });

		expect(
			screen.queryByRole("button", { name: "Suivant" }),
		).not.toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Précédent" })).toBeInTheDocument();
	});
});

describe("StepPageClient — étape invalide (S6)", () => {
	it("blocks the next step while no executives count is selected", async () => {
		renderStep({ step: 2, initialDraft: { currentStep: 2 } });

		await userEvent.click(nextButton());

		expect(
			screen.getByText(VALIDATION_MESSAGES.selectionRequired),
		).toBeInTheDocument();
		expect(mutateAsync).not.toHaveBeenCalled();
		expect(push).not.toHaveBeenCalled();
	});

	it("advances as soon as an executives count is selected", async () => {
		renderStep({ step: 2 });

		await userEvent.click(screen.getByRole("radio", { name: NONE }));
		await userEvent.click(nextButton());

		expect(push).toHaveBeenCalledWith(STEP_3_HREF);
	});

	it("stops blocking once the invalid step is left behind", async () => {
		const { rerender } = renderStep({ step: 2 });
		await userEvent.click(nextButton());
		expect(push).not.toHaveBeenCalled();

		rerender(
			<StepPageClient
				campaignOpen
				campaignYear={CAMPAIGN_YEAR}
				initialDraft={{ currentStep: 3 }}
				step={3}
				year={YEAR}
			/>,
		);
		await userEvent.click(
			screen.getByRole("radio", { name: NO_MANAGEMENT_BODY_LABEL }),
		);
		await userEvent.click(nextButton());

		expect(push).toHaveBeenCalledWith(STEP_4_HREF);
	});

	it("blocks the next step while the percentages do not sum to 100", async () => {
		renderStep({ step: 2 });

		await enterWomenPercent("35");
		await retypeMenPercent("50");
		await userEvent.click(nextButton());

		expect(screen.getByText(VALIDATION_MESSAGES.sum)).toBeInTheDocument();
		expect(mutateAsync).not.toHaveBeenCalled();
		expect(push).not.toHaveBeenCalled();
	});

	it("blocks the next step while the percentages are still incomplete", async () => {
		renderStep({ step: 2 });

		await enterWomenPercent("35");
		await retypeMenPercent("");
		await userEvent.click(nextButton());

		expect(mutateAsync).not.toHaveBeenCalled();
		expect(push).not.toHaveBeenCalled();
	});

	it("advances once the sum is corrected to 100", async () => {
		renderStep({ step: 2 });

		await enterWomenPercent("35");
		await retypeMenPercent("50");
		await userEvent.click(nextButton());
		expect(push).not.toHaveBeenCalled();

		await retypeMenPercent("65");
		await userEvent.click(nextButton());

		expect(push).toHaveBeenCalledWith(STEP_3_HREF);
	});

	it("blocks the next step when the funnel reopens on a saved invalid pair", async () => {
		renderStep({ step: 2, initialDraft: SAVED_MISMATCHED_EXECUTIVES });

		expect(screen.getByText(VALIDATION_MESSAGES.sum)).toBeInTheDocument();

		await userEvent.click(nextButton());

		expect(mutateAsync).not.toHaveBeenCalled();
		expect(push).not.toHaveBeenCalled();
	});
});

describe("StepPageClient — publication step skipped (S12)", () => {
	const PUBLICATION_REQUIRED: RepresentationDraft = {
		currentStep: 4,
		...VALID_REFERENCE_PERIOD,
		...COMPUTABLE_EXECUTIVES,
		...NO_MANAGEMENT_BODY,
	};

	function publicationDateField() {
		return screen.queryByLabelText(
			/Date de publication des écarts calculables/,
		);
	}

	it("jumps from the gaps step straight to the summary when no gap is computable", async () => {
		renderStep({
			step: 3,
			initialDraft: { currentStep: 3, ...NO_COMPUTABLE_GAP },
		});

		await userEvent.click(nextButton());

		expect(mutateAsync).toHaveBeenCalledWith({
			year: YEAR,
			currentStep: 5,
			draft: { currentStep: 5, ...NO_COMPUTABLE_GAP },
		});
		expect(push).toHaveBeenCalledWith(STEP_5_HREF);
	});

	it("links the summary back to the gaps step", () => {
		renderStep({
			step: 5,
			initialDraft: { currentStep: 5, ...NO_COMPUTABLE_GAP },
		});

		expect(screen.getByRole("link", { name: "Précédent" })).toHaveAttribute(
			"href",
			STEP_3_HREF,
		);
	});

	it("redirects to the summary when the publication step is opened directly", () => {
		const { container } = renderStep({
			step: 4,
			initialDraft: { currentStep: 4, ...NO_COMPUTABLE_GAP },
		});

		expect(replace).toHaveBeenCalledWith(STEP_5_HREF);
		expect(container).toBeEmptyDOMElement();
	});

	it("presents the publication step as soon as one gap is computable", () => {
		renderStep({ step: 4, initialDraft: PUBLICATION_REQUIRED });

		expect(replace).not.toHaveBeenCalled();
		expect(publicationDateField()).toBeInTheDocument();
	});

	it("presents the publication step while the computable gaps are still unknown", () => {
		renderStep({ step: 4, currentStep: 4 });

		expect(replace).not.toHaveBeenCalled();
		expect(publicationDateField()).toBeInTheDocument();
	});

	it("keeps the user on the publication step while its guard rejects the entries", async () => {
		renderStep({ step: 4, initialDraft: PUBLICATION_REQUIRED });

		await userEvent.click(nextButton());

		expect(
			screen.getByText(VALIDATION_MESSAGES.publishDateRequired),
		).toBeInTheDocument();
		expect(mutateAsync).not.toHaveBeenCalled();
		expect(push).not.toHaveBeenCalled();
	});

	it("advances to the summary once the publication step is complete", async () => {
		renderStep({
			step: 4,
			initialDraft: { ...PUBLICATION_REQUIRED, ...WEBSITE_PUBLICATION },
		});

		await userEvent.click(nextButton());

		expect(push).toHaveBeenCalledWith(STEP_5_HREF);
	});
});

describe("StepPageClient — closed campaign (S23)", () => {
	it("shows the read-only banner", () => {
		renderStep({ campaignOpen: false, step: 5, currentStep: 5 });

		expect(screen.getByText(CLOSED_BANNER)).toBeInTheDocument();
		expect(
			screen.getByText(/Votre déclaration est consultable en lecture seule/),
		).toBeInTheDocument();
	});

	it("hides the next-step button so no mutation can be triggered", () => {
		renderStep({ campaignOpen: false, step: 2 });

		expect(
			screen.queryByRole("button", { name: "Suivant" }),
		).not.toBeInTheDocument();
		expect(mutate).not.toHaveBeenCalled();
		expect(mutateAsync).not.toHaveBeenCalled();
	});

	it("does not show the banner while the campaign is open", () => {
		renderStep();

		expect(screen.queryByText(CLOSED_BANNER)).not.toBeInTheDocument();
	});
});
