import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("~/trpc/server", () => ({
	api: {
		company: {
			get: vi.fn(),
		},
		declaration: {
			getOrCreate: vi.fn(),
		},
	},
}));

import { COMPANY_SIZE_ANNUAL_MIN } from "~/modules/domain";
import { api } from "~/trpc/server";
import { ComplianceConfirmation } from "../ComplianceConfirmation";

const DECLARATION_YEAR = 2025;
const SIREN = "123456789";

const NO_CSE_REASON = /Votre entreprise ne dispose pas de CSE/;
const UNDER_THRESHOLD_REASON = new RegExp(
	`Votre effectif est inférieur à ${COMPANY_SIZE_ANNUAL_MIN} salariés`,
);
const NO_OPINION_REQUIRED = /Aucun avis CSE n'est requis/;

async function renderConfirmation(hasCse: boolean | null) {
	vi.mocked(api.declaration.getOrCreate).mockResolvedValue({
		declaration: { year: DECLARATION_YEAR, siren: SIREN },
		jobCategories: [],
		employeeCategories: [],
		gipPrefillData: null,
	} as never);
	vi.mocked(api.company.get).mockResolvedValue({ hasCse } as never);

	render(await ComplianceConfirmation());
}

describe("ComplianceConfirmation", () => {
	it("renders the confirmation title", async () => {
		await renderConfirmation(false);

		expect(
			screen.getByRole("heading", {
				name: /Parcours de mise en conformité/,
			}),
		).toBeInTheDocument();
	});

	it("displays the completion message with declaration year", async () => {
		await renderConfirmation(false);

		expect(
			screen.getByText(
				new RegExp(
					`Votre parcours de mise en conformité ${DECLARATION_YEAR} est terminé`,
				),
			),
		).toBeInTheDocument();
	});

	it("has a link to mon espace", async () => {
		await renderConfirmation(false);

		const link = screen.getByRole("link", { name: "Mon espace" });
		expect(link).toHaveAttribute("href", "/mon-espace");
	});

	it("has a download PDF button with year", async () => {
		await renderConfirmation(false);

		const link = screen.getByRole("link", {
			name: /Télécharger le récapitulatif/,
		});
		expect(link).toHaveAttribute(
			"href",
			`/api/declaration-pdf?year=${DECLARATION_YEAR}`,
		);
	});

	it("renders the feedback banner", async () => {
		await renderConfirmation(false);

		expect(
			screen.getByText("Comment s'est passée votre démarche ?"),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /Je donne mon avis/ }),
		).toBeInTheDocument();
	});

	describe("reason why no CSE opinion is required", () => {
		it("looks the reason up on the declaration's own company", async () => {
			await renderConfirmation(false);

			expect(api.company.get).toHaveBeenCalledWith({ siren: SIREN });
		});

		it("blames the workforce threshold when the company does have a CSE", async () => {
			await renderConfirmation(true);

			expect(screen.getByText(UNDER_THRESHOLD_REASON)).toBeInTheDocument();
		});

		// A company with a CSE reaches this page whenever its workforce drops under
		// the threshold, so claiming it has no CSE would state a plain falsehood.
		it("never denies the CSE of a company that has one", async () => {
			await renderConfirmation(true);

			expect(screen.queryByText(NO_CSE_REASON)).not.toBeInTheDocument();
		});

		it("blames the missing CSE when the company has none", async () => {
			await renderConfirmation(false);

			expect(screen.getByText(NO_CSE_REASON)).toBeInTheDocument();
			expect(
				screen.queryByText(UNDER_THRESHOLD_REASON),
			).not.toBeInTheDocument();
		});

		it("falls back to the missing-CSE wording when the question is unanswered", async () => {
			await renderConfirmation(null);

			expect(screen.getByText(NO_CSE_REASON)).toBeInTheDocument();
		});

		it.each([
			true,
			false,
			null,
		])("states that no opinion is required (hasCse: %s)", async (hasCse) => {
			await renderConfirmation(hasCse);

			expect(screen.getByText(NO_OPINION_REQUIRED)).toBeInTheDocument();
		});
	});
});
