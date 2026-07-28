import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LockProvider } from "~/modules/declaration-remuneration/shared/lock/LockContext";
import { getDefaultCampaignDeadlines } from "~/modules/domain";
import { CompliancePathChoice } from "../CompliancePathChoice";

const campaignDeadlines = getDefaultCampaignDeadlines(2026);

const DECLARATION_SIREN = "123456789";
const DECLARATION_YEAR = 2026;

const mockMutate = vi.fn();
const mockPush = vi.fn();

const { mockSetField, draftRef } = vi.hoisted(() => ({
	mockSetField: vi.fn(),
	draftRef: { current: {} as Record<string, unknown> },
}));

vi.mock(
	"~/modules/declaration-remuneration/shared/draft/useDeclarationDraft",
	() => ({
		useDeclarationDraft: () => ({
			draft: draftRef.current,
			setField: mockSetField,
			clearDraft: vi.fn(),
			hasDraft: false,
			isLoadingDraft: false,
			isSaving: false,
			isPendingSave: false,
		}),
	}),
);

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

function compliancePathChoice(
	overrides: Partial<ComponentProps<typeof CompliancePathChoice>> = {},
) {
	return (
		<CompliancePathChoice
			campaignDeadlines={campaignDeadlines}
			cseOpinionRequired={true}
			currentYear={2026}
			declarationSiren={DECLARATION_SIREN}
			declarationYear={DECLARATION_YEAR}
			email="test@example.fr"
			hasCse={true}
			{...overrides}
		/>
	);
}

beforeEach(() => {
	mockMutate.mockClear();
	mockPush.mockClear();
	mockSetField.mockClear();
	draftRef.current = {};
});

describe("CompliancePathChoice", () => {
	it("renders the page title and success banner", () => {
		render(compliancePathChoice());
		expect(
			screen.getByText(/Déclaration des indicateurs de rémunération/),
		).toBeInTheDocument();
		expect(
			screen.getByText("Votre déclaration a été transmise"),
		).toBeInTheDocument();
	});

	it("names the read-only fieldset with a screen-reader-only legend (RGAA 11.6/11.7)", () => {
		render(compliancePathChoice());
		expect(
			screen.getByRole("group", { name: "Choix du parcours de conformité" }),
		).toBeInTheDocument();
	});

	it("renders all 3 compliance path options", () => {
		render(compliancePathChoice());
		expect(
			screen.getByText("Justifier les écarts de rémunération ≥ 5 %"),
		).toBeInTheDocument();
		expect(
			screen.getByText("Actions correctives et seconde déclaration"),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				"Mettre en place une évaluation conjointe des rémunérations",
			),
		).toBeInTheDocument();
	});

	it("disables next button when no path is selected", () => {
		render(compliancePathChoice());
		const nextButton = screen.getByRole("button", { name: /suivant/i });
		expect(nextButton).toBeDisabled();
	});

	it("enables next button after selecting a path", () => {
		render(compliancePathChoice());
		const radio = screen.getByLabelText(
			"Actions correctives et seconde déclaration",
		);
		fireEvent.click(radio);
		const nextButton = screen.getByRole("button", { name: /suivant/i });
		expect(nextButton).not.toBeDisabled();
	});

	it("submits the selected path and navigates to evaluation-conjointe", async () => {
		render(compliancePathChoice());
		const radio = screen.getByLabelText(
			"Mettre en place une évaluation conjointe des rémunérations",
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
		render(compliancePathChoice());
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

	it("does not submit when no path is selected", () => {
		render(compliancePathChoice());

		const form = screen
			.getByRole("button", { name: /suivant/i })
			.closest("form") as HTMLFormElement;
		fireEvent.submit(form);

		expect(mockMutate).not.toHaveBeenCalled();
		expect(mockPush).not.toHaveBeenCalled();
	});

	it("submits justify and navigates to the CSE opinion page", async () => {
		render(compliancePathChoice());
		const radio = screen.getByLabelText(
			"Justifier les écarts de rémunération ≥ 5 %",
		);
		fireEvent.click(radio);

		const form = screen
			.getByRole("button", { name: /suivant/i })
			.closest("form") as HTMLFormElement;
		fireEvent.submit(form);

		await waitFor(() => {
			expect(mockMutate).toHaveBeenCalledWith({ path: "justify" });
		});
		expect(mockPush).toHaveBeenCalledWith("/avis-cse");
	});

	it("submits justify and navigates to the confirmation page without a CSE", async () => {
		render(compliancePathChoice({ cseOpinionRequired: false, hasCse: false }));
		const radio = screen.getByLabelText(
			"Justifier les écarts de rémunération ≥ 5 %",
		);
		fireEvent.click(radio);

		const form = screen
			.getByRole("button", { name: /suivant/i })
			.closest("form") as HTMLFormElement;
		fireEvent.submit(form);

		await waitFor(() => {
			expect(mockMutate).toHaveBeenCalledWith({ path: "justify" });
		});
		expect(mockPush).toHaveBeenCalledWith(
			"/declaration-remuneration/parcours-conformite/confirmation",
		);
	});

	it("pre-selects the initial path when provided", () => {
		render(compliancePathChoice({ initialPath: "corrective_action" }));
		const radio = screen.getByLabelText(
			"Actions correctives et seconde déclaration",
		) as HTMLInputElement;
		expect(radio.checked).toBe(true);
	});

	it("renders isSecondRound options when isSecondRound is set", () => {
		render(compliancePathChoice({ isSecondRound: true }));
		expect(
			screen.getByText(
				"Mettre en place une évaluation conjointe des rémunérations",
			),
		).toBeInTheDocument();
		expect(
			screen.queryByText("Actions correctives et seconde déclaration"),
		).not.toBeInTheDocument();
	});

	it("renders the first-round instruction phrase by default", () => {
		render(compliancePathChoice());
		expect(
			screen.getByText(/Des écarts ≥ 5 % ont été constatés/),
		).toBeInTheDocument();
		expect(
			screen.queryByText(/ont de nouveau été détectés/),
		).not.toBeInTheDocument();
	});

	it("renders the second-round instruction phrase and intermediate heading", () => {
		render(compliancePathChoice({ isSecondRound: true }));
		expect(
			screen.getByText(/Des écarts ≥ 5 % ont de nouveau été détectés/),
		).toBeInTheDocument();
		// Section headings sit at level 2 (the page h1 is the funnel title); the
		// redundant "Parcours de mise en conformité" subtitle is not rendered, so
		// the hierarchy must not skip from h1 to h3.
		expect(
			screen.getByRole("heading", {
				level: 2,
				name: "Si la justification n'est pas possible par des critères objectifs et non sexistes",
			}),
		).toBeInTheDocument();
	});

	it("uses the funnel title as h1 and keeps section headings at level 2", () => {
		render(compliancePathChoice());
		expect(
			screen.getByRole("heading", {
				level: 1,
				name: /Déclaration des indicateurs/,
			}),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", {
				level: 2,
				name: "La justification est possible par des critères objectifs et non sexistes",
			}),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("heading", { name: /Parcours de mise en conformité/ }),
		).not.toBeInTheDocument();
	});

	it("renders the path choice deadline highlight block", () => {
		render(compliancePathChoice());
		expect(
			screen.getByText(
				"Date limite pour choisir un parcours de mise en conformité",
			),
		).toBeInTheDocument();
		expect(screen.getByText("1 janvier 2027")).toBeInTheDocument();
	});

	it("renders previous link pointing to step 6", () => {
		render(compliancePathChoice());
		expect(screen.getByRole("link", { name: /précédent/i })).toHaveAttribute(
			"href",
			"/declaration-remuneration/etape/6",
		);
	});

	it("renders the email in the success banner", () => {
		render(compliancePathChoice({ email: "john@company.fr" }));
		expect(screen.getByText("john@company.fr")).toBeInTheDocument();
	});

	describe("CSE consultation items gating (issue #3945)", () => {
		it.each([
			false,
			true,
		])("shows the justify CSE consultation items when a CSE opinion is required (isSecondRound: %s)", (isSecondRound) => {
			render(compliancePathChoice({ cseOpinionRequired: true, isSecondRound }));

			expect(
				screen.getByText(
					"Informer et consulter votre CSE sur cette justification",
				),
			).toBeInTheDocument();
			expect(screen.getByText("Transmettre l'avis du CSE")).toBeInTheDocument();
		});

		it.each([
			false,
			true,
		])("hides the justify CSE consultation items when no CSE opinion is required (isSecondRound: %s)", (isSecondRound) => {
			render(
				compliancePathChoice({
					cseOpinionRequired: false,
					hasCse: false,
					isSecondRound,
				}),
			);

			expect(
				screen.queryByText(
					"Informer et consulter votre CSE sur cette justification",
				),
			).not.toBeInTheDocument();
			expect(
				screen.queryByText("Transmettre l'avis du CSE"),
			).not.toBeInTheDocument();
		});

		it("shows the corrective-action CSE consultation items when a CSE opinion is required", () => {
			render(compliancePathChoice({ cseOpinionRequired: true }));

			expect(
				screen.getByText(/Informer et consulter votre CSE sur l'exactitude/),
			).toBeInTheDocument();
			expect(
				screen.getByText("Transmettre l'avis ou les avis du CSE"),
			).toBeInTheDocument();
		});

		it("hides the corrective-action CSE consultation items when no CSE opinion is required", () => {
			render(
				compliancePathChoice({ cseOpinionRequired: false, hasCse: false }),
			);

			expect(
				screen.queryByText(/Informer et consulter votre CSE sur l'exactitude/),
			).not.toBeInTheDocument();
			expect(
				screen.queryByText("Transmettre l'avis ou les avis du CSE"),
			).not.toBeInTheDocument();
		});

		it("keeps the non-CSE corrective-action items when no CSE opinion is required", () => {
			render(
				compliancePathChoice({ cseOpinionRequired: false, hasCse: false }),
			);

			expect(
				screen.getByText(
					"Mettre en place des actions correctives par accord ou par plan d'action",
				),
			).toBeInTheDocument();
			expect(
				screen.getByText(
					"Redéclarer l'indicateur dans un délai de 6 mois après votre première déclaration",
				),
			).toBeInTheDocument();
		});
	});

	describe("draft autosave", () => {
		it("hydrates the selected path from a persisted draft", () => {
			draftRef.current = { path: "joint_evaluation" };

			render(compliancePathChoice());

			const radio = screen.getByLabelText(
				"Mettre en place une évaluation conjointe des rémunérations",
			) as HTMLInputElement;
			expect(radio.checked).toBe(true);
		});

		it("saves a draft when a path is selected and the lock is inactive", async () => {
			render(compliancePathChoice());

			fireEvent.click(
				screen.getByLabelText("Actions correctives et seconde déclaration"),
			);

			await waitFor(() => {
				expect(mockSetField).toHaveBeenCalledWith({
					path: "corrective_action",
				});
			});
		});

		it("does not save a draft when the declaration is locked read-only", async () => {
			render(<LockProvider isReadOnly>{compliancePathChoice()}</LockProvider>);

			const radio = screen.getByLabelText(
				"Actions correctives et seconde déclaration",
			);
			fireEvent.click(radio);
			fireEvent.change(radio, { target: { checked: true } });

			expect(mockSetField).not.toHaveBeenCalled();
		});

		it("disables each control while keeping the fieldset enabled when the declaration is locked read-only", () => {
			const { container } = render(
				<LockProvider isReadOnly>{compliancePathChoice()}</LockProvider>,
			);

			// The outermost fieldset stays enabled so its content remains exposed
			// to assistive technologies; each control is disabled individually.
			expect(container.querySelector("fieldset")).not.toBeDisabled();
			expect(
				screen.getByLabelText("Actions correctives et seconde déclaration"),
			).toBeDisabled();
			expect(screen.getByRole("button", { name: /suivant/i })).toBeDisabled();
		});
	});
});

describe("CompliancePathChoice read-only mode", () => {
	it("renders the read-only alert and disables the radios", () => {
		render(
			compliancePathChoice({
				initialPath: "justify",
				readOnlyReason: "cse_opinion_submitted",
			}),
		);
		expect(
			screen.getByText(/L'avis du CSE a déjà été transmis/),
		).toBeInTheDocument();
		expect(
			screen.getByLabelText("Justifier les écarts de rémunération ≥ 5 %"),
		).toBeDisabled();
	});

	it("renders Suivant as a navigation link instead of a submit button", () => {
		render(
			compliancePathChoice({
				initialPath: "justify",
				readOnlyReason: "cse_opinion_submitted",
			}),
		);
		expect(screen.getByRole("link", { name: /suivant/i })).toHaveAttribute(
			"href",
			"/avis-cse",
		);
		expect(
			screen.queryByRole("button", { name: /suivant/i }),
		).not.toBeInTheDocument();
	});

	it("does not call the save mutation when the read-only form is submitted", async () => {
		render(
			compliancePathChoice({
				initialPath: "justify",
				readOnlyReason: "cse_opinion_submitted",
			}),
		);
		const form = screen
			.getByRole("link", { name: /suivant/i })
			.closest("form") as HTMLFormElement;
		await act(async () => {
			fireEvent.submit(form);
		});
		expect(mockMutate).not.toHaveBeenCalled();
	});
});
