import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock(
	"~/modules/declaration-remuneration/shared/ComplianceCompletionEffect",
	() => ({
		ComplianceCompletionEffect: () => null,
	}),
);

vi.mock("~/trpc/server", () => ({
	api: {
		declaration: {
			getOrCreate: vi.fn().mockResolvedValue({
				declaration: { year: 2025 },
				jobCategories: [],
				employeeCategories: [],
				gipPrefillData: null,
			}),
		},
	},
}));

const DECLARATION_YEAR = 2025;

import { ComplianceConfirmation } from "../ComplianceConfirmation";

describe("ComplianceConfirmation", () => {
	it("renders the confirmation title", async () => {
		render(await ComplianceConfirmation());

		expect(
			screen.getByRole("heading", {
				name: /Parcours de mise en conformité/,
			}),
		).toBeInTheDocument();
	});

	it("displays the completion message with declaration year", async () => {
		render(await ComplianceConfirmation());

		expect(
			screen.getByText(
				new RegExp(
					`Votre parcours de mise en conformité ${DECLARATION_YEAR} est terminé`,
				),
			),
		).toBeInTheDocument();
	});

	it("shows the no CSE message", async () => {
		render(await ComplianceConfirmation());

		expect(
			screen.getByText(/Votre entreprise ne dispose pas de CSE/),
		).toBeInTheDocument();
	});

	it("has a link to mon espace", async () => {
		render(await ComplianceConfirmation());

		const link = screen.getByRole("link", { name: "Mon espace" });
		expect(link).toHaveAttribute("href", "/mon-espace");
	});

	it("has a download PDF button with year", async () => {
		render(await ComplianceConfirmation());

		const link = screen.getByRole("link", {
			name: /Télécharger le récapitulatif/,
		});
		expect(link).toHaveAttribute(
			"href",
			`/api/declaration-pdf?year=${DECLARATION_YEAR}`,
		);
	});
});
