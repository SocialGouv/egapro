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

const CAMPAIGN_YEAR = 2026;
const YEAR = 2025;
const CLOSED_BANNER = "La campagne de représentation équilibrée est close";

function renderStep({ step = 2, campaignOpen = true, currentStep = 2 } = {}) {
	return render(
		<StepPageClient
			campaignOpen={campaignOpen}
			campaignYear={CAMPAIGN_YEAR}
			initialDraft={{ currentStep }}
			step={step}
			year={YEAR}
		/>,
	);
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
