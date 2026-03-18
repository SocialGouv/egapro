import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EmployeeCategoryRow } from "~/modules/declaration-remuneration/types";
import { SecondDeclarationStep3Review } from "../SecondDeclarationStep3Review";

const mockMutate = vi.fn();
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: mockPush }),
	usePathname: () => "/declaration-remuneration/parcours-conformite/etape/3",
}));

vi.mock("~/trpc/react", () => ({
	api: {
		declaration: {
			submitSecondDeclaration: {
				useMutation: (opts: { onSuccess?: () => void }) => ({
					mutate: () => {
						mockMutate();
						opts.onSuccess?.();
					},
					isPending: false,
					error: null,
				}),
			},
		},
	},
}));

function makeCategory(
	overrides: Partial<EmployeeCategoryRow> = {},
): EmployeeCategoryRow {
	return {
		name: "",
		detail: "",
		womenCount: null,
		menCount: null,
		annualBaseWomen: null,
		annualBaseMen: null,
		annualVariableWomen: null,
		annualVariableMen: null,
		hourlyBaseWomen: null,
		hourlyBaseMen: null,
		hourlyVariableWomen: null,
		hourlyVariableMen: null,
		...overrides,
	};
}

const mockCategories: EmployeeCategoryRow[] = [
	makeCategory({
		name: "Ingénieurs",
		detail: "Dev",
		womenCount: 10,
		menCount: 15,
		annualBaseWomen: "3000",
		annualBaseMen: "3200",
		annualVariableWomen: "500",
		annualVariableMen: "600",
		hourlyBaseWomen: "18",
		hourlyBaseMen: "19",
		hourlyVariableWomen: "3",
		hourlyVariableMen: "4",
	}),
];

describe("SecondDeclarationStep3Review", () => {
	beforeEach(() => {
		mockMutate.mockClear();
		mockPush.mockClear();
	});

	it("renders the title and step indicator", () => {
		render(
			<SecondDeclarationStep3Review
				hasCse={null}
				secondDeclarationCategories={mockCategories}
			/>,
		);
		expect(
			screen.getByText(
				/Parcours de mise en conformité pour l.indicateur par catégorie de salariés/,
			),
		).toBeInTheDocument();
		expect(screen.getByText("Étape 3 sur 3")).toBeInTheDocument();
	});

	it("renders category gap card with category name", () => {
		render(
			<SecondDeclarationStep3Review
				hasCse={null}
				secondDeclarationCategories={mockCategories}
			/>,
		);
		expect(screen.getByText(/Catégorie d.emplois n°1/)).toBeInTheDocument();
	});

	it("renders gap columns", () => {
		render(
			<SecondDeclarationStep3Review
				hasCse={null}
				secondDeclarationCategories={mockCategories}
			/>,
		);
		expect(screen.getAllByText("Annuelle brute").length).toBeGreaterThanOrEqual(
			1,
		);
		expect(screen.getAllByText("Horaire brute").length).toBeGreaterThanOrEqual(
			1,
		);
	});

	it("renders the next steps section", () => {
		render(
			<SecondDeclarationStep3Review
				hasCse={null}
				secondDeclarationCategories={mockCategories}
			/>,
		);
		expect(screen.getByText("Prochaines étapes")).toBeInTheDocument();
	});

	it("renders certification checkbox", () => {
		render(
			<SecondDeclarationStep3Review
				hasCse={null}
				secondDeclarationCategories={mockCategories}
			/>,
		);
		expect(
			screen.getByLabelText(/Je certifie que les données saisies/),
		).toBeInTheDocument();
	});

	it("disables submit button when not certified", () => {
		render(
			<SecondDeclarationStep3Review
				hasCse={null}
				secondDeclarationCategories={mockCategories}
			/>,
		);
		const submitButton = screen.getByRole("button", { name: /soumettre/i });
		expect(submitButton).toBeDisabled();
	});

	it("enables submit button when certified", async () => {
		const user = userEvent.setup();
		render(
			<SecondDeclarationStep3Review
				hasCse={null}
				secondDeclarationCategories={mockCategories}
			/>,
		);
		const checkbox = screen.getByLabelText(
			/Je certifie que les données saisies/,
		);
		await user.click(checkbox);
		const submitButton = screen.getByRole("button", { name: /soumettre/i });
		expect(submitButton).not.toBeDisabled();
	});

	it("renders previous link to step 2", () => {
		render(
			<SecondDeclarationStep3Review
				hasCse={null}
				secondDeclarationCategories={mockCategories}
			/>,
		);
		expect(screen.getByRole("link", { name: /précédent/i })).toHaveAttribute(
			"href",
			"/declaration-remuneration/parcours-conformite/etape/2",
		);
	});

	it("shows gap warning when gaps >= 5% exist", () => {
		const categoriesWithHighGaps: EmployeeCategoryRow[] = [
			makeCategory({
				name: "Ouvriers",
				womenCount: 10,
				menCount: 15,
				annualBaseWomen: "1000",
				annualBaseMen: "2000",
				annualVariableWomen: "100",
				annualVariableMen: "200",
				hourlyBaseWomen: "10",
				hourlyBaseMen: "20",
				hourlyVariableWomen: "1",
				hourlyVariableMen: "2",
			}),
		];

		render(
			<SecondDeclarationStep3Review
				hasCse={null}
				secondDeclarationCategories={categoriesWithHighGaps}
			/>,
		);
		expect(
			screen.getByText("Des écarts ont été de nouveau détectés"),
		).toBeInTheDocument();
	});

	it("does not show gap warning when all gaps < 5%", () => {
		const categoriesWithLowGaps: EmployeeCategoryRow[] = [
			makeCategory({
				name: "Ouvriers",
				womenCount: 10,
				menCount: 15,
				annualBaseWomen: "9800",
				annualBaseMen: "10000",
				annualVariableWomen: "980",
				annualVariableMen: "1000",
				hourlyBaseWomen: "98",
				hourlyBaseMen: "100",
				hourlyVariableWomen: "9.8",
				hourlyVariableMen: "10",
			}),
		];

		render(
			<SecondDeclarationStep3Review
				hasCse={null}
				secondDeclarationCategories={categoriesWithLowGaps}
			/>,
		);
		expect(
			screen.queryByText("Des écarts ont été de nouveau détectés"),
		).not.toBeInTheDocument();
	});

	it("navigates to compliance path when gaps persist after submit", async () => {
		const user = userEvent.setup();
		const categoriesWithHighGaps: EmployeeCategoryRow[] = [
			makeCategory({
				annualBaseWomen: "1000",
				annualBaseMen: "2000",
			}),
		];

		render(
			<SecondDeclarationStep3Review
				hasCse={true}
				secondDeclarationCategories={categoriesWithHighGaps}
			/>,
		);

		await user.click(screen.getByLabelText(/Je certifie/));
		await user.click(screen.getByRole("button", { name: /soumettre/i }));

		expect(mockMutate).toHaveBeenCalledTimes(1);
		expect(mockPush).toHaveBeenCalledWith(
			"/declaration-remuneration/parcours-conformite",
		);
	});

	it("navigates to avis-cse when no gaps and hasCse is true", async () => {
		const user = userEvent.setup();
		const categoriesNoGaps: EmployeeCategoryRow[] = [
			makeCategory({
				annualBaseWomen: "9800",
				annualBaseMen: "10000",
			}),
		];

		render(
			<SecondDeclarationStep3Review
				hasCse={true}
				secondDeclarationCategories={categoriesNoGaps}
			/>,
		);

		await user.click(screen.getByLabelText(/Je certifie/));
		await user.click(screen.getByRole("button", { name: /soumettre/i }));

		expect(mockMutate).toHaveBeenCalledTimes(1);
		expect(mockPush).toHaveBeenCalledWith("/avis-cse");
	});

	it("navigates to confirmation when no gaps and no CSE", async () => {
		const user = userEvent.setup();
		const categoriesNoGaps: EmployeeCategoryRow[] = [
			makeCategory({
				annualBaseWomen: "9800",
				annualBaseMen: "10000",
			}),
		];

		render(
			<SecondDeclarationStep3Review
				hasCse={false}
				secondDeclarationCategories={categoriesNoGaps}
			/>,
		);

		await user.click(screen.getByLabelText(/Je certifie/));
		await user.click(screen.getByRole("button", { name: /soumettre/i }));

		expect(mockMutate).toHaveBeenCalledTimes(1);
		expect(mockPush).toHaveBeenCalledWith(
			"/declaration-remuneration/parcours-conformite/confirmation",
		);
	});

	it("renders empty state when no categories", () => {
		render(
			<SecondDeclarationStep3Review
				hasCse={null}
				secondDeclarationCategories={[]}
			/>,
		);
		expect(screen.getByText("Aucune donnée renseignée.")).toBeInTheDocument();
	});
});
