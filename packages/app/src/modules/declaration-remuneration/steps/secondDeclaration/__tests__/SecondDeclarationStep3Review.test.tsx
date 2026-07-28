import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
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
		company: {
			updateHasCse: {
				useMutation: vi.fn().mockReturnValue({
					mutate: vi.fn(),
					isPending: false,
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

const highGapCategories: EmployeeCategoryRow[] = [
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

const noGapCategories: EmployeeCategoryRow[] = [
	makeCategory({
		annualBaseWomen: "9800",
		annualBaseMen: "10000",
	}),
];

// Defaults mirror `isCseOpinionRequired(workforce, null)` → false: an unknown
// CSE flag requires no opinion, exactly like an explicit `false`.
function renderStep3(
	overrides: Partial<ComponentProps<typeof SecondDeclarationStep3Review>> = {},
) {
	return render(
		<SecondDeclarationStep3Review
			cseApplicable
			cseOpinionRequired={false}
			declarationYear={2025}
			hasCse={null}
			secondDeclarationCategories={mockCategories}
			siren="532847196"
			{...overrides}
		/>,
	);
}

async function submitDeclaration() {
	const user = userEvent.setup();
	await user.click(screen.getByRole("button", { name: /soumettre/i }));
	const checkbox = screen.getByLabelText(/Je certifie/, {
		selector: "input",
	});
	await user.click(checkbox);
	const validerButton = screen.getByRole("button", {
		name: /valider/i,
		hidden: true,
	});
	await user.click(validerButton);
}

describe("SecondDeclarationStep3Review", () => {
	beforeEach(() => {
		mockMutate.mockClear();
		mockPush.mockClear();
	});

	it("renders the title and step indicator", () => {
		renderStep3();
		expect(
			screen.getByText(
				/Parcours de mise en conformité pour l.indicateur par catégorie de salariés/,
			),
		).toBeInTheDocument();
		// Non-breaking space keeps "par catégorie" on the same line (Figma spec)
		expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(
			"par\u00A0catégorie",
		);
		expect(screen.getByText("Étape 3 sur 3")).toBeInTheDocument();
	});

	it("renders category gap card with category name", () => {
		renderStep3();
		expect(
			screen.getByText("Catégorie d'emplois n°1 : Ingénieurs"),
		).toBeInTheDocument();
	});

	it("does not bracket the category title", () => {
		renderStep3();
		expect(
			screen.queryByText(/\[Catégorie d.emplois n°1\]/),
		).not.toBeInTheDocument();
	});

	it("renders the card title without the base-and-bonus parenthetical", () => {
		renderStep3();
		expect(
			screen.getByText("Écart de rémunération par catégories de salariés"),
		).toBeInTheDocument();
		expect(
			screen.queryByText(/salaire de base et primes/),
		).not.toBeInTheDocument();
	});

	it("renders gap columns", () => {
		renderStep3();
		expect(screen.getAllByText("Annuelle brute").length).toBeGreaterThanOrEqual(
			1,
		);
		expect(screen.getAllByText("Horaire brute").length).toBeGreaterThanOrEqual(
			1,
		);
	});

	it("renders the next steps section", () => {
		renderStep3();
		expect(screen.getByText("Prochaines étapes")).toBeInTheDocument();
	});

	it("renders the CSE update trigger as a secondary button", () => {
		renderStep3();
		const cseButton = screen.getByRole("button", {
			name: "Mettre à jour l'existence d'un CSE",
		});
		expect(cseButton).toHaveClass("fr-btn", "fr-btn--secondary");
		expect(cseButton).toHaveAttribute("aria-controls", "update-cse-modal");
	});

	it("hides the CSE update trigger when cseApplicable is false", () => {
		renderStep3({ cseApplicable: false });
		expect(
			screen.queryByRole("button", {
				name: "Mettre à jour l'existence d'un CSE",
			}),
		).not.toBeInTheDocument();
	});

	it("renders Soumettre button", () => {
		renderStep3();
		expect(
			screen.getByRole("button", { name: /soumettre/i }),
		).toBeInTheDocument();
	});

	it("renders modal with certification checkbox", () => {
		renderStep3();
		expect(
			screen.getAllByText(/seconde déclaration des écarts de rémunération/)
				.length,
		).toBeGreaterThanOrEqual(1);
		expect(
			screen.getByLabelText(/Je certifie que les données saisies/),
		).toBeInTheDocument();
	});

	it("renders previous link to step 2", () => {
		renderStep3();
		expect(screen.getByRole("link", { name: /précédent/i })).toHaveAttribute(
			"href",
			"/declaration-remuneration/parcours-conformite/etape/2",
		);
	});

	it("shows gap warning when gaps >= 5% exist", () => {
		renderStep3({ secondDeclarationCategories: highGapCategories });
		expect(screen.getByText("Écarts détectés")).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: "Actions à engager" }),
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

		renderStep3({ secondDeclarationCategories: categoriesWithLowGaps });
		expect(screen.queryByText("Écarts détectés")).not.toBeInTheDocument();
		expect(
			screen.queryByRole("heading", { name: "Actions à engager" }),
		).not.toBeInTheDocument();
	});

	it("navigates to compliance path when gaps persist after submit", async () => {
		renderStep3({
			cseOpinionRequired: true,
			hasCse: true,
			secondDeclarationCategories: [
				makeCategory({ annualBaseWomen: "1000", annualBaseMen: "2000" }),
			],
		});

		await submitDeclaration();

		expect(mockMutate).toHaveBeenCalledTimes(1);
		expect(mockPush).toHaveBeenCalledWith(
			"/declaration-remuneration/parcours-conformite",
		);
	});

	it("navigates to avis-cse when no gaps and hasCse is true", async () => {
		renderStep3({
			cseOpinionRequired: true,
			hasCse: true,
			secondDeclarationCategories: noGapCategories,
		});

		await submitDeclaration();

		expect(mockMutate).toHaveBeenCalledTimes(1);
		expect(mockPush).toHaveBeenCalledWith("/avis-cse");
	});

	it("navigates to confirmation when no gaps and no CSE", async () => {
		renderStep3({
			hasCse: false,
			secondDeclarationCategories: noGapCategories,
		});

		await submitDeclaration();

		expect(mockMutate).toHaveBeenCalledTimes(1);
		expect(mockPush).toHaveBeenCalledWith(
			"/declaration-remuneration/parcours-conformite/confirmation",
		);
	});

	it("renders empty state when no categories", () => {
		renderStep3({ secondDeclarationCategories: [] });
		expect(screen.getByText("Aucune donnée renseignée.")).toBeInTheDocument();
	});

	describe("CSE consultation section gating (issue #3945)", () => {
		it("hides the CSE consultation section but keeps gap actions and the CSE update button when cseOpinionRequired is false", () => {
			renderStep3({
				cseOpinionRequired: false,
				hasCse: false,
				secondDeclarationCategories: highGapCategories,
			});

			expect(
				screen.queryByRole("heading", { name: "Informer et consulter le CSE" }),
			).not.toBeInTheDocument();
			expect(
				screen.queryByText(/obligatoirement informer et consulter le CSE/),
			).not.toBeInTheDocument();
			expect(
				screen.queryByText(/avis à transmettre sur le portail/),
			).not.toBeInTheDocument();

			expect(screen.getByText("Écarts détectés")).toBeInTheDocument();
			expect(
				screen.getByRole("heading", { name: "Actions à engager" }),
			).toBeInTheDocument();
			expect(
				screen.getByRole("button", {
					name: "Mettre à jour l'existence d'un CSE",
				}),
			).toBeInTheDocument();
		});

		it("hides the CSE consultation section when the CSE flag is unknown", () => {
			renderStep3({
				cseOpinionRequired: false,
				hasCse: null,
				secondDeclarationCategories: highGapCategories,
			});

			expect(
				screen.queryByRole("heading", { name: "Informer et consulter le CSE" }),
			).not.toBeInTheDocument();
		});

		it("shows the CSE consultation section when cseOpinionRequired is true", () => {
			renderStep3({
				cseOpinionRequired: true,
				hasCse: true,
				secondDeclarationCategories: highGapCategories,
			});

			expect(
				screen.getByRole("heading", { name: "Informer et consulter le CSE" }),
			).toBeInTheDocument();
			expect(
				screen.getByText(/avis à transmettre sur le portail/),
			).toBeInTheDocument();
			expect(
				screen.getByRole("button", {
					name: "Mettre à jour l'existence d'un CSE",
				}),
			).toBeInTheDocument();
		});
	});

	it("closes the modal without submitting when Annuler is clicked", async () => {
		const user = userEvent.setup();
		renderStep3();

		await user.click(screen.getByRole("button", { name: /soumettre/i }));
		const submitDialog = document.getElementById("submit-declaration-modal");
		if (!submitDialog) throw new Error("submit dialog not found");
		const cancelButton = within(submitDialog).getByRole("button", {
			name: /annuler/i,
			hidden: true,
		});
		await user.click(cancelButton);

		expect(mockMutate).not.toHaveBeenCalled();
		expect(mockPush).not.toHaveBeenCalled();
	});
});
