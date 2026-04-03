import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Step1Opinions } from "../Step1Opinions";

const mockPush = vi.fn();

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
	},
}));

beforeEach(() => {
	mockPush.mockClear();
	mockMutate.mockClear();
});

describe("Step1Opinions", () => {
	it("renders compliance path title when compliancePath is joint_evaluation", () => {
		render(
			<Step1Opinions
				compliancePath="joint_evaluation"
				declarationYear={2025}
			/>,
		);

		expect(
			screen.getByText(
				/Parcours de mise en conformité pour l'indicateur par catégorie de salariés/,
			),
		).toBeInTheDocument();
	});

	it("does not render compliance path title for other paths", () => {
		render(<Step1Opinions compliancePath="justify" declarationYear={2025} />);

		expect(
			screen.queryByText(
				/Parcours de mise en conformité pour l'indicateur par catégorie de salariés/,
			),
		).not.toBeInTheDocument();
	});

	it("renders h1 as CSE opinion title when no compliance path banner", () => {
		render(<Step1Opinions declarationYear={2025} />);

		const heading = screen.getByRole("heading", { level: 1 });
		expect(heading).toHaveTextContent("Transmettre l'avis ou les avis du CSE");
	});

	it("renders the stepper at step 1", () => {
		render(<Step1Opinions declarationYear={2025} />);

		expect(screen.getByText(/Étape 1 sur 2/)).toBeInTheDocument();
	});

	it("renders both declaration sections when hasSecondDeclaration is true", () => {
		render(
			<Step1Opinions declarationYear={2025} hasSecondDeclaration={true} />,
		);

		expect(screen.getByText("Première déclaration")).toBeInTheDocument();
		expect(screen.getByText("Deuxième déclaration")).toBeInTheDocument();
	});

	it("hides second declaration section when hasSecondDeclaration is false", () => {
		render(
			<Step1Opinions declarationYear={2025} hasSecondDeclaration={false} />,
		);

		expect(screen.getByText("Première déclaration")).toBeInTheDocument();
		expect(screen.queryByText("Deuxième déclaration")).not.toBeInTheDocument();
	});

	it("renders the submission banner for joint_evaluation path", () => {
		render(
			<Step1Opinions
				compliancePath="joint_evaluation"
				declarationYear={2025}
			/>,
		);

		expect(
			screen.getByText(
				/Votre rapport de l'évaluation conjointe a été transmise/,
			),
		).toBeInTheDocument();
	});

	it("does not render the submission banner for other paths", () => {
		render(<Step1Opinions declarationYear={2025} />);

		expect(
			screen.queryByText(
				/Votre rapport de l'évaluation conjointe a été transmise/,
			),
		).not.toBeInTheDocument();
	});

	it("renders previous and next buttons", () => {
		render(<Step1Opinions declarationYear={2025} />);

		expect(
			screen.getByRole("button", { name: /Précédent/ }),
		).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Suivant/ })).toBeInTheDocument();
	});

	it("shows validation error when submitting empty form", async () => {
		const user = userEvent.setup();
		render(<Step1Opinions declarationYear={2025} />);

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
				declarationYear={2025}
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
				declarationYear={2025}
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
				declarationYear={2025}
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
				compliancePath="joint_evaluation"
				declarationYear={2025}
				email="test@example.fr"
			/>,
		);

		expect(screen.getByText("test@example.fr")).toBeInTheDocument();
	});

	it("uses default email when none provided for joint_evaluation path", () => {
		render(
			<Step1Opinions
				compliancePath="joint_evaluation"
				declarationYear={2025}
			/>,
		);

		expect(screen.getByText("adresse@exemple.fr")).toBeInTheDocument();
	});
});
