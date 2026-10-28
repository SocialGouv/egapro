import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSession } from "next-auth/react";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LockProvider } from "~/modules/declaration-remuneration/shared/lock/LockContext";
import { Step1Opinions } from "../Step1Opinions";
import type { CseOpinionStep1Data } from "../types";

const mockedUseSession = vi.mocked(useSession);

function mockImpersonating() {
	mockedUseSession.mockReturnValue({
		data: {
			user: {
				id: "admin-1",
				impersonation: { siren: "123456789", name: "Acme" },
			},
			expires: "2099-01-01",
		},
		status: "authenticated",
	} as unknown as ReturnType<typeof useSession>);
}

const { mockSetField, mockClearDraft, mockUseDeclarationDraft } = vi.hoisted(
	() => {
		const mockSetField = vi.fn();
		const mockClearDraft = vi.fn();
		const mockUseDeclarationDraft = vi.fn(() => ({
			draft: {} as Record<string, unknown>,
			setField: mockSetField,
			clearDraft: mockClearDraft,
			hasDraft: false,
			isLoadingDraft: false,
			isSaving: false,
			isPendingSave: false,
		}));
		return { mockSetField, mockClearDraft, mockUseDeclarationDraft };
	},
);

vi.mock(
	"~/modules/declaration-remuneration/shared/draft/useDeclarationDraft",
	() => ({ useDeclarationDraft: mockUseDeclarationDraft }),
);

const mockPush = vi.fn();
const cseDeadline = new Date("2028-02-01T00:00:00Z");

vi.mock("next/navigation", async () => ({
	...(await vi.importActual("next/navigation")),
	useRouter: () => ({
		push: mockPush,
		replace: vi.fn(),
		back: vi.fn(),
		refresh: vi.fn(),
	}),
}));

const mockMutate = vi.fn();

vi.mock("~/trpc/react", () => ({
	api: {
		cseOpinion: {
			saveOpinions: {
				useMutation: (opts: { onSuccess?: () => void }) => {
					mockMutate.mockImplementation(() => opts.onSuccess?.());
					return {
						mutate: mockMutate,
						isPending: false,
						error: null,
					};
				},
			},
		},
		mail: {
			resendReceipt: {
				useMutation: () => ({ mutate: vi.fn(), isPending: false }),
			},
		},
	},
}));

type DeclarationDraft = {
	accuracyOpinion?: string;
	accuracyDate?: string;
	gapOpinion?: string | null;
	gapDate?: string;
};

type SavedDraft = {
	firstDeclaration?: DeclarationDraft;
	secondDeclaration?: DeclarationDraft;
};

function lastSavedDraft(): SavedDraft | undefined {
	return mockSetField.mock.calls.at(-1)?.[0] as SavedDraft | undefined;
}

function lastFirstDeclaration() {
	return lastSavedDraft()?.firstDeclaration;
}

function lastSecondDeclaration() {
	return lastSavedDraft()?.secondDeclaration;
}

beforeEach(() => {
	mockPush.mockClear();
	mockMutate.mockClear();
	mockSetField.mockClear();
	mockClearDraft.mockClear();
	mockUseDeclarationDraft.mockReturnValue({
		draft: {},
		setField: mockSetField,
		clearDraft: mockClearDraft,
		hasDraft: false,
		isLoadingDraft: false,
		isSaving: false,
		isPendingSave: false,
	});
});

const ACCURACY_1_TITLE =
	"Exactitude des données utilisées pour le calcul, la méthode de calcul et les résultats de chaque indicateur.";
const ACCURACY_2_TITLE =
	"Exactitude des données utilisées pour le calcul, la méthode de calcul et les résultats de la seconde déclaration de l'indicateur par catégorie d'emplois.";
const JUSTIFICATION_TITLE =
	"Justification des écarts ≥ 5 % par des critères objectifs et non fondés sur le sexe de l'indicateur par catégorie d'emplois.";
const COMPLIANCE_TITLE =
	"Parcours de mise en conformité pour l'indicateur par catégorie d'emplois";
const PAGE_TITLE = "Transmission du ou des avis du CSE";

const JOINT_EVALUATION_BANNER = {
	variant: "joint_evaluation",
	depositModifiable: false,
} as const;
const SECOND_DECLARATION_BANNER = {
	variant: "second_declaration",
	depositModifiable: false,
} as const;

const SAVED_OPINIONS: CseOpinionStep1Data = {
	firstDeclAccuracyOpinion: "favorable",
	firstDeclAccuracyDate: "2026-01-15",
	firstDeclGapOpinion: "unfavorable",
	firstDeclGapDate: "2026-01-16",
	secondDeclAccuracyOpinion: "favorable",
	secondDeclAccuracyDate: "2026-02-15",
	secondDeclGapOpinion: "favorable",
	secondDeclGapDate: "2026-02-16",
};

type StepProps = Partial<ComponentProps<typeof Step1Opinions>>;

function step1(props: StepProps = {}) {
	return (
		<Step1Opinions
			cseDeadline={cseDeadline}
			firstDeclJustificationRequired={false}
			hasSecondDeclaration={false}
			secondDeclJustificationRequired={false}
			siren="123456789"
			year={2026}
			{...props}
		/>
	);
}

function renderStep1(props: StepProps = {}) {
	return render(step1(props));
}

function cardOf(id: string) {
	const card = document.getElementById(`${id}-legend`)?.parentElement;
	if (!card) throw new Error(`card ${id} not rendered`);
	return card;
}

async function answerCard(
	user: ReturnType<typeof userEvent.setup>,
	id: string,
	opinion: "Favorable" | "Défavorable",
	date: string,
) {
	const card = cardOf(id);
	await user.click(within(card).getByLabelText(opinion));
	const dateInput = card.querySelector(`#${id}-date`) as HTMLInputElement;
	await user.clear(dateInput);
	await user.type(dateInput, date);
}

describe("Step1Opinions", () => {
	it("disables browser autofill on the form", () => {
		const { container } = renderStep1();

		expect(container.querySelector("form")).toHaveAttribute(
			"autocomplete",
			"off",
		);
	});

	it("names the read-only fieldset with a screen-reader-only legend (RGAA 11.6/11.7)", () => {
		renderStep1();

		expect(
			screen.getByRole("group", { name: "Avis du CSE" }),
		).toBeInTheDocument();
	});

	describe("parcours headers", () => {
		it.each([
			["1", false],
			["2", true],
		])("titles case %s with the CSE transmission and shows no banner", (_case, justification) => {
			renderStep1({ firstDeclJustificationRequired: justification });

			expect(
				screen.getByRole("heading", { level: 1, name: PAGE_TITLE }),
			).toBeInTheDocument();
			expect(
				screen.queryByRole("heading", { name: COMPLIANCE_TITLE }),
			).not.toBeInTheDocument();
			expect(screen.queryByText(/a été transmise/)).not.toBeInTheDocument();
		});

		it("lays out case 3 as compliance title, joint evaluation banner, CSE title, then both cards", () => {
			renderStep1({
				banner: JOINT_EVALUATION_BANNER,
				firstDeclJustificationRequired: true,
			});

			const h1 = screen.getByRole("heading", {
				level: 1,
				name: COMPLIANCE_TITLE,
			});
			const banner = screen.getByText(
				"Votre évaluation conjointe des rémunérations a été transmise",
			);
			const h2 = screen.getByRole("heading", { level: 2, name: PAGE_TITLE });
			const accuracy = screen.getByText(ACCURACY_1_TITLE);
			const justification = screen.getByText(JUSTIFICATION_TITLE);
			const order = [h1, banner, h2, accuracy, justification];
			for (let index = 1; index < order.length; index++) {
				expect(
					order[index - 1]?.compareDocumentPosition(order[index] as Node),
				).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
			}
			expect(
				screen.queryByText(/Avez-vous informé et consulté le CSE/),
			).not.toBeInTheDocument();
			expect(screen.queryByLabelText("Oui")).not.toBeInTheDocument();
		});

		it("shows only the accuracy card for case 4", () => {
			renderStep1({ banner: JOINT_EVALUATION_BANNER });

			expect(screen.getByText(ACCURACY_1_TITLE)).toBeInTheDocument();
			expect(screen.queryByText(JUSTIFICATION_TITLE)).not.toBeInTheDocument();
			expect(cardOf("first-decl-accuracy")).toBeInTheDocument();
			expect(document.getElementById("first-decl-gap-legend")).toBeNull();
		});

		it("lays out case 5 with the second declaration banner and one section per declaration", () => {
			renderStep1({
				banner: SECOND_DECLARATION_BANNER,
				firstDeclJustificationRequired: true,
				hasSecondDeclaration: true,
			});

			expect(
				screen.getByText("Votre seconde déclaration a été transmise"),
			).toBeInTheDocument();
			const first = screen.getByRole("heading", {
				level: 3,
				name: "Première déclaration",
			});
			const second = screen.getByRole("heading", {
				level: 3,
				name: "Seconde déclaration",
			});
			const firstSection = first.closest("section") as HTMLElement;
			const secondSection = second.closest("section") as HTMLElement;
			expect(within(firstSection).getByText(ACCURACY_1_TITLE)).toBeVisible();
			expect(within(firstSection).getByText(JUSTIFICATION_TITLE)).toBeVisible();
			expect(within(secondSection).getByText(ACCURACY_2_TITLE)).toBeVisible();
			expect(
				within(secondSection).queryByText(JUSTIFICATION_TITLE),
			).not.toBeInTheDocument();
		});

		it("renders the four cards when both declarations require a justification", () => {
			renderStep1({
				firstDeclJustificationRequired: true,
				hasSecondDeclaration: true,
				secondDeclJustificationRequired: true,
			});

			for (const id of [
				"first-decl-accuracy",
				"first-decl-gap",
				"second-decl-accuracy",
				"second-decl-gap",
			]) {
				expect(cardOf(id)).toBeInTheDocument();
			}
		});

		it("uses h2 declaration headings when there is no banner", () => {
			renderStep1({ hasSecondDeclaration: true });

			expect(
				screen.getByRole("heading", { level: 2, name: "Première déclaration" }),
			).toBeInTheDocument();
			expect(
				screen.getByRole("heading", { level: 2, name: "Seconde déclaration" }),
			).toBeInTheDocument();
		});

		it("drops the declaration headings when there is only one declaration", () => {
			renderStep1({ firstDeclJustificationRequired: true });

			expect(
				screen.queryByText("Première déclaration"),
			).not.toBeInTheDocument();
			expect(screen.queryByText("Seconde déclaration")).not.toBeInTheDocument();
		});

		it("tells the banner whether the deposit stays modifiable", () => {
			renderStep1({
				banner: { variant: "second_declaration", depositModifiable: true },
				hasSecondDeclaration: true,
			});

			expect(
				screen.getByText(
					"Vous pouvez modifier votre dépôt jusqu'à ce que vous transmettiez l'avis ou les avis du CSE.",
				),
			).toBeInTheDocument();
		});

		it("gives the banner the declarant email, or a placeholder", () => {
			const { unmount } = renderStep1({
				banner: JOINT_EVALUATION_BANNER,
				email: "declarant@example.fr",
			});
			expect(screen.getByText("declarant@example.fr")).toBeInTheDocument();
			unmount();

			renderStep1({ banner: JOINT_EVALUATION_BANNER });
			expect(screen.getByText("adresse@exemple.fr")).toBeInTheDocument();
		});
	});

	it("names the step and announces the deposit as the next step", () => {
		renderStep1();

		expect(
			screen.getByRole("heading", {
				level: 2,
				name: /Renseigner les avis émis par le CSE/,
			}),
		).toHaveTextContent("Étape 1 sur 2");
		expect(
			screen.getByText("Étape suivante :").parentElement,
		).toHaveTextContent("Étape suivante : Déposer l'avis ou les avis du CSE");
	});

	it("keeps the introduction and the obligatory-fields mention", () => {
		renderStep1();

		expect(
			screen.getByText(
				"Renseignez les informations relatives à l'avis ou aux avis émis par votre CSE.",
			),
		).toBeInTheDocument();
		expect(screen.getByText("Tous les champs sont obligatoires.")).toHaveClass(
			"fr-text-title--grey",
		);
	});

	it("asks the CSE opinion and its date in every card", () => {
		renderStep1({ firstDeclJustificationRequired: true });

		for (const id of ["first-decl-accuracy", "first-decl-gap"]) {
			const card = cardOf(id);
			expect(within(card).getByText("Quel est l'avis du CSE ?")).toBeVisible();
			expect(
				within(card).getByLabelText(/Date de l'avis rendu par le CSE/),
			).toBeInTheDocument();
		}
	});

	it("offers a lone next button, without a link back to a transmitted step", () => {
		renderStep1();

		expect(screen.getByRole("button", { name: /Suivant/ })).toBeInTheDocument();
		expect(
			screen.queryByRole("link", { name: /Précédent/ }),
		).not.toBeInTheDocument();
	});

	it("pre-fills the saved opinions", () => {
		renderStep1({
			firstDeclJustificationRequired: true,
			initialData: SAVED_OPINIONS,
		});

		expect(
			within(cardOf("first-decl-accuracy")).getByLabelText("Favorable"),
		).toBeChecked();
		expect(
			within(cardOf("first-decl-gap")).getByLabelText("Défavorable"),
		).toBeChecked();
		expect(document.getElementById("first-decl-gap-date")).toHaveValue(
			"2026-01-16",
		);
	});

	describe("submission", () => {
		it("shows the validation error on an empty form", async () => {
			const user = userEvent.setup();
			renderStep1();

			await user.click(screen.getByRole("button", { name: /Suivant/ }));

			expect(
				await screen.findByText(
					"Veuillez remplir tous les champs obligatoires.",
				),
			).toBeInTheDocument();
			expect(mockMutate).not.toHaveBeenCalled();
		});

		it("submits both declarations with their required justification", async () => {
			const user = userEvent.setup();
			renderStep1({
				firstDeclJustificationRequired: true,
				hasSecondDeclaration: true,
			});

			await answerCard(user, "first-decl-accuracy", "Favorable", "2026-01-15");
			await answerCard(user, "first-decl-gap", "Défavorable", "2026-01-16");
			await answerCard(user, "second-decl-accuracy", "Favorable", "2026-02-15");
			await user.click(screen.getByRole("button", { name: /Suivant/ }));

			expect(mockMutate).toHaveBeenCalledWith({
				firstDeclaration: {
					accuracyOpinion: "favorable",
					accuracyDate: "2026-01-15",
					gapOpinion: "unfavorable",
					gapDate: "2026-01-16",
				},
				secondDeclaration: {
					accuracyOpinion: "favorable",
					accuracyDate: "2026-02-15",
					gapOpinion: null,
					gapDate: null,
				},
			});
			expect(mockPush).toHaveBeenCalledWith("/avis-cse/etape/2");
		});

		it("drops a saved justification that is no longer required", async () => {
			const user = userEvent.setup();
			renderStep1({ initialData: SAVED_OPINIONS });

			await user.click(screen.getByRole("button", { name: /Suivant/ }));

			expect(mockMutate).toHaveBeenCalledWith({
				firstDeclaration: {
					accuracyOpinion: "favorable",
					accuracyDate: "2026-01-15",
					gapOpinion: null,
					gapDate: null,
				},
				secondDeclaration: undefined,
			});
		});

		it.each([
			["first", { firstDeclJustificationRequired: true }],
			[
				"second",
				{ hasSecondDeclaration: true, secondDeclJustificationRequired: true },
			],
		] as const)("blocks an incomplete required %s-declaration justification", async (_which, props) => {
			const user = userEvent.setup();
			renderStep1({ ...props, initialData: SAVED_OPINIONS });
			const prefix = _which === "first" ? "first-decl" : "second-decl";
			const dateInput = document.getElementById(
				`${prefix}-gap-date`,
			) as HTMLInputElement;
			await user.clear(dateInput);

			await user.click(screen.getByRole("button", { name: /Suivant/ }));

			expect(
				await screen.findByText(
					"Veuillez remplir tous les champs obligatoires.",
				),
			).toBeInTheDocument();
			expect(mockMutate).not.toHaveBeenCalled();
		});
	});

	describe("saved indicator", () => {
		it("is hidden while nothing was saved or drafted", () => {
			renderStep1();

			expect(screen.queryByRole("status")).not.toBeInTheDocument();
		});

		it("reads saved once opinions are stored", () => {
			renderStep1({ initialData: SAVED_OPINIONS });

			expect(screen.getByRole("status")).toHaveTextContent("Enregistré");
		});

		it("goes from saving to saved as the draft is written", () => {
			mockUseDeclarationDraft.mockReturnValue({
				draft: {},
				setField: mockSetField,
				clearDraft: mockClearDraft,
				hasDraft: true,
				isLoadingDraft: false,
				isSaving: true,
				isPendingSave: false,
			});
			const { rerender } = renderStep1();
			expect(screen.getByRole("status")).toHaveTextContent("Enregistre");
			expect(screen.getByRole("status")).not.toHaveTextContent("Enregistré");

			mockUseDeclarationDraft.mockReturnValue({
				draft: {},
				setField: mockSetField,
				clearDraft: mockClearDraft,
				hasDraft: true,
				isLoadingDraft: false,
				isSaving: false,
				isPendingSave: false,
			});
			rerender(step1());
			expect(screen.getByRole("status")).toHaveTextContent("Enregistré");
		});

		it("sits on the title row next to the page title", () => {
			renderStep1({ initialData: SAVED_OPINIONS });

			expect(screen.getByRole("status").parentElement).toContainElement(
				screen.getByRole("heading", { level: 1 }),
			);
		});
	});

	describe("draft integration", () => {
		it("shows a loading state while the draft is loading", () => {
			mockUseDeclarationDraft.mockReturnValue({
				draft: {},
				setField: mockSetField,
				clearDraft: mockClearDraft,
				hasDraft: false,
				isLoadingDraft: true,
				isSaving: false,
				isPendingSave: false,
			});
			renderStep1();

			expect(screen.getByText("Chargement...")).toBeInTheDocument();
		});

		it("hydrates both declarations from a draft", () => {
			mockUseDeclarationDraft.mockReturnValue({
				draft: {
					firstDeclaration: {
						accuracyOpinion: "unfavorable",
						accuracyDate: "2026-03-01",
						gapOpinion: "favorable",
						gapDate: "2026-03-02",
						gapConsulted: false,
					},
					secondDeclaration: {
						accuracyOpinion: "favorable",
						accuracyDate: "2026-03-03",
					},
				},
				setField: mockSetField,
				clearDraft: mockClearDraft,
				hasDraft: true,
				isLoadingDraft: false,
				isSaving: false,
				isPendingSave: false,
			});
			renderStep1({
				firstDeclJustificationRequired: true,
				hasSecondDeclaration: true,
			});

			expect(
				within(cardOf("first-decl-accuracy")).getByLabelText("Défavorable"),
			).toBeChecked();
			expect(
				within(cardOf("first-decl-gap")).getByLabelText("Favorable"),
			).toBeChecked();
			expect(document.getElementById("second-decl-accuracy-date")).toHaveValue(
				"2026-03-03",
			);
		});

		it("saves a draft when an opinion or a date changes", async () => {
			const user = userEvent.setup();
			renderStep1({ firstDeclJustificationRequired: true });

			await user.click(
				within(cardOf("first-decl-gap")).getByLabelText("Favorable"),
			);
			expect(lastFirstDeclaration()?.gapOpinion).toBe("favorable");

			await user.type(
				document.getElementById("first-decl-accuracy-date") as HTMLElement,
				"2026-01-15",
			);
			expect(lastFirstDeclaration()?.accuracyDate).toBe("2026-01-15");
		});

		it("saves the second-declaration fields in the draft", async () => {
			const user = userEvent.setup();
			renderStep1({
				hasSecondDeclaration: true,
				secondDeclJustificationRequired: true,
			});

			await user.click(
				within(cardOf("second-decl-gap")).getByLabelText("Défavorable"),
			);
			await user.click(
				within(cardOf("second-decl-accuracy")).getByLabelText("Favorable"),
			);

			expect(lastSecondDeclaration()).toMatchObject({
				accuracyOpinion: "favorable",
				gapOpinion: "unfavorable",
			});
		});

		it("never writes an unrequired justification to the draft", async () => {
			const user = userEvent.setup();
			renderStep1({ initialData: SAVED_OPINIONS });

			await user.click(
				within(cardOf("first-decl-accuracy")).getByLabelText("Défavorable"),
			);

			expect(lastFirstDeclaration()).toMatchObject({
				gapOpinion: null,
				gapDate: null,
			});
		});
	});

	describe("declaration lock", () => {
		function renderLocked(props: StepProps = {}) {
			return render(<LockProvider isReadOnly>{step1(props)}</LockProvider>);
		}

		it("keeps the fieldset enabled and marks the date inputs read-only when the declaration is locked", () => {
			const { container } = renderLocked();

			expect(container.querySelector("fieldset")).not.toBeDisabled();
			expect(
				container.querySelector("#first-decl-accuracy-date"),
			).toHaveAttribute("readonly");
		});

		it("disables every input and the next button when locked", () => {
			renderLocked({ firstDeclJustificationRequired: true });

			for (const radio of screen.getAllByRole("radio")) {
				expect(radio).toBeDisabled();
			}
			expect(screen.getByRole("button", { name: /Suivant/ })).toBeDisabled();
		});

		it("does not save a draft when an opinion is changed while locked", async () => {
			const user = userEvent.setup();
			renderLocked();

			await user.click(screen.getAllByLabelText("Favorable")[0] as HTMLElement);

			expect(mockSetField).not.toHaveBeenCalled();
		});

		it("keeps the saved indicator idle while locked", () => {
			renderLocked({ initialData: SAVED_OPINIONS });

			expect(screen.getByRole("status")).toHaveTextContent("Enregistré");
			expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "false");
		});

		it("keeps inputs enabled when the lock is inactive", () => {
			render(<LockProvider isReadOnly={false}>{step1()}</LockProvider>);

			expect(
				screen.getByRole("button", { name: /Suivant/ }),
			).not.toBeDisabled();
		});
	});

	describe("admin impersonation", () => {
		afterEach(() => {
			mockedUseSession.mockReset();
		});

		it("disables the radios and next button under the static provider when impersonating", () => {
			mockImpersonating();

			const { container } = render(
				<LockProvider isReadOnly={false}>{step1()}</LockProvider>,
			);

			expect(container.querySelector("fieldset")).not.toBeDisabled();
			for (const radio of screen.getAllByRole("radio")) {
				expect(radio).toBeDisabled();
			}
			expect(screen.getByRole("button", { name: /Suivant/ })).toBeDisabled();
		});

		it("links to the upload step instead of submitting when opinions are recorded", () => {
			mockImpersonating();

			render(
				<LockProvider isReadOnly={false}>
					{step1({ initialData: SAVED_OPINIONS })}
				</LockProvider>,
			);

			expect(screen.getByRole("link", { name: "Suivant" })).toHaveAttribute(
				"href",
				"/avis-cse/etape/2",
			);
			expect(
				screen.queryByRole("button", { name: /Suivant/ }),
			).not.toBeInTheDocument();
		});

		it("does not save a draft while impersonating", async () => {
			mockImpersonating();
			const user = userEvent.setup();

			render(<LockProvider isReadOnly={false}>{step1()}</LockProvider>);

			await user.click(screen.getAllByLabelText("Favorable")[0] as HTMLElement);

			expect(mockSetField).not.toHaveBeenCalled();
		});
	});
});
