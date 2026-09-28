import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmationPage } from "../ConfirmationPage";

vi.mock(
	"~/trpc/react",
	async () => await import("~/test/resendReceiptApiMock"),
);

const DECLARATION_YEAR = 2025;

const TRANSMITTED_CARD = /récapitulatif des éléments transmis/;

type Overrides = {
	email?: string;
	hasSecondDeclaration?: boolean;
	hasTransmittedElements?: boolean;
};

function renderConfirmation(overrides: Overrides = {}) {
	return render(
		<ConfirmationPage
			dataYear={DECLARATION_YEAR - 1}
			declarationYear={DECLARATION_YEAR}
			{...overrides}
		/>,
	);
}

describe("ConfirmationPage", () => {
	it("renders the page title", () => {
		renderConfirmation();

		expect(
			screen.getByRole("heading", {
				level: 1,
				name: `Démarche des indicateurs de rémunération ${DECLARATION_YEAR}`,
			}),
		).toBeInTheDocument();
	});

	it("renders the success message", () => {
		renderConfirmation();

		expect(
			screen.getByText(
				`Votre parcours ${DECLARATION_YEAR} est désormais terminé`,
			),
		).toBeInTheDocument();
	});

	it("renders the default email in receipt card", () => {
		renderConfirmation();

		expect(screen.getByText("adresse@exemple.fr")).toBeInTheDocument();
	});

	it("renders the provided email in receipt card", () => {
		renderConfirmation({ email: "test@example.com" });

		expect(screen.getByText("test@example.com")).toBeInTheDocument();
	});

	it("renders the resend button", () => {
		renderConfirmation();

		expect(
			screen.getByRole("button", {
				name: /Renvoyer l'accusé de réception/,
			}),
		).toBeInTheDocument();
	});

	it("renders document download section without second declaration card", () => {
		renderConfirmation();

		expect(
			screen.getByText("Documents récapitulatifs de votre démarche"),
		).toBeInTheDocument();
		expect(
			screen.getByText(/récapitulatif de la déclaration des indicateurs/),
		).toBeInTheDocument();
		expect(
			screen.queryByText(/récapitulatif de la seconde déclaration/),
		).not.toBeInTheDocument();
	});

	it("renders second declaration card when hasSecondDeclaration is true", () => {
		renderConfirmation({ hasSecondDeclaration: true });

		expect(
			screen.getByText(/récapitulatif de la déclaration des indicateurs/),
		).toBeInTheDocument();
		expect(
			screen.getByText(/récapitulatif de la seconde déclaration/),
		).toBeInTheDocument();
	});

	// The PDF is empty unless something was transmitted, hence the condition.
	it("offers the transmitted elements card when elements were transmitted", () => {
		renderConfirmation({ hasTransmittedElements: true });

		expect(screen.getByText(TRANSMITTED_CARD)).toBeInTheDocument();
	});

	it("omits the transmitted elements card when nothing was transmitted", () => {
		renderConfirmation();

		expect(screen.queryByText(TRANSMITTED_CARD)).not.toBeInTheDocument();
	});

	it("renders download cards as links with correct hrefs", () => {
		renderConfirmation({ hasTransmittedElements: true });

		const declarationLink = screen
			.getByText(/récapitulatif de la déclaration des indicateurs/)
			.closest("a");
		expect(declarationLink).toHaveAttribute(
			"href",
			`/api/declaration-pdf?year=${DECLARATION_YEAR}`,
		);
		expect(declarationLink).toHaveAttribute("download");

		const transmittedLink = screen.getByText(TRANSMITTED_CARD).closest("a");
		expect(transmittedLink).toHaveAttribute(
			"href",
			`/api/transmitted-pdf?year=${DECLARATION_YEAR}`,
		);
		expect(transmittedLink).toHaveAttribute("download");
	});

	it("renders second declaration download card with correction href", () => {
		renderConfirmation({ hasSecondDeclaration: true });

		const secondDeclLink = screen
			.getByText(/récapitulatif de la seconde déclaration/)
			.closest("a");
		expect(secondDeclLink).toHaveAttribute(
			"href",
			`/api/declaration-pdf?type=correction&year=${DECLARATION_YEAR}`,
		);
		expect(secondDeclLink).toHaveAttribute("download");
	});

	it("renders the feedback banner with the jedonnemonavis link", () => {
		renderConfirmation();

		expect(
			screen.getByText("Comment s'est passée votre démarche ?"),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /Je donne mon avis/ }),
		).toBeInTheDocument();
	});

	it("closes the funnel on Mon espace alone", () => {
		renderConfirmation();

		const spaceLink = screen.getByRole("link", { name: "Mon espace" });
		expect(spaceLink).toHaveAttribute("href", "/mon-espace");

		// The démarche is over: sending the user back to the upload step from the
		// confirmation screen invites them to redo a completed deposit (issue 3460).
		expect(
			screen.queryByRole("link", { name: /Modifier mes dépôts/ }),
		).not.toBeInTheDocument();
	});

	it("marks the completion pictogram as a success rather than an error", () => {
		const { container } = renderConfirmation();

		// Without the modifier, the DSFR artwork paints its check in Marianne red.
		expect(
			container.querySelector(".fr-artwork--green-emeraude"),
		).toBeInTheDocument();
	});
});
