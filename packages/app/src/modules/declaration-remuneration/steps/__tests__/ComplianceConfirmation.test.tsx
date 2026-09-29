import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
	"~/trpc/react",
	async () => await import("~/test/resendReceiptApiMock"),
);

vi.mock("~/server/auth", () => ({
	auth: vi.fn(async () => ({ user: { email: "declarant@example.fr" } })),
}));

vi.mock("~/trpc/server", () => ({
	api: {
		declaration: {
			getOrCreate: vi.fn(),
		},
	},
}));

import { auth } from "~/server/auth";
import { resendReceiptMutate } from "~/test/resendReceiptApiMock";
import { api } from "~/trpc/server";
import { ComplianceConfirmation } from "../ComplianceConfirmation";

const DECLARATION_YEAR = 2025;
const SIREN = "123456789";

async function renderConfirmation({
	hasSubmittedCseOpinion = false,
	hasSubmittedJointEvaluation = false,
	hasSubmittedSecondDeclaration = false,
} = {}) {
	vi.mocked(api.declaration.getOrCreate).mockResolvedValue({
		declaration: { year: DECLARATION_YEAR, siren: SIREN },
		jobCategories: [],
		employeeCategories: [],
		gipPrefillData: null,
		hasSubmittedCseOpinion,
		hasSubmittedJointEvaluation,
		hasSubmittedSecondDeclaration,
	} as never);

	render(await ComplianceConfirmation());
}

describe("ComplianceConfirmation", () => {
	beforeEach(() => {
		resendReceiptMutate.mockClear();
	});

	it("marks the completion pictogram as a success rather than an error", async () => {
		await renderConfirmation();

		// Without the modifier, the DSFR artwork paints its check in Marianne red
		// — the twin end-of-journey screen already carried the green one (#3460).
		expect(
			document.querySelector(".fr-artwork--green-emeraude"),
		).toBeInTheDocument();
	});

	// Both ends of the démarche share one maquette, hence one title, one sentence.
	it("renders the confirmation title", async () => {
		await renderConfirmation();

		expect(
			screen.getByRole("heading", {
				level: 1,
				name: `Démarche des indicateurs de rémunération ${DECLARATION_YEAR}`,
			}),
		).toBeInTheDocument();
	});

	it("displays the completion message with declaration year", async () => {
		await renderConfirmation();

		expect(
			screen.getByText(
				`Votre parcours ${DECLARATION_YEAR} est désormais terminé`,
			),
		).toBeInTheDocument();
	});

	it("does not show an unnecessary CSE message", async () => {
		await renderConfirmation();

		expect(
			screen.queryByText(/Votre entreprise ne dispose pas de CSE/),
		).not.toBeInTheDocument();
		expect(
			screen.queryByText(/Aucun avis CSE n'est requis/),
		).not.toBeInTheDocument();
	});

	it("has a link to mon espace", async () => {
		await renderConfirmation();

		const link = screen.getByRole("link", { name: "Mon espace" });
		expect(link).toHaveAttribute("href", "/mon-espace");
	});

	it("offers the declaration recap as a download card under its section heading", async () => {
		await renderConfirmation();

		// The screen used to expose a bare button, diverging from the twin
		// end-of-journey screen and from the maquette (#3460, #4029).
		expect(
			screen.getByRole("heading", {
				name: "Documents récapitulatifs de votre démarche",
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
		await renderConfirmation();

		expect(
			screen.queryByRole("link", {
				name: /seconde déclaration/,
			}),
		).not.toBeInTheDocument();
	});

	// Offered when the PDF has content — the rule DocumentsPanel already applies.
	describe("transmitted elements card", () => {
		function transmittedCard() {
			return screen.queryByRole("link", {
				name: /Télécharger le récapitulatif des éléments transmis/,
			});
		}

		it.each([
			{ hasSubmittedCseOpinion: true, hasSubmittedJointEvaluation: false },
			{ hasSubmittedCseOpinion: false, hasSubmittedJointEvaluation: true },
			{ hasSubmittedCseOpinion: true, hasSubmittedJointEvaluation: true },
		])("offers it once something was transmitted (cseOpinion: $hasSubmittedCseOpinion, jointEvaluation: $hasSubmittedJointEvaluation)", async (submissions) => {
			await renderConfirmation(submissions);

			expect(transmittedCard()).toHaveAttribute(
				"href",
				`/api/transmitted-pdf?year=${DECLARATION_YEAR}`,
			);
			expect(transmittedCard()).toHaveAttribute("download");
		});

		it("omits it when nothing was transmitted", async () => {
			await renderConfirmation({
				hasSubmittedCseOpinion: false,
				hasSubmittedJointEvaluation: false,
			});

			expect(transmittedCard()).not.toBeInTheDocument();
		});
	});

	describe("acknowledgement receipt", () => {
		it("tells the user where the acknowledgement was sent", async () => {
			// The screen used to give no trace at all that a receipt had been sent,
			// unlike its twin end-of-funnel screen (issue 3914).
			await renderConfirmation();

			expect(
				screen.getByText(/Un accusé de réception a été envoyé/),
			).toBeInTheDocument();
			expect(screen.getByText("declarant@example.fr")).toBeInTheDocument();
		});

		it("resends the declaration receipt when no second declaration was submitted", async () => {
			await renderConfirmation();

			await userEvent.click(
				screen.getByRole("button", { name: /Renvoyer l'accusé de réception/ }),
			);

			expect(resendReceiptMutate).toHaveBeenCalledWith({
				kind: "declaration",
				year: DECLARATION_YEAR,
			});
		});

		// Hard-coding "declaration" would resend the round-one receipt to a user who
		// has since filed a corrective one; the twin screen already branches.
		it("resends the second declaration receipt once one was submitted", async () => {
			await renderConfirmation({
				hasSubmittedSecondDeclaration: true,
			});

			await userEvent.click(
				screen.getByRole("button", { name: /Renvoyer l'accusé de réception/ }),
			);

			expect(resendReceiptMutate).toHaveBeenCalledWith({
				kind: "secondDeclaration",
				year: DECLARATION_YEAR,
			});
		});

		// A ProConnect account can carry no e-mail, but an address must still be named.
		it.each([
			null,
			{ user: {} },
			{ user: { email: null } },
		])("falls back to a placeholder address when the session carries none (session: %s)", async (session) => {
			vi.mocked(auth).mockResolvedValueOnce(session as never);
			await renderConfirmation();

			expect(screen.getByText("adresse@exemple.fr")).toBeInTheDocument();
		});
	});

	it("renders the feedback banner", async () => {
		await renderConfirmation();

		expect(
			screen.getByText("Comment s'est passée votre démarche ?"),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /Je donne mon avis/ }),
		).toBeInTheDocument();
	});
});
