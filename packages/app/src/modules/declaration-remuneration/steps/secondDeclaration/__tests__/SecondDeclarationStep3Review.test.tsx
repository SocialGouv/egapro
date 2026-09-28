import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EmployeeCategoryRow } from "~/modules/declaration-remuneration/types";
import { SecondDeclarationStep3Review } from "../SecondDeclarationStep3Review";

const mockMutate = vi.fn();
const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockReset = vi.fn();
const mockConceal = vi.fn();
type MockSubmissionError = {
	message: string;
	data?: { code: string };
};
const mockMutationState = {
	error: null as MockSubmissionError | null,
	isPending: false,
	networkMode: undefined as string | undefined,
	onError: undefined as ((error: MockSubmissionError) => void) | undefined,
};

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
	usePathname: () => "/declaration-remuneration/parcours-conformite/etape/3",
}));

vi.mock("~/modules/shared", async (importOriginal) => ({
	...(await importOriginal<typeof import("~/modules/shared")>()),
	getDsfrModal: () => ({ disclose: vi.fn(), conceal: mockConceal }),
}));

vi.mock("~/trpc/react", () => ({
	api: {
		declaration: {
			submitSecondDeclaration: {
				useMutation: (opts: {
					networkMode?: string;
					onSuccess?: () => void;
					onError?: (error: MockSubmissionError) => void;
				}) => {
					mockMutationState.networkMode = opts.networkMode;
					mockMutationState.onError = opts.onError;
					return {
						mutate: () => {
							mockMutate();
							if (!mockMutationState.error) opts.onSuccess?.();
						},
						reset: mockReset,
						isPending: mockMutationState.isPending,
						isError: mockMutationState.error !== null,
						error: mockMutationState.error,
					};
				},
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
		hourlyWomenCount: null,
		hourlyMenCount: null,
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

const INITIAL_SUBMISSION_COUNT = 0;

function step3Review(
	overrides: Partial<ComponentProps<typeof SecondDeclarationStep3Review>> = {},
) {
	return (
		<SecondDeclarationStep3Review
			cseApplicable
			cseOpinionRequired={false}
			declarationYear={2025}
			secondDeclarationCategories={mockCategories}
			secondDeclarationSubmissionCount={INITIAL_SUBMISSION_COUNT}
			siren="532847196"
			status="corrective_actions_chosen"
			{...overrides}
		/>
	);
}

function renderStep3(
	overrides: Partial<ComponentProps<typeof SecondDeclarationStep3Review>> = {},
) {
	return render(step3Review(overrides));
}

async function submitDeclaration() {
	const user = userEvent.setup();
	await user.click(screen.getByRole("button", { name: /transmettre/i }));
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
		mockRefresh.mockClear();
		mockReset.mockClear();
		mockConceal.mockClear();
		mockMutationState.error = null;
		mockMutationState.isPending = false;
		mockMutationState.networkMode = undefined;
		mockMutationState.onError = undefined;
		vi.stubGlobal("fetch", vi.fn());
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("renders the title and step indicator", () => {
		renderStep3();
		expect(
			screen.getByText(
				/Parcours de mise en conformité pour l.indicateur par catégories de salariés/,
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

	it("renders Transmettre button", () => {
		renderStep3();
		expect(
			screen.getByRole("button", { name: /transmettre/i }),
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
			secondDeclarationCategories: [
				makeCategory({ annualBaseWomen: "1000", annualBaseMen: "2000" }),
			],
		});

		await submitDeclaration();

		expect(mockMutate).toHaveBeenCalledTimes(1);
		expect(mockPush).toHaveBeenCalledWith(
			"/declaration-remuneration/parcours-conformite",
		);
		expect(mockConceal).toHaveBeenCalledTimes(1);
		expect(mockConceal.mock.invocationCallOrder[0]).toBeLessThan(
			mockPush.mock.invocationCallOrder[0] ?? 0,
		);
	});

	it("shows a submission error inside the confirmation modal", () => {
		mockMutationState.error = {
			message: "Impossible de transmettre.",
			data: { code: "FORBIDDEN" },
		};
		renderStep3();
		const modal = document.getElementById("submit-declaration-modal");
		if (!modal) throw new Error("Submit modal not found");

		expect(
			within(modal).getByRole("alert", { hidden: true }),
		).toHaveTextContent("Impossible de transmettre.");
		expect(mockPush).not.toHaveBeenCalled();
	});

	it("submits with networkMode 'always' so an offline attempt fails fast instead of pausing", () => {
		renderStep3();

		expect(mockMutationState.networkMode).toBe("always");
	});

	it("re-reads the server state when the server rejects the submission", () => {
		renderStep3();

		mockMutationState.onError?.({
			message: "No matching transition",
			data: { code: "INTERNAL_SERVER_ERROR" },
		});

		expect(mockRefresh).toHaveBeenCalledTimes(1);
		expect(fetch).not.toHaveBeenCalled();
		expect(mockPush).not.toHaveBeenCalled();
	});

	it("waits for the server before refreshing after a network failure", async () => {
		vi.useFakeTimers();
		try {
			vi.mocked(fetch)
				.mockRejectedValueOnce(new TypeError("Failed to fetch"))
				.mockResolvedValueOnce(new Response("OK", { status: 200 }));
			renderStep3();

			act(() => mockMutationState.onError?.({ message: "Failed to fetch" }));
			await act(() => vi.advanceTimersByTimeAsync(0));

			expect(fetch).toHaveBeenCalledTimes(1);
			expect(mockRefresh).not.toHaveBeenCalled();

			await act(() => vi.advanceTimersByTimeAsync(1_000));

			expect(mockRefresh).toHaveBeenCalledTimes(1);
		} finally {
			vi.useRealTimers();
		}
	});

	it("completes the submission once the refreshed status shows it went through", () => {
		mockMutationState.error = {
			message:
				'No matching transition for state="awaiting_cse_opinion" action="submit_second_declaration". Facts: {}',
			data: { code: "INTERNAL_SERVER_ERROR" },
		};
		const overrides = {
			cseOpinionRequired: true,
			secondDeclarationCategories: noGapCategories,
		};
		const { rerender } = renderStep3(overrides);
		expect(mockPush).not.toHaveBeenCalled();

		rerender(
			step3Review({
				...overrides,
				secondDeclarationSubmissionCount: INITIAL_SUBMISSION_COUNT + 1,
				status: "awaiting_cse_opinion",
			}),
		);

		expect(mockConceal).toHaveBeenCalledTimes(1);
		expect(mockPush).toHaveBeenCalledWith("/avis-cse");
		expect(mockConceal.mock.invocationCallOrder[0]).toBeLessThan(
			mockPush.mock.invocationCallOrder[0] ?? 0,
		);
	});

	it("keeps the modal mounted while a retry is pending when the refreshed status shows the submission", () => {
		mockMutationState.isPending = true;
		const overrides = {
			cseOpinionRequired: true,
			secondDeclarationCategories: noGapCategories,
		};
		const { rerender } = renderStep3(overrides);

		rerender(
			step3Review({
				...overrides,
				secondDeclarationSubmissionCount: INITIAL_SUBMISSION_COUNT + 1,
				status: "awaiting_cse_opinion",
			}),
		);

		expect(document.getElementById("submit-declaration-modal")).not.toBeNull();
		expect(mockPush).not.toHaveBeenCalled();

		mockMutationState.isPending = false;
		mockMutationState.error = {
			message:
				'No matching transition for state="awaiting_cse_opinion" action="submit_second_declaration". Facts: {}',
			data: { code: "INTERNAL_SERVER_ERROR" },
		};
		rerender(
			step3Review({
				...overrides,
				secondDeclarationSubmissionCount: INITIAL_SUBMISSION_COUNT + 1,
				status: "awaiting_cse_opinion",
			}),
		);

		expect(mockConceal).toHaveBeenCalledTimes(1);
		expect(mockPush).toHaveBeenCalledWith("/avis-cse");
	});

	it("does not mistake a change saved before the submission attempt for a successful submission", async () => {
		const overrides = {
			cseOpinionRequired: true,
			secondDeclarationCategories: highGapCategories,
			status: "awaiting_revision_choice" as const,
		};
		const { rerender } = renderStep3(overrides);
		const savedBeforeSubmit = {
			...overrides,
			secondDeclarationSubmissionCount: INITIAL_SUBMISSION_COUNT + 1,
		};
		rerender(step3Review(savedBeforeSubmit));
		mockMutate.mockImplementationOnce(() => {
			mockMutationState.error = { message: "Failed to fetch" };
		});

		await submitDeclaration();
		rerender(step3Review(savedBeforeSubmit));

		expect(mockMutate).toHaveBeenCalledTimes(1);
		expect(mockPush).not.toHaveBeenCalled();
	});

	it("completes the submission when a persisting gap loops the status back onto itself", () => {
		mockMutationState.error = {
			message:
				'No matching transition for state="awaiting_revision_choice" action="submit_second_declaration". Facts: {}',
			data: { code: "INTERNAL_SERVER_ERROR" },
		};
		const overrides = {
			cseOpinionRequired: true,
			secondDeclarationCategories: highGapCategories,
			status: "awaiting_revision_choice" as const,
		};
		const { rerender } = renderStep3(overrides);
		expect(mockPush).not.toHaveBeenCalled();

		// Same status both times: the self-loop transition only adds a submission event.
		rerender(
			step3Review({
				...overrides,
				secondDeclarationSubmissionCount: INITIAL_SUBMISSION_COUNT + 1,
			}),
		);

		expect(mockConceal).toHaveBeenCalledTimes(1);
		expect(mockPush).toHaveBeenCalledWith(
			"/declaration-remuneration/parcours-conformite",
		);
	});

	it("keeps showing the error and does not navigate when nothing actually changed server-side", () => {
		mockMutationState.error = {
			message: "Impossible de transmettre.",
			data: { code: "FORBIDDEN" },
		};
		const { rerender } = renderStep3();
		expect(mockPush).not.toHaveBeenCalled();

		rerender(step3Review());

		expect(mockPush).not.toHaveBeenCalled();
		expect(mockConceal).not.toHaveBeenCalled();
	});

	it("does not treat a concurrent save as a completed transmission", () => {
		mockMutationState.error = { message: "Failed to fetch" };
		const { rerender } = renderStep3();

		rerender(step3Review({ status: "awaiting_revision_choice" }));

		expect(mockPush).not.toHaveBeenCalled();
		expect(mockConceal).not.toHaveBeenCalled();
	});

	it("keeps a lock refusal visible even if another session submitted", () => {
		mockMutationState.error = {
			message: "Déclaration verrouillée",
			data: { code: "CONFLICT" },
		};
		const { rerender } = renderStep3();

		rerender(step3Review({ secondDeclarationSubmissionCount: 1 }));

		expect(mockPush).not.toHaveBeenCalled();
		expect(mockConceal).not.toHaveBeenCalled();
	});

	it("navigates to compliance path when gaps persist after submit, on a negative gap (#4034)", async () => {
		// Same routing as the +50% case above, but with women earning more than men (-6%):
		// the threshold is symmetric, so a negative gap must persist the compliance path too.
		renderStep3({
			cseOpinionRequired: true,
			secondDeclarationCategories: [
				makeCategory({ annualBaseWomen: "1060", annualBaseMen: "1000" }),
			],
		});

		await submitDeclaration();

		expect(mockMutate).toHaveBeenCalledTimes(1);
		expect(mockPush).toHaveBeenCalledWith(
			"/declaration-remuneration/parcours-conformite",
		);
	});

	it("navigates to avis-cse when no gaps remain and a CSE opinion is due", async () => {
		renderStep3({
			cseOpinionRequired: true,
			secondDeclarationCategories: noGapCategories,
		});

		await submitDeclaration();

		expect(mockMutate).toHaveBeenCalledTimes(1);
		expect(mockPush).toHaveBeenCalledWith("/avis-cse");
	});

	it("navigates to confirmation when no gaps remain and no CSE opinion is due", async () => {
		renderStep3({
			cseOpinionRequired: false,
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

	it("keeps Transmettre while the second declaration is still writable", () => {
		renderStep3();
		expect(
			screen.getByRole("button", { name: /transmettre/i }),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("link", { name: /suivant/i }),
		).not.toBeInTheDocument();
	});

	it("renders Suivant to the joint evaluation when the revision path is already chosen", () => {
		renderStep3({ status: "revised_joint_evaluation_chosen" });
		expect(screen.getByRole("link", { name: /suivant/i })).toHaveAttribute(
			"href",
			"/declaration-remuneration/parcours-conformite/evaluation-conjointe",
		);
		expect(
			screen.queryByRole("button", { name: /transmettre/i }),
		).not.toBeInTheDocument();
	});

	it("keeps Transmettre while awaiting a revision choice", () => {
		renderStep3({ status: "awaiting_revision_choice" });
		expect(
			screen.getByRole("button", { name: /transmettre/i }),
		).toBeInTheDocument();
	});

	describe("CSE consultation section gating (issue #3945)", () => {
		it("hides the CSE consultation section but keeps gap actions and the CSE update button when cseOpinionRequired is false", () => {
			renderStep3({
				cseOpinionRequired: false,
				secondDeclarationCategories: highGapCategories,
			});

			expect(
				screen.queryByRole("heading", { name: "Informer et consulter le CSE" }),
			).not.toBeInTheDocument();
			expect(
				screen.queryByText(/obligatoirement informer et consulter le CSE/),
			).not.toBeInTheDocument();
			expect(
				screen.queryByText(/avis à transmettre lors de la dernière étape/),
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

		it("shows the CSE consultation section and renders the joint evaluation bullet without the 'Soit' prefix when cseOpinionRequired is true", () => {
			renderStep3({
				cseOpinionRequired: true,
				secondDeclarationCategories: highGapCategories,
			});

			expect(
				screen.getByRole("heading", { name: "Informer et consulter le CSE" }),
			).toBeInTheDocument();
			expect(
				screen.getByText(/avis à transmettre lors de la dernière étape/),
			).toBeInTheDocument();
			expect(
				screen.getByRole("button", {
					name: "Mettre à jour l'existence d'un CSE",
				}),
			).toBeInTheDocument();

			expect(
				screen.getByText(/À la suite de l'analyse de vos données/),
			).toBeInTheDocument();
			expect(
				screen.getByText(
					/vous devez informer et consulter le CSE sur cette justification/,
				),
			).toBeInTheDocument();

			expect(
				screen.getByText("Réaliser une évaluation conjointe des rémunérations"),
			).toBeInTheDocument();
			expect(
				screen.queryByText(/Soit réaliser une évaluation conjointe/),
			).not.toBeInTheDocument();
			expect(
				screen.queryByText(/mettre en place des actions correctives/),
			).not.toBeInTheDocument();
		});
	});

	describe("second declaration wording (issue #4214)", () => {
		it("states that gaps were identified again and that the remaining action is mandatory", () => {
			renderStep3({ secondDeclarationCategories: highGapCategories });

			expect(
				screen.getByText(/des écarts ≥ 5 % ont encore été identifiés/),
			).toBeInTheDocument();
			expect(
				screen.queryByText(/des écarts ≥ 5 % ont été identifiés/),
			).not.toBeInTheDocument();

			expect(screen.getByText(/vous devez :/)).toBeInTheDocument();
			expect(screen.queryByText(/vous pouvez :/)).not.toBeInTheDocument();
		});

		it("keeps the mandatory wording when the CSE consultation section is shown", () => {
			renderStep3({
				cseOpinionRequired: true,
				secondDeclarationCategories: highGapCategories,
			});

			expect(
				screen.getByText(/des écarts ≥ 5 % ont encore été identifiés/),
			).toBeInTheDocument();
			expect(screen.getByText(/vous devez :/)).toBeInTheDocument();
			expect(screen.queryByText(/vous pouvez :/)).not.toBeInTheDocument();
		});
	});

	it("neutralises the top margin of the form actions (issue #4141)", () => {
		renderStep3();

		expect(
			screen.getByRole("button", { name: /transmettre/i }).parentElement
				?.parentElement,
		).toHaveClass("fr-mt-0");
	});

	it("closes the modal without submitting when Annuler is clicked", async () => {
		const user = userEvent.setup();
		renderStep3();

		await user.click(screen.getByRole("button", { name: /transmettre/i }));
		const submitDialog = document.getElementById("submit-declaration-modal");
		if (!submitDialog) throw new Error("submit dialog not found");
		const cancelButton = within(submitDialog).getByRole("button", {
			name: /annuler/i,
			hidden: true,
		});
		await user.click(cancelButton);

		expect(mockReset).toHaveBeenCalledTimes(1);
		expect(mockMutate).not.toHaveBeenCalled();
		expect(mockPush).not.toHaveBeenCalled();
	});
});
