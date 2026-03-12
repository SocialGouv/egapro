import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { JointEvaluationForm } from "../JointEvaluationForm";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: mockPush }),
	usePathname: () =>
		"/declaration-remuneration/parcours-conformite/evaluation-conjointe",
}));

describe("JointEvaluationForm", () => {
	it("renders the page title and section heading", () => {
		render(
			<JointEvaluationForm
				currentYear={2026}
				declarationDate="01/06/2026"
			/>,
		);

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
		render(
			<JointEvaluationForm
				currentYear={2026}
				declarationDate="01/06/2026"
			/>,
		);

		expect(screen.getByText(/août 2026/i)).toBeInTheDocument();
		expect(screen.getByText(/01\/06\/2026/)).toBeInTheDocument();
	});

	it("shows an error when submitting without a file", () => {
		render(
			<JointEvaluationForm
				currentYear={2026}
				declarationDate="01/06/2026"
			/>,
		);

		const submitButton = screen.getByRole("button", { name: /transmettre/i });
		fireEvent.click(submitButton);

		expect(
			screen.getByText(/veuillez sélectionner un fichier/i),
		).toBeInTheDocument();
	});

	it("renders the info boxes", () => {
		render(
			<JointEvaluationForm
				currentYear={2026}
				declarationDate="01/06/2026"
			/>,
		);

		expect(
			screen.getByText(/ce que vous devez faire dans un délai de 2 mois/i),
		).toBeInTheDocument();
		expect(
			screen.getByText(/après dépôt du rapport/i),
		).toBeInTheDocument();
	});

	it("links back to the compliance path choice page", () => {
		render(
			<JointEvaluationForm
				currentYear={2026}
				declarationDate="01/06/2026"
			/>,
		);

		const backLink = screen.getByRole("link", { name: /précédent/i });
		expect(backLink).toHaveAttribute(
			"href",
			"/declaration-remuneration/parcours-conformite",
		);
	});
});
