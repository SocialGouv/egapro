import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getDefaultCampaignDeadlines } from "~/modules/domain";
import { CompliancePathChoice } from "../CompliancePathChoice";

const campaignDeadlines = getDefaultCampaignDeadlines(2026);

const DECLARATION_SIREN = "123456789";
const DECLARATION_YEAR = 2026;

const mockMutate = vi.fn();
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: mockPush }),
	usePathname: () => "/declaration-remuneration/parcours-conformite",
}));

vi.mock("~/trpc/react", () => ({
	api: {
		declaration: {
			saveCompliancePath: {
				useMutation: (opts: {
					onSuccess?: (data: unknown, variables: { path: string }) => void;
				}) => ({
					mutate: (args: { path: string }) => {
						mockMutate(args);
						opts.onSuccess?.(undefined, args);
					},
					isPending: false,
					error: null,
				}),
			},
		},
		mail: {
			resendReceipt: {
				useMutation: () => ({ mutate: vi.fn(), isPending: false }),
			},
		},
	},
}));

beforeEach(() => {
	mockMutate.mockClear();
	mockPush.mockClear();
});

describe("CompliancePathChoice", () => {
	it("renders the page title and success banner", () => {
		render(
			<CompliancePathChoice
				campaignDeadlines={campaignDeadlines}
				currentYear={2026}
				declarationSiren={DECLARATION_SIREN}
				declarationYear={DECLARATION_YEAR}
				email="test@example.fr"
			/>,
		);
		expect(
			screen.getByText(/Déclaration des indicateurs de rémunération/),
		).toBeInTheDocument();
		expect(
			screen.getByText("Votre déclaration a été transmise"),
		).toBeInTheDocument();
	});

	it("renders all 3 compliance path options", () => {
		render(
			<CompliancePathChoice
				campaignDeadlines={campaignDeadlines}
				currentYear={2026}
				declarationSiren={DECLARATION_SIREN}
				declarationYear={DECLARATION_YEAR}
				email="test@example.fr"
			/>,
		);
		expect(
			screen.getByText("Justifier les écarts de rémunération ≥ 5 %"),
		).toBeInTheDocument();
		expect(
			screen.getByText("Actions correctives et seconde déclaration"),
		).toBeInTheDocument();
		expect(
			screen.getByText("Évaluation conjointe des rémunérations"),
		).toBeInTheDocument();
	});

	it("disables next button when no path is selected", () => {
		render(
			<CompliancePathChoice
				campaignDeadlines={campaignDeadlines}
				currentYear={2026}
				declarationSiren={DECLARATION_SIREN}
				declarationYear={DECLARATION_YEAR}
				email="test@example.fr"
			/>,
		);
		const nextButton = screen.getByRole("button", { name: /suivant/i });
		expect(nextButton).toBeDisabled();
	});

	it("enables next button after selecting a path", () => {
		render(
			<CompliancePathChoice
				campaignDeadlines={campaignDeadlines}
				currentYear={2026}
				declarationSiren={DECLARATION_SIREN}
				declarationYear={DECLARATION_YEAR}
				email="test@example.fr"
			/>,
		);
		const radio = screen.getByLabelText(
			"Actions correctives et seconde déclaration",
		);
		fireEvent.click(radio);
		const nextButton = screen.getByRole("button", { name: /suivant/i });
		expect(nextButton).not.toBeDisabled();
	});

	it("submits the selected path and navigates to evaluation-conjointe", async () => {
		render(
			<CompliancePathChoice
				campaignDeadlines={campaignDeadlines}
				currentYear={2026}
				declarationSiren={DECLARATION_SIREN}
				declarationYear={DECLARATION_YEAR}
				email="test@example.fr"
			/>,
		);
		const radio = screen.getByLabelText(
			"Évaluation conjointe des rémunérations",
		);
		fireEvent.click(radio);

		const form = screen
			.getByRole("button", { name: /suivant/i })
			.closest("form") as HTMLFormElement;
		fireEvent.submit(form);

		await waitFor(() => {
			expect(mockMutate).toHaveBeenCalledWith({ path: "joint_evaluation" });
		});
		expect(mockPush).toHaveBeenCalledWith(
			"/declaration-remuneration/parcours-conformite/evaluation-conjointe",
		);
	});

	it("navigates to second declaration when corrective_action is selected", async () => {
		render(
			<CompliancePathChoice
				campaignDeadlines={campaignDeadlines}
				currentYear={2026}
				declarationSiren={DECLARATION_SIREN}
				declarationYear={DECLARATION_YEAR}
				email="test@example.fr"
			/>,
		);
		const radio = screen.getByLabelText(
			"Actions correctives et seconde déclaration",
		);
		fireEvent.click(radio);

		const form = screen
			.getByRole("button", { name: /suivant/i })
			.closest("form") as HTMLFormElement;
		fireEvent.submit(form);

		await waitFor(() => {
			expect(mockMutate).toHaveBeenCalledWith({ path: "corrective_action" });
		});
		expect(mockPush).toHaveBeenCalledWith(
			"/declaration-remuneration/parcours-conformite/etape/1",
		);
	});

	it("pre-selects the initial path when provided", () => {
		render(
			<CompliancePathChoice
				campaignDeadlines={campaignDeadlines}
				currentYear={2026}
				declarationSiren={DECLARATION_SIREN}
				declarationYear={DECLARATION_YEAR}
				email="test@example.fr"
				initialPath="corrective_action"
			/>,
		);
		const radio = screen.getByLabelText(
			"Actions correctives et seconde déclaration",
		) as HTMLInputElement;
		expect(radio.checked).toBe(true);
	});

	it("renders isSecondRound options when isSecondRound is set", () => {
		render(
			<CompliancePathChoice
				campaignDeadlines={campaignDeadlines}
				currentYear={2026}
				declarationSiren={DECLARATION_SIREN}
				declarationYear={DECLARATION_YEAR}
				email="test@example.fr"
				isSecondRound={true}
			/>,
		);
		expect(
			screen.getByText("Évaluation conjointe des rémunérations"),
		).toBeInTheDocument();
		expect(
			screen.queryByText("Actions correctives et seconde déclaration"),
		).not.toBeInTheDocument();
	});

	it("renders previous link pointing to step 6", () => {
		render(
			<CompliancePathChoice
				campaignDeadlines={campaignDeadlines}
				currentYear={2026}
				declarationSiren={DECLARATION_SIREN}
				declarationYear={DECLARATION_YEAR}
				email="test@example.fr"
			/>,
		);
		expect(screen.getByRole("link", { name: /précédent/i })).toHaveAttribute(
			"href",
			"/declaration-remuneration/etape/6",
		);
	});

	it("renders the email in the success banner", () => {
		render(
			<CompliancePathChoice
				campaignDeadlines={campaignDeadlines}
				currentYear={2026}
				declarationSiren={DECLARATION_SIREN}
				declarationYear={DECLARATION_YEAR}
				email="john@company.fr"
			/>,
		);
		expect(screen.getByText("john@company.fr")).toBeInTheDocument();
	});

	describe("read-only mode", () => {
		it("renders the read-only info banner when isReadOnly is true", () => {
			render(
				<CompliancePathChoice
					campaignDeadlines={campaignDeadlines}
					currentYear={2026}
					declarationSiren={DECLARATION_SIREN}
					declarationYear={DECLARATION_YEAR}
					email="test@example.fr"
					initialPath="justify"
					isReadOnly
				/>,
			);
			expect(
				screen.getByText(
					/Vous avez déjà choisi votre parcours.*lecture seule/i,
				),
			).toBeInTheDocument();
		});

		it("disables the radio inputs when isReadOnly is true", () => {
			render(
				<CompliancePathChoice
					campaignDeadlines={campaignDeadlines}
					currentYear={2026}
					declarationSiren={DECLARATION_SIREN}
					declarationYear={DECLARATION_YEAR}
					email="test@example.fr"
					initialPath="justify"
					isReadOnly
				/>,
			);
			expect(screen.getByRole("radio", { name: /Justifier/i })).toBeDisabled();
			expect(
				screen.getByRole("radio", { name: /Actions correctives/i }),
			).toBeDisabled();
			expect(
				screen.getByRole("radio", { name: /Évaluation conjointe/i }),
			).toBeDisabled();
		});

		it("disables the next button when isReadOnly is true", () => {
			render(
				<CompliancePathChoice
					campaignDeadlines={campaignDeadlines}
					currentYear={2026}
					declarationSiren={DECLARATION_SIREN}
					declarationYear={DECLARATION_YEAR}
					email="test@example.fr"
					initialPath="justify"
					isReadOnly
				/>,
			);
			expect(screen.getByRole("button", { name: /suivant/i })).toBeDisabled();
		});
	});
});
