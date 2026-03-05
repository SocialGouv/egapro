import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Step1Opinions } from "../Step1Opinions";

// Access the mocked router
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

describe("Step1Opinions", () => {
	it("renders the page title", () => {
		render(<Step1Opinions />);

		expect(
			screen.getByText(
				/Parcours de mise en conformité pour l'indicateur par catégorie de salariés/,
			),
		).toBeInTheDocument();
	});

	it("renders the stepper at step 1", () => {
		render(<Step1Opinions />);

		expect(screen.getByText(/Étape 1 sur 2/)).toBeInTheDocument();
	});

	it("renders both declaration sections", () => {
		render(<Step1Opinions />);

		expect(screen.getByText("Première déclaration")).toBeInTheDocument();
		expect(screen.getByText("Deuxième déclaration")).toBeInTheDocument();
	});

	it("renders the submission banner", () => {
		render(<Step1Opinions />);

		expect(
			screen.getByText(
				/Votre rapport de l'évaluation conjointe a été transmise/,
			),
		).toBeInTheDocument();
	});

	it("renders previous and next buttons", () => {
		render(<Step1Opinions />);

		expect(
			screen.getByRole("button", { name: /Précédent/ }),
		).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Suivant/ })).toBeInTheDocument();
	});

	it("shows validation error when submitting empty form", async () => {
		const user = userEvent.setup();
		render(<Step1Opinions />);

		await user.click(screen.getByRole("button", { name: /Suivant/ }));

		expect(
			screen.getByText("Veuillez remplir tous les champs obligatoires."),
		).toBeInTheDocument();
		expect(mockPush).not.toHaveBeenCalled();
	});

	it("calls mutation and navigates to step 2 when all fields are filled", async () => {
		const user = userEvent.setup();
		render(
			<Step1Opinions
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

	it("renders with initial data pre-filled", () => {
		render(
			<Step1Opinions
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

	it("displays email in submission banner", () => {
		render(<Step1Opinions email="test@example.fr" />);

		expect(screen.getByText("test@example.fr")).toBeInTheDocument();
	});

	it("uses default email when none provided", () => {
		render(<Step1Opinions />);

		expect(screen.getByText("adresse@exemple.fr")).toBeInTheDocument();
	});
});
