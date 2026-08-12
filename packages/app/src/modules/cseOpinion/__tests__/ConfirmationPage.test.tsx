import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmationPage } from "../ConfirmationPage";

vi.mock("~/trpc/react", () => ({
	api: {
		mail: {
			resendReceipt: {
				useMutation: () => ({ mutate: vi.fn(), isPending: false }),
			},
		},
	},
}));

const DECLARATION_YEAR = 2025;

describe("ConfirmationPage", () => {
	it("renders the page title", () => {
		render(
			<ConfirmationPage
				dataYear={DECLARATION_YEAR - 1}
				declarationYear={DECLARATION_YEAR}
			/>,
		);

		expect(
			screen.getByText(
				`Démarche des indicateurs de rémunération ${DECLARATION_YEAR}`,
			),
		).toBeInTheDocument();
	});

	it("renders the success message", () => {
		render(
			<ConfirmationPage
				dataYear={DECLARATION_YEAR - 1}
				declarationYear={DECLARATION_YEAR}
			/>,
		);

		expect(
			screen.getByText(
				`Votre parcours ${DECLARATION_YEAR} est désormais terminé`,
			),
		).toBeInTheDocument();
	});

	it("renders the default email in receipt card", () => {
		render(
			<ConfirmationPage
				dataYear={DECLARATION_YEAR - 1}
				declarationYear={DECLARATION_YEAR}
			/>,
		);

		expect(screen.getByText("adresse@exemple.fr")).toBeInTheDocument();
	});

	it("renders the provided email in receipt card", () => {
		render(
			<ConfirmationPage
				dataYear={DECLARATION_YEAR - 1}
				declarationYear={DECLARATION_YEAR}
				email="test@example.com"
			/>,
		);

		expect(screen.getByText("test@example.com")).toBeInTheDocument();
	});

	it("renders the resend button", () => {
		render(
			<ConfirmationPage
				dataYear={DECLARATION_YEAR - 1}
				declarationYear={DECLARATION_YEAR}
			/>,
		);

		expect(
			screen.getByRole("button", {
				name: /Renvoyer l'accusé de réception/,
			}),
		).toBeInTheDocument();
	});

	it("renders document download section without second declaration card", () => {
		render(
			<ConfirmationPage
				dataYear={DECLARATION_YEAR - 1}
				declarationYear={DECLARATION_YEAR}
			/>,
		);

		expect(
			screen.getByText("Documents récapitulatifs de votre déclaration"),
		).toBeInTheDocument();
		expect(
			screen.getByText(/récapitulatif de la déclaration des indicateurs/),
		).toBeInTheDocument();
		expect(
			screen.queryByText(/récapitulatif de la seconde déclaration/),
		).not.toBeInTheDocument();
		expect(
			screen.getByText(/récapitulatif des éléments transmis/),
		).toBeInTheDocument();
	});

	it("renders second declaration card when hasSecondDeclaration is true", () => {
		render(
			<ConfirmationPage
				dataYear={DECLARATION_YEAR - 1}
				declarationYear={DECLARATION_YEAR}
				hasSecondDeclaration
			/>,
		);

		expect(
			screen.getByText(/récapitulatif de la déclaration des indicateurs/),
		).toBeInTheDocument();
		expect(
			screen.getByText(/récapitulatif de la seconde déclaration/),
		).toBeInTheDocument();
		expect(
			screen.getByText(/récapitulatif des éléments transmis/),
		).toBeInTheDocument();
	});

	it("renders download cards as links with correct hrefs", () => {
		render(
			<ConfirmationPage
				dataYear={DECLARATION_YEAR - 1}
				declarationYear={DECLARATION_YEAR}
			/>,
		);

		const declarationLink = screen
			.getByText(/récapitulatif de la déclaration des indicateurs/)
			.closest("a");
		expect(declarationLink).toHaveAttribute(
			"href",
			`/api/declaration-pdf?year=${DECLARATION_YEAR}`,
		);
		expect(declarationLink).toHaveAttribute("download");

		const transmittedLink = screen
			.getByText(/récapitulatif des éléments transmis/)
			.closest("a");
		expect(transmittedLink).toHaveAttribute(
			"href",
			`/api/transmitted-pdf?year=${DECLARATION_YEAR}`,
		);
		expect(transmittedLink).toHaveAttribute("download");
	});

	it("renders second declaration download card with correction href", () => {
		render(
			<ConfirmationPage
				dataYear={DECLARATION_YEAR - 1}
				declarationYear={DECLARATION_YEAR}
				hasSecondDeclaration
			/>,
		);

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
		render(
			<ConfirmationPage
				dataYear={DECLARATION_YEAR - 1}
				declarationYear={DECLARATION_YEAR}
			/>,
		);

		expect(
			screen.getByText("Comment s'est passée votre démarche ?"),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /Je donne mon avis/ }),
		).toBeInTheDocument();
	});

	it("closes the funnel on Mon espace alone", () => {
		render(
			<ConfirmationPage
				dataYear={DECLARATION_YEAR - 1}
				declarationYear={DECLARATION_YEAR}
			/>,
		);

		const spaceLink = screen.getByRole("link", { name: "Mon espace" });
		expect(spaceLink).toHaveAttribute("href", "/mon-espace");

		// The démarche is over: sending the user back to the upload step from the
		// confirmation screen invites them to redo a completed deposit (issue 3460).
		expect(
			screen.queryByRole("link", { name: /Modifier mes dépôts/ }),
		).not.toBeInTheDocument();
	});

	it("marks the completion pictogram as a success rather than an error", () => {
		const { container } = render(
			<ConfirmationPage
				dataYear={DECLARATION_YEAR - 1}
				declarationYear={DECLARATION_YEAR}
			/>,
		);

		// Without the modifier, the DSFR artwork paints its check in Marianne red.
		expect(
			container.querySelector(".fr-artwork--green-emeraude"),
		).toBeInTheDocument();
	});
});
