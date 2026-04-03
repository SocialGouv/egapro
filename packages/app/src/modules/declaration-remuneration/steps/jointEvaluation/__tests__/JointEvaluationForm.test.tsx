import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { JointEvaluationForm } from "../JointEvaluationForm";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: mockPush }),
	usePathname: () =>
		"/declaration-remuneration/parcours-conformite/evaluation-conjointe",
}));

vi.mock("~/trpc/react", () => ({
	api: {
		jointEvaluation: {
			uploadFile: {
				useMutation: () => ({
					mutate: vi.fn(),
					isPending: false,
					error: null,
				}),
			},
		},
	},
}));

const defaultProps = {
	declarationDate: "01/06/2026",
	hasCse: null as boolean | null,
	jointEvaluationDeadline: new Date("2026-08-01T00:00:00"),
};

describe("JointEvaluationForm", () => {
	beforeEach(() => {
		HTMLDialogElement.prototype.showModal =
			HTMLDialogElement.prototype.showModal || vi.fn();
		HTMLDialogElement.prototype.close =
			HTMLDialogElement.prototype.close || vi.fn();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("renders the page title and section heading", () => {
		render(<JointEvaluationForm {...defaultProps} />);

		expect(
			screen.getByRole("heading", {
				name: /parcours de mise en conformité/i,
				level: 1,
			}),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", {
				name: /évaluation conjointe des rémunérations/i,
				level: 2,
			}),
		).toBeInTheDocument();
	});

	it("renders the deadline callout with the current year", () => {
		render(<JointEvaluationForm {...defaultProps} />);

		expect(screen.getByText(/août 2026/i)).toBeInTheDocument();
		expect(screen.getByText(/01\/06\/2026/)).toBeInTheDocument();
	});

	it("shows an error when submitting without a file", () => {
		render(<JointEvaluationForm {...defaultProps} />);

		const submitButton = screen.getByRole("button", { name: /transmettre/i });
		fireEvent.click(submitButton);

		expect(
			screen.getByText(/veuillez sélectionner au moins un fichier/i),
		).toBeInTheDocument();
	});

	it("renders the info boxes", () => {
		render(<JointEvaluationForm {...defaultProps} />);

		expect(
			screen.getByText(/ce que vous devez faire dans un délai de 2 mois/i),
		).toBeInTheDocument();
		expect(screen.getByText(/après dépôt du rapport/i)).toBeInTheDocument();
	});

	it("links back to the compliance path choice page", () => {
		render(<JointEvaluationForm {...defaultProps} />);

		const backLink = screen.getByRole("link", { name: /précédent/i });
		expect(backLink).toHaveAttribute(
			"href",
			"/declaration-remuneration/parcours-conformite",
		);
	});

	it("opens modal after selecting a file and submitting", () => {
		const { container } = render(<JointEvaluationForm {...defaultProps} />);

		const input = container.querySelector(
			'input[type="file"]',
		) as HTMLInputElement;
		const file = new File(["pdf-content"], "rapport.pdf", {
			type: "application/pdf",
		});
		fireEvent.change(input, { target: { files: [file] } });

		fireEvent.click(screen.getByRole("button", { name: /transmettre/i }));

		expect(
			screen.queryByText(/veuillez sélectionner un fichier/i),
		).not.toBeInTheDocument();

		expect(
			container.querySelector("dialog#joint-evaluation-submit-modal"),
		).toBeInTheDocument();
	});

	it("renders the submit modal with correct labels", () => {
		const { container } = render(<JointEvaluationForm {...defaultProps} />);

		const dialog = container.querySelector(
			"dialog#joint-evaluation-submit-modal",
		);
		expect(dialog).toBeInTheDocument();
		expect(screen.getByText(/je certifie/i)).toBeInTheDocument();
	});
});
