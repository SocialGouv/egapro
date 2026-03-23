import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getCurrentYear } from "~/modules/domain";

vi.mock(
	"~/modules/declaration-remuneration/shared/ComplianceCompletionEffect",
	() => ({
		ComplianceCompletionEffect: () => null,
	}),
);

import { ComplianceConfirmation } from "../ComplianceConfirmation";

describe("ComplianceConfirmation", () => {
	it("renders the confirmation title", () => {
		render(<ComplianceConfirmation />);

		expect(
			screen.getByRole("heading", {
				name: /Parcours de mise en conformité/,
			}),
		).toBeInTheDocument();
	});

	it("displays the completion message with current year", () => {
		render(<ComplianceConfirmation />);

		const year = getCurrentYear();
		expect(
			screen.getByText(
				new RegExp(`Votre parcours de mise en conformité ${year} est terminé`),
			),
		).toBeInTheDocument();
	});

	it("shows the no CSE message", () => {
		render(<ComplianceConfirmation />);

		expect(
			screen.getByText(/Votre entreprise ne dispose pas de CSE/),
		).toBeInTheDocument();
	});

	it("has a link to mon espace", () => {
		render(<ComplianceConfirmation />);

		const link = screen.getByRole("link", { name: "Mon espace" });
		expect(link).toHaveAttribute("href", "/mon-espace");
	});
});
