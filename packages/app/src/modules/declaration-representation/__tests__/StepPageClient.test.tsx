import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { push, mutate, mutateAsync } = vi.hoisted(() => ({
	push: vi.fn(),
	mutate: vi.fn(),
	mutateAsync: vi.fn(),
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

vi.mock("~/trpc/react", () => ({
	api: {
		representationDeclaration: {
			saveDraft: {
				useMutation: () => ({ mutate, mutateAsync, isPending: false }),
			},
		},
	},
}));

import { StepPageClient } from "../StepPageClient";
import type { RepresentationDraft } from "../types";
import { MISMATCHED_EXECUTIVES, VALIDATION_MESSAGES } from "./fixtures";

const CAMPAIGN_YEAR = 2026;
const YEAR = 2025;
const CLOSED_BANNER = "La campagne de représentation équilibrée est close";
const TWO_OR_MORE = /^Deux cadres dirigeants ou plus/;

const SAVED_MISMATCHED_EXECUTIVES: RepresentationDraft = {
	currentStep: 2,
	...MISMATCHED_EXECUTIVES,
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

	it("falls back to the placeholder on a step that has no screen yet", () => {
		renderStep({ step: 3, currentStep: 3 });

		expect(
			screen.getByText(
				"Cette étape est en construction et sera disponible prochainement.",
			),
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

	it("saves the progress before routing to the next step", async () => {
		renderStep({ step: 2 });

		await userEvent.click(screen.getByRole("button", { name: "Suivant" }));

		expect(mutateAsync).toHaveBeenCalledWith({
			year: YEAR,
			currentStep: 3,
			draft: { currentStep: 3 },
		});
		expect(push).toHaveBeenCalledWith("/declaration-representation/etape/3");
	});

	it("disables the button while the progress is being saved", async () => {
		let resolveSave: () => void = () => undefined;
		mutateAsync.mockImplementationOnce(
			() =>
				new Promise<void>((resolve) => {
					resolveSave = resolve;
				}),
		);
		renderStep({ step: 2 });

		await userEvent.click(screen.getByRole("button", { name: "Suivant" }));

		const button = screen.getByRole("button", { name: "Enregistrement…" });
		expect(button).toBeDisabled();
		expect(push).not.toHaveBeenCalled();

		await act(async () => {
			resolveSave();
		});

		expect(push).toHaveBeenCalledWith("/declaration-representation/etape/3");
	});

	it("keeps the user on the step and explains the failure when the save fails", async () => {
		mutateAsync.mockRejectedValueOnce(new Error("network"));
		renderStep({ step: 2 });

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
	it("blocks the next step while the percentages do not sum to 100", async () => {
		renderStep({ step: 2 });

		await enterWomenPercent("35");
		await retypeMenPercent("50");

		expect(nextButton()).toBeDisabled();

		await userEvent.click(nextButton());

		expect(mutateAsync).not.toHaveBeenCalled();
		expect(push).not.toHaveBeenCalled();
	});

	it("blocks the next step while the percentages are still incomplete", async () => {
		renderStep({ step: 2 });

		await enterWomenPercent("35");
		await retypeMenPercent("");

		expect(nextButton()).toBeDisabled();
	});

	it("re-enables the next step once the sum is corrected to 100", async () => {
		renderStep({ step: 2 });

		await enterWomenPercent("35");
		await retypeMenPercent("50");
		expect(nextButton()).toBeDisabled();

		await retypeMenPercent("65");

		expect(nextButton()).toBeEnabled();

		await userEvent.click(nextButton());

		expect(push).toHaveBeenCalledWith("/declaration-representation/etape/3");
	});

	it("blocks the next step when the funnel reopens on a saved invalid pair", () => {
		renderStep({ step: 2, initialDraft: SAVED_MISMATCHED_EXECUTIVES });

		expect(screen.getByText(VALIDATION_MESSAGES.sum)).toBeInTheDocument();
		expect(nextButton()).toBeDisabled();
	});

	it("keeps the next step enabled on a step that never reports its validity", () => {
		renderStep({ step: 3, currentStep: 3 });

		expect(nextButton()).toBeEnabled();
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
