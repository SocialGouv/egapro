import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("~/trpc/react", () => ({
	api: {
		mail: {
			resendReceipt: {
				useMutation: () => ({ mutate: vi.fn(), isPending: false }),
			},
		},
	},
}));

vi.mock("~/server/auth", () => ({
	auth: vi.fn(async () => ({ user: { email: "declarant@example.fr" } })),
}));

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

const AT_THRESHOLD = COMPANY_SIZE_ANNUAL_MIN;
const UNDER_THRESHOLD = COMPANY_SIZE_ANNUAL_MIN - 1;

const NO_CSE_REASON = /Votre entreprise ne dispose pas de CSE/;
const UNDER_THRESHOLD_REASON = new RegExp(
	`Votre effectif est inférieur à ${COMPANY_SIZE_ANNUAL_MIN} salariés`,
);
const NO_OPINION_REQUIRED = /Aucun avis CSE n'est requis/;

type CompanyShape = {
	gipWorkforce: number | null;
	hasCse: boolean | null;
};

// The reason is not what these tests are about; any landing company will do.
const ANY_COMPANY: CompanyShape = {
	gipWorkforce: UNDER_THRESHOLD,
	hasCse: false,
};

async function renderConfirmation(company: CompanyShape) {
	vi.mocked(api.declaration.getOrCreate).mockResolvedValue({
		declaration: { year: DECLARATION_YEAR, siren: SIREN },
		jobCategories: [],
		employeeCategories: [],
		gipPrefillData: null,
	} as never);
	vi.mocked(api.company.get).mockResolvedValue(company as never);

	render(await ComplianceConfirmation());
}

describe("ComplianceConfirmation", () => {
	it("marks the completion pictogram as a success rather than an error", async () => {
		await renderConfirmation(ANY_COMPANY);

		// Without the modifier, the DSFR artwork paints its check in Marianne red
		// — the twin end-of-journey screen already carried the green one (#3460).
		expect(
			document.querySelector(".fr-artwork--green-emeraude"),
		).toBeInTheDocument();
	});

	it("renders the confirmation title", async () => {
		await renderConfirmation(ANY_COMPANY);

		expect(
			screen.getByRole("heading", {
				name: /Parcours de mise en conformité/,
			}),
		).toBeInTheDocument();
	});

	it("displays the completion message with declaration year", async () => {
		await renderConfirmation(ANY_COMPANY);

		expect(
			screen.getByText(
				new RegExp(
					`Votre parcours de mise en conformité ${DECLARATION_YEAR} est terminé`,
				),
			),
		).toBeInTheDocument();
	});

	it("has a link to mon espace", async () => {
		await renderConfirmation(ANY_COMPANY);

		const link = screen.getByRole("link", { name: "Mon espace" });
		expect(link).toHaveAttribute("href", "/mon-espace");
	});

	it("offers the declaration recap as a download card under its section heading", async () => {
		await renderConfirmation(ANY_COMPANY);

		// The screen used to expose a bare button, diverging from the twin
		// end-of-journey screen and from the maquette (#3460, #4029).
		expect(
			screen.getByRole("heading", {
				name: "Documents récapitulatifs de votre déclaration",
			}),
		).toBeInTheDocument();

		const link = screen.getByRole("link", {
			name: /Télécharger le récapitulatif de la déclaration des indicateurs/,
		});
		expect(link).toHaveAttribute(
			"href",
			`/api/declaration-pdf?year=${DECLARATION_YEAR}`,
		);
		expect(link).toHaveAttribute("download");
		expect(
			screen.getByText(
				`Année ${DECLARATION_YEAR} au titre des données ${DECLARATION_YEAR - 1}`,
			),
		).toBeInTheDocument();
	});

	it("omits the second declaration card when none was submitted", async () => {
		await renderConfirmation(ANY_COMPANY);

		expect(
			screen.queryByRole("link", {
				name: /seconde déclaration/,
			}),
		).not.toBeInTheDocument();
	});

	it("renders the feedback banner", async () => {
		await renderConfirmation(ANY_COMPANY);

		expect(
			screen.getByText("Comment s'est passée votre démarche ?"),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /Je donne mon avis/ }),
		).toBeInTheDocument();
	});

	describe("reason why no CSE opinion is required", () => {
		it("looks the workforce up on the declaration's own company", async () => {
			await renderConfirmation(ANY_COMPANY);

			expect(api.company.get).toHaveBeenCalledWith({ siren: SIREN });
		});

		// Under the threshold no opinion is ever due, whatever the CSE answer — so
		// the headcount is the operative reason and the CSE answer must not show
		// through. hasCse:true is the case the redirect-loop fix makes reachable.
		it.each([
			true,
			false,
			null,
		])("blames the workforce below the threshold whatever the CSE answer (hasCse: %s)", async (hasCse) => {
			await renderConfirmation({ gipWorkforce: UNDER_THRESHOLD, hasCse });

			expect(screen.getByText(UNDER_THRESHOLD_REASON)).toBeInTheDocument();
			expect(screen.queryByText(NO_CSE_REASON)).not.toBeInTheDocument();
		});

		it("blames the workforce for a company absent from the GIP file", async () => {
			await renderConfirmation({ gipWorkforce: null, hasCse: true });

			expect(screen.getByText(UNDER_THRESHOLD_REASON)).toBeInTheDocument();
			expect(screen.queryByText(NO_CSE_REASON)).not.toBeInTheDocument();
		});

		it.each([
			false,
			null,
		])("blames the missing CSE at or above the threshold (hasCse: %s)", async (hasCse) => {
			await renderConfirmation({ gipWorkforce: AT_THRESHOLD, hasCse });

			expect(screen.getByText(NO_CSE_REASON)).toBeInTheDocument();
			expect(
				screen.queryByText(UNDER_THRESHOLD_REASON),
			).not.toBeInTheDocument();
		});

		// Unreachable through routing: at this size with a CSE an opinion is due, so
		// /avis-cse owns the démarche. Only the headcount claim is pinned — asserting
		// the CSE-denial text would enshrine a statement that is false for it.
		it("never claims a sub-threshold headcount for a large company with a CSE", async () => {
			await renderConfirmation({ gipWorkforce: AT_THRESHOLD, hasCse: true });

			expect(
				screen.queryByText(UNDER_THRESHOLD_REASON),
			).not.toBeInTheDocument();
		});

		it.each([
			{ gipWorkforce: UNDER_THRESHOLD, hasCse: true },
			{ gipWorkforce: AT_THRESHOLD, hasCse: false },
		])("states that no opinion is required (gipWorkforce: $gipWorkforce, hasCse: $hasCse)", async (company) => {
			await renderConfirmation(company);

			expect(screen.getByText(NO_OPINION_REQUIRED)).toBeInTheDocument();
		});
	});
});
