import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmationPage } from "../ConfirmationPage";

vi.mock(
	"~/trpc/react",
	async () => await import("~/test/resendReceiptApiMock"),
);

const DECLARATION_YEAR = 2025;
const COMPANY_NAME = "Société Démo";

const CSE_OPINION_CARD =
	/récapitulatif de la transmission du ou des avis du CSE/;
const TRANSMITTED_CARD = /récapitulatif des éléments transmis/;
const JOINT_EVALUATION_CARD =
	"Télécharger le récapitulatif de l'évaluation conjointe des rémunérations";

type Overrides = {
	companyName?: string;
	email?: string;
	hasSecondDeclaration?: boolean;
	hasSubmittedCseOpinion?: boolean;
	hasTransmittedJointEvaluation?: boolean;
};

function renderConfirmation(overrides: Overrides = {}) {
	return render(
		<ConfirmationPage
			companyName={COMPANY_NAME}
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

	it("offers the joint evaluation recap once the joint evaluation is transmitted", () => {
		renderConfirmation({ hasTransmittedJointEvaluation: true });

		expect(
			screen.getByRole("link", { name: JOINT_EVALUATION_CARD }),
		).toHaveAttribute(
			"href",
			`/api/joint-evaluation-pdf?year=${DECLARATION_YEAR}`,
		);
	});

	it("omits the joint evaluation recap by default", () => {
		renderConfirmation();

		expect(
			screen.queryByRole("link", { name: JOINT_EVALUATION_CARD }),
		).not.toBeInTheDocument();
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

	it("offers the CSE opinion recap card once a CSE opinion was transmitted", () => {
		renderConfirmation({ hasSubmittedCseOpinion: true });

		expect(screen.getByText(CSE_OPINION_CARD)).toBeInTheDocument();
		expect(screen.queryByText(TRANSMITTED_CARD)).not.toBeInTheDocument();
	});

	it("omits the CSE opinion recap card when no CSE opinion was transmitted", () => {
		renderConfirmation();

		expect(screen.queryByText(CSE_OPINION_CARD)).not.toBeInTheDocument();
	});

	it("renders download cards as links with correct hrefs", () => {
		renderConfirmation({ hasSubmittedCseOpinion: true });

		const declarationLink = screen
			.getByText(/récapitulatif de la déclaration des indicateurs/)
			.closest("a");
		expect(declarationLink).toHaveAttribute(
			"href",
			`/api/declaration-pdf?year=${DECLARATION_YEAR}`,
		);
		expect(declarationLink).toHaveAttribute("download");

		const cseOpinionLink = screen.getByText(CSE_OPINION_CARD).closest("a");
		expect(cseOpinionLink).toHaveAttribute(
			"href",
			`/api/cse-opinion-pdf?year=${DECLARATION_YEAR}`,
		);
		expect(cseOpinionLink).toHaveAttribute("download");
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

	it("names the received company in the publication notice", () => {
		renderConfirmation({ companyName: "Autre Société" });

		expect(screen.getByText(/déclarés par Autre Société/)).toBeInTheDocument();
	});
});
