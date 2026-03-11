import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CompliancePathChoice } from "../CompliancePathChoice";

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
	},
}));

describe("CompliancePathChoice", () => {
	it("renders the page title and success banner", () => {
		render(<CompliancePathChoice currentYear={2026} email="test@example.fr" />);
		expect(
			screen.getByText(/Déclaration des indicateurs de rémunération/),
		).toBeInTheDocument();
		expect(
			screen.getByText("Votre déclaration a été transmise"),
		).toBeInTheDocument();
	});

	it("renders all 3 compliance path options", () => {
		render(<CompliancePathChoice currentYear={2026} email="test@example.fr" />);
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
		render(<CompliancePathChoice currentYear={2026} email="test@example.fr" />);
		const nextButton = screen.getByRole("button", { name: /suivant/i });
		expect(nextButton).toBeDisabled();
	});

	it("enables next button after selecting a path", () => {
		render(<CompliancePathChoice currentYear={2026} email="test@example.fr" />);
		const radio = screen.getByLabelText(
			"Justifier les écarts de rémunération ≥ 5 %",
		);
		fireEvent.click(radio);
		const nextButton = screen.getByRole("button", { name: /suivant/i });
		expect(nextButton).not.toBeDisabled();
	});

	it("submits the selected path and navigates to /avis-cse", () => {
		render(<CompliancePathChoice currentYear={2026} email="test@example.fr" />);
		const radio = screen.getByLabelText(
			"Évaluation conjointe des rémunérations",
		);
		fireEvent.click(radio);

		const form = screen
			.getByRole("button", { name: /suivant/i })
			.closest("form") as HTMLFormElement;
		fireEvent.submit(form);

		expect(mockMutate).toHaveBeenCalledWith({ path: "joint_evaluation" });
		expect(mockPush).toHaveBeenCalledWith("/avis-cse");
	});

	it("navigates to second declaration when corrective_action is selected", () => {
		render(<CompliancePathChoice currentYear={2026} email="test@example.fr" />);
		const radio = screen.getByLabelText(
			"Actions correctives et seconde déclaration",
		);
		fireEvent.click(radio);

		const form = screen
			.getByRole("button", { name: /suivant/i })
			.closest("form") as HTMLFormElement;
		fireEvent.submit(form);

		expect(mockMutate).toHaveBeenCalledWith({ path: "corrective_action" });
		expect(mockPush).toHaveBeenCalledWith(
			"/declaration-remuneration/parcours-conformite/etape/1",
		);
	});

	it("pre-selects the initial path when provided", () => {
		render(
			<CompliancePathChoice
				currentYear={2026}
				email="test@example.fr"
				initialPath="corrective_action"
			/>,
		);
		const radio = screen.getByLabelText(
			"Actions correctives et seconde déclaration",
		) as HTMLInputElement;
		expect(radio.checked).toBe(true);
	});

	it("disables radio buttons when forcedPath is set", () => {
		render(
			<CompliancePathChoice
				currentYear={2026}
				email="test@example.fr"
				forcedPath="joint_evaluation"
			/>,
		);
		const radios = screen.getAllByRole("radio");
		for (const radio of radios) {
			expect(radio).toBeDisabled();
		}
	});

	it("renders previous link pointing to step 6", () => {
		render(<CompliancePathChoice currentYear={2026} email="test@example.fr" />);
		expect(screen.getByRole("link", { name: /précédent/i })).toHaveAttribute(
			"href",
			"/declaration-remuneration/etape/6",
		);
	});

	it("renders the email in the success banner", () => {
		render(<CompliancePathChoice currentYear={2026} email="john@company.fr" />);
		expect(screen.getByText("john@company.fr")).toBeInTheDocument();
	});
});
