import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LockProvider } from "~/modules/declaration-remuneration/shared/lock/LockContext";
import { Step1Opinions } from "../Step1Opinions";

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
		}));
		return { mockSetField, mockClearDraft, mockUseDeclarationDraft };
	},
);

vi.mock(
	"~/modules/declaration-remuneration/shared/draft/useDeclarationDraft",
	() => ({ useDeclarationDraft: mockUseDeclarationDraft }),
);

const mockPush = vi.fn();
const cseDeadline = new Date("2028-02-01T00:00:00");

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
	gapConsulted?: boolean;
	gapOpinion?: string;
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
	});
});

describe("Step1Opinions", () => {
	it("disables browser autofill on the form", () => {
		const { container } = render(
			<Step1Opinions cseDeadline={cseDeadline} siren="123456789" year={2026} />,
		);

		expect(container.querySelector("form")).toHaveAttribute(
			"autocomplete",
			"off",
		);
	});

	it("renders compliance path title when compliancePath is joint_evaluation", () => {
		render(
			<Step1Opinions
				cseDeadline={cseDeadline}
				firstDeclarationPathChoice="joint_evaluation"
				siren="123456789"
				year={2026}
			/>,
		);

		expect(
			screen.getByText(
				/Parcours de mise en conformité pour l'indicateur par catégorie de salariés/,
			),
		).toBeInTheDocument();
	});

	it("does not render compliance path title for other paths", () => {
		render(
			<Step1Opinions
				cseDeadline={cseDeadline}
				firstDeclarationPathChoice="justify"
				siren="123456789"
				year={2026}
			/>,
		);

		expect(
			screen.queryByText(
				/Parcours de mise en conformité pour l'indicateur par catégorie de salariés/,
			),
		).not.toBeInTheDocument();
	});

	it("renders h1 as CSE opinion title when no compliance path banner", () => {
		render(
			<Step1Opinions cseDeadline={cseDeadline} siren="123456789" year={2026} />,
		);

		const heading = screen.getByRole("heading", { level: 1 });
		expect(heading).toHaveTextContent("Transmettre l'avis ou les avis du CSE");
	});

	it("renders the stepper at step 1", () => {
		render(
			<Step1Opinions cseDeadline={cseDeadline} siren="123456789" year={2026} />,
		);

		expect(screen.getByText(/Étape 1 sur 2/)).toBeInTheDocument();
	});

	it("renders both declaration sections when hasSecondDeclaration is true", () => {
		render(
			<Step1Opinions
				cseDeadline={cseDeadline}
				hasSecondDeclaration={true}
				siren="123456789"
				year={2026}
			/>,
		);

		expect(screen.getByText("Première déclaration")).toBeInTheDocument();
		expect(screen.getByText("Deuxième déclaration")).toBeInTheDocument();
	});

	it("hides second declaration section when hasSecondDeclaration is false", () => {
		render(
			<Step1Opinions
				cseDeadline={cseDeadline}
				hasSecondDeclaration={false}
				siren="123456789"
				year={2026}
			/>,
		);

		expect(screen.getByText("Première déclaration")).toBeInTheDocument();
		expect(screen.queryByText("Deuxième déclaration")).not.toBeInTheDocument();
	});

	it("renders the submission banner for joint_evaluation path", () => {
		render(
			<Step1Opinions
				cseDeadline={cseDeadline}
				firstDeclarationPathChoice="joint_evaluation"
				siren="123456789"
				year={2026}
			/>,
		);

		expect(
			screen.getByText(
				/Votre rapport de l'évaluation conjointe a été transmise/,
			),
		).toBeInTheDocument();
	});

	it("does not render the submission banner for other paths", () => {
		render(
			<Step1Opinions cseDeadline={cseDeadline} siren="123456789" year={2026} />,
		);

		expect(
			screen.queryByText(
				/Votre rapport de l'évaluation conjointe a été transmise/,
			),
		).not.toBeInTheDocument();
	});

	it("renders previous and next buttons", () => {
		render(
			<Step1Opinions cseDeadline={cseDeadline} siren="123456789" year={2026} />,
		);

		expect(screen.getByRole("link", { name: /Précédent/ })).toHaveAttribute(
			"href",
			"/declaration-remuneration/etape/6",
		);
		expect(screen.getByRole("button", { name: /Suivant/ })).toBeInTheDocument();
	});

	it("uses the previousHref prop when provided", () => {
		render(
			<Step1Opinions
				cseDeadline={cseDeadline}
				previousHref="/declaration-remuneration/parcours-conformite"
				siren="123456789"
				year={2026}
			/>,
		);

		expect(screen.getByRole("link", { name: /Précédent/ })).toHaveAttribute(
			"href",
			"/declaration-remuneration/parcours-conformite",
		);
	});

	it("shows validation error when submitting empty form", async () => {
		const user = userEvent.setup();
		render(
			<Step1Opinions cseDeadline={cseDeadline} siren="123456789" year={2026} />,
		);

		await user.click(screen.getByRole("button", { name: /Suivant/ }));

		expect(
			screen.getByText("Veuillez remplir tous les champs obligatoires."),
		).toBeInTheDocument();
		expect(mockPush).not.toHaveBeenCalled();
	});

	it("calls mutation with both declarations when hasSecondDeclaration is true", async () => {
		const user = userEvent.setup();
		render(
			<Step1Opinions
				cseDeadline={cseDeadline}
				hasSecondDeclaration={true}
				initialData={{
					firstDeclAccuracyOpinion: "favorable",
					firstDeclAccuracyDate: "2026-01-15",
					firstDeclGapConsulted: true,
					firstDeclGapOpinion: "favorable",
					firstDeclGapDate: "2026-01-20",
					secondDeclAccuracyOpinion: "unfavorable",
					secondDeclAccuracyDate: "2026-02-01",
					secondDeclGapConsulted: false,
					secondDeclGapOpinion: null,
					secondDeclGapDate: null,
				}}
				siren="123456789"
				year={2026}
			/>,
		);

		await user.click(screen.getByRole("button", { name: /Suivant/ }));

		expect(mockMutate).toHaveBeenCalledWith({
			firstDeclaration: {
				accuracyOpinion: "favorable",
				accuracyDate: "2026-01-15",
				gapConsulted: true,
				gapOpinion: "favorable",
				gapDate: "2026-01-20",
			},
			secondDeclaration: {
				accuracyOpinion: "unfavorable",
				accuracyDate: "2026-02-01",
				gapConsulted: false,
				gapOpinion: null,
				gapDate: null,
			},
		});
		expect(mockPush).toHaveBeenCalledWith("/avis-cse/etape/2");
	});

	it("calls mutation without secondDeclaration when hasSecondDeclaration is false", async () => {
		const user = userEvent.setup();
		render(
			<Step1Opinions
				cseDeadline={cseDeadline}
				hasSecondDeclaration={false}
				initialData={{
					firstDeclAccuracyOpinion: "favorable",
					firstDeclAccuracyDate: "2026-01-15",
					firstDeclGapConsulted: false,
					firstDeclGapOpinion: null,
					firstDeclGapDate: null,
					secondDeclAccuracyOpinion: null,
					secondDeclAccuracyDate: "",
					secondDeclGapConsulted: null,
					secondDeclGapOpinion: null,
					secondDeclGapDate: null,
				}}
				siren="123456789"
				year={2026}
			/>,
		);

		await user.click(screen.getByRole("button", { name: /Suivant/ }));

		expect(mockMutate).toHaveBeenCalledWith({
			firstDeclaration: {
				accuracyOpinion: "favorable",
				accuracyDate: "2026-01-15",
				gapConsulted: false,
				gapOpinion: null,
				gapDate: null,
			},
			secondDeclaration: undefined,
		});
		expect(mockPush).toHaveBeenCalledWith("/avis-cse/etape/2");
	});

	it("renders with initial data pre-filled", () => {
		render(
			<Step1Opinions
				cseDeadline={cseDeadline}
				initialData={{
					firstDeclAccuracyOpinion: "favorable",
					firstDeclAccuracyDate: "2026-01-15",
					firstDeclGapConsulted: false,
					firstDeclGapOpinion: null,
					firstDeclGapDate: null,
					secondDeclAccuracyOpinion: "unfavorable",
					secondDeclAccuracyDate: "2026-02-01",
					secondDeclGapConsulted: false,
					secondDeclGapOpinion: null,
					secondDeclGapDate: null,
				}}
				siren="123456789"
				year={2026}
			/>,
		);

		// First declaration accuracy radios
		const favorableRadios = screen.getAllByLabelText("Favorable");
		expect(favorableRadios[0]).toBeChecked();

		// Second declaration accuracy radios
		const unfavorableRadios = screen.getAllByLabelText("Défavorable");
		expect(unfavorableRadios[1]).toBeChecked();
	});

	it("displays email in submission banner for joint_evaluation path", () => {
		render(
			<Step1Opinions
				cseDeadline={cseDeadline}
				email="test@example.fr"
				firstDeclarationPathChoice="joint_evaluation"
				siren="123456789"
				year={2026}
			/>,
		);

		expect(screen.getByText("test@example.fr")).toBeInTheDocument();
	});

	it("uses default email when none provided for joint_evaluation path", () => {
		render(
			<Step1Opinions
				cseDeadline={cseDeadline}
				firstDeclarationPathChoice="joint_evaluation"
				siren="123456789"
				year={2026}
			/>,
		);

		expect(screen.getByText("adresse@exemple.fr")).toBeInTheDocument();
	});

	describe("gap consultation validation", () => {
		it("blocks submission when the first-declaration gap is consulted but incomplete", async () => {
			const user = userEvent.setup();
			render(
				<Step1Opinions
					cseDeadline={cseDeadline}
					hasSecondDeclaration={false}
					initialData={{
						firstDeclAccuracyOpinion: "favorable",
						firstDeclAccuracyDate: "2026-01-15",
						firstDeclGapConsulted: true,
						firstDeclGapOpinion: null,
						firstDeclGapDate: null,
						secondDeclAccuracyOpinion: null,
						secondDeclAccuracyDate: "",
						secondDeclGapConsulted: null,
						secondDeclGapOpinion: null,
						secondDeclGapDate: null,
					}}
					siren="123456789"
					year={2026}
				/>,
			);

			await user.click(screen.getByRole("button", { name: /Suivant/ }));

			expect(
				screen.getByText("Veuillez remplir tous les champs obligatoires."),
			).toBeInTheDocument();
			expect(mockMutate).not.toHaveBeenCalled();
		});

		it("blocks submission when the second-declaration gap is consulted but incomplete", async () => {
			const user = userEvent.setup();
			render(
				<Step1Opinions
					cseDeadline={cseDeadline}
					hasSecondDeclaration={true}
					initialData={{
						firstDeclAccuracyOpinion: "favorable",
						firstDeclAccuracyDate: "2026-01-15",
						firstDeclGapConsulted: false,
						firstDeclGapOpinion: null,
						firstDeclGapDate: null,
						secondDeclAccuracyOpinion: "favorable",
						secondDeclAccuracyDate: "2026-02-01",
						secondDeclGapConsulted: true,
						secondDeclGapOpinion: null,
						secondDeclGapDate: null,
					}}
					siren="123456789"
					year={2026}
				/>,
			);

			await user.click(screen.getByRole("button", { name: /Suivant/ }));

			expect(
				screen.getByText("Veuillez remplir tous les champs obligatoires."),
			).toBeInTheDocument();
			expect(mockMutate).not.toHaveBeenCalled();
		});
	});

	describe("draft integration", () => {
		it("hydrates form from draft when available", () => {
			mockUseDeclarationDraft.mockReturnValue({
				draft: {
					firstDeclaration: {
						accuracyOpinion: "favorable",
						accuracyDate: "",
						gapConsulted: undefined,
						gapOpinion: null,
						gapDate: null,
					},
				},
				setField: mockSetField,
				clearDraft: mockClearDraft,
				hasDraft: true,
				isLoadingDraft: false,
			});

			render(
				<Step1Opinions
					cseDeadline={cseDeadline}
					siren="123456789"
					year={2026}
				/>,
			);

			const favorableRadios = screen.getAllByLabelText("Favorable");
			expect(favorableRadios[0]).toBeChecked();
		});

		it("hydrates both declarations from a draft with second-declaration data", () => {
			mockUseDeclarationDraft.mockReturnValue({
				draft: {
					firstDeclaration: {
						accuracyOpinion: "favorable",
						accuracyDate: "2026-01-10",
						gapConsulted: false,
						gapOpinion: null,
						gapDate: null,
					},
					secondDeclaration: {
						accuracyOpinion: "unfavorable",
						accuracyDate: "2026-02-10",
						gapConsulted: true,
						gapOpinion: "favorable",
						gapDate: "2026-02-15",
					},
				},
				setField: mockSetField,
				clearDraft: mockClearDraft,
				hasDraft: true,
				isLoadingDraft: false,
			});

			render(
				<Step1Opinions
					cseDeadline={cseDeadline}
					hasSecondDeclaration={true}
					siren="123456789"
					year={2026}
				/>,
			);

			expect(screen.getAllByLabelText("Favorable")[0]).toBeChecked();
			expect(screen.getAllByLabelText("Défavorable")[1]).toBeChecked();
		});

		it("shows loading state while draft is loading", () => {
			mockUseDeclarationDraft.mockReturnValue({
				draft: {},
				setField: mockSetField,
				clearDraft: mockClearDraft,
				hasDraft: false,
				isLoadingDraft: true,
			});

			render(
				<Step1Opinions
					cseDeadline={cseDeadline}
					siren="123456789"
					year={2026}
				/>,
			);

			expect(screen.getByText("Chargement...")).toBeInTheDocument();
			expect(
				screen.queryByText("Première déclaration"),
			).not.toBeInTheDocument();
		});

		it("calls setField when a radio is changed", async () => {
			const user = userEvent.setup();
			render(
				<Step1Opinions
					cseDeadline={cseDeadline}
					siren="123456789"
					year={2026}
				/>,
			);

			await user.click(screen.getAllByLabelText("Favorable")[0] as HTMLElement);

			expect(mockSetField).toHaveBeenCalled();
			expect(lastFirstDeclaration()?.accuracyOpinion).toBe("favorable");
		});

		it("saves a draft when the accuracy date changes", async () => {
			const user = userEvent.setup();
			render(
				<Step1Opinions
					cseDeadline={cseDeadline}
					hasSecondDeclaration={false}
					siren="123456789"
					year={2026}
				/>,
			);

			const dateInput = screen.getByLabelText(
				/Date de l'avis rendu par le CSE/,
			);
			await user.type(dateInput, "2026-03-10");

			expect(lastFirstDeclaration()?.accuracyDate).toBe("2026-03-10");
		});

		it("saves a draft for the gap opinion and date once consultation is confirmed", async () => {
			const user = userEvent.setup();
			const { container } = render(
				<Step1Opinions
					cseDeadline={cseDeadline}
					hasSecondDeclaration={false}
					siren="123456789"
					year={2026}
				/>,
			);

			// Answering "Oui" on the gap card reveals its opinion + date sub-fields and
			// triggers an autosave through onConsultedChange.
			await user.click(screen.getByLabelText("Oui"));

			const gapOpinion = container.querySelector(
				"#first-decl-gap-unfavorable",
			) as HTMLElement;
			await user.click(gapOpinion);
			expect(lastFirstDeclaration()?.gapOpinion).toBe("unfavorable");

			const gapDate = container.querySelector(
				"#first-decl-gap-date",
			) as HTMLElement;
			await user.type(gapDate, "2026-04-01");
			expect(lastFirstDeclaration()?.gapDate).toBe("2026-04-01");
		});

		it("saves a draft for the second-declaration accuracy fields", async () => {
			const user = userEvent.setup();
			const { container } = render(
				<Step1Opinions
					cseDeadline={cseDeadline}
					hasSecondDeclaration={true}
					siren="123456789"
					year={2026}
				/>,
			);

			const secondAccuracy = container.querySelector(
				"#second-decl-accuracy-favorable",
			) as HTMLElement;
			await user.click(secondAccuracy);
			expect(lastSecondDeclaration()?.accuracyOpinion).toBe("favorable");

			const secondAccuracyDate = container.querySelector(
				"#second-decl-accuracy-date",
			) as HTMLElement;
			await user.type(secondAccuracyDate, "2026-05-02");
			expect(lastSecondDeclaration()?.accuracyDate).toBe("2026-05-02");
		});

		it("saves a draft for the second-declaration gap fields", async () => {
			const user = userEvent.setup();
			const { container } = render(
				<Step1Opinions
					cseDeadline={cseDeadline}
					hasSecondDeclaration={true}
					siren="123456789"
					year={2026}
				/>,
			);

			// The second gap card is the second "Oui" radio on the page.
			await user.click(screen.getAllByLabelText("Oui")[1] as HTMLElement);
			expect(lastSecondDeclaration()?.gapConsulted).toBe(true);

			const gapOpinion = container.querySelector(
				"#second-decl-gap-favorable",
			) as HTMLElement;
			await user.click(gapOpinion);
			expect(lastSecondDeclaration()?.gapOpinion).toBe("favorable");

			const gapDate = container.querySelector(
				"#second-decl-gap-date",
			) as HTMLElement;
			await user.type(gapDate, "2026-05-20");
			expect(lastSecondDeclaration()?.gapDate).toBe("2026-05-20");
		});
	});

	describe("declaration lock", () => {
		function renderLocked() {
			return render(
				<LockProvider isReadOnly>
					<Step1Opinions
						cseDeadline={cseDeadline}
						siren="123456789"
						year={2026}
					/>
				</LockProvider>,
			);
		}

		it("disables the whole fieldset when the declaration is locked", () => {
			const { container } = renderLocked();

			const fieldset = container.querySelector("fieldset");
			expect(fieldset).toBeDisabled();
		});

		it("disables every input and the next button when locked", () => {
			renderLocked();

			for (const radio of screen.getAllByRole("radio")) {
				expect(radio).toBeDisabled();
			}
			expect(screen.getByRole("button", { name: /Suivant/ })).toBeDisabled();
		});

		it("does not save a draft when an opinion is changed while locked", async () => {
			const user = userEvent.setup();
			renderLocked();

			const favorable = screen.getAllByLabelText("Favorable")[0] as HTMLElement;
			// A disabled fieldset still lets us fire the handler imperatively; the
			// click is a no-op but we assert no draft write occurs regardless.
			await user.click(favorable);

			expect(mockSetField).not.toHaveBeenCalled();
		});

		it("keeps inputs enabled when the lock is inactive", () => {
			render(
				<LockProvider isReadOnly={false}>
					<Step1Opinions
						cseDeadline={cseDeadline}
						siren="123456789"
						year={2026}
					/>
				</LockProvider>,
			);

			expect(
				screen.getByRole("button", { name: /Suivant/ }),
			).not.toBeDisabled();
		});
	});
});
