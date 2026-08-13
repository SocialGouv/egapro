import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Confirmation } from "../Confirmation";
import { REPRESENTATION_CAMPAIGN_YEAR, REPRESENTATION_YEAR } from "./fixtures";

const DECLARANT_EMAIL = "declarant@example.fr";

function renderConfirmation({
	email = DECLARANT_EMAIL,
}: {
	email?: string | null;
} = {}) {
	return render(
		<Confirmation
			campaignYear={REPRESENTATION_CAMPAIGN_YEAR}
			email={email}
			referenceYear={REPRESENTATION_YEAR}
		/>,
	);
}

function pdfButton() {
	return screen.getByRole("button", {
		name: "Télécharger le récapitulatif (PDF)",
	});
}

function resendButton() {
	return screen.getByRole("button", { name: "Renvoyer l'accusé de réception" });
}

describe("Confirmation — fin de démarche", () => {
	it("titles the screen with the campaign year", () => {
		renderConfirmation();

		expect(
			screen.getByRole("heading", {
				level: 1,
				name: `Démarche des indicateurs de représentation ${REPRESENTATION_CAMPAIGN_YEAR}`,
			}),
		).toBeInTheDocument();
	});

	it("announces the completed journey", () => {
		renderConfirmation();

		expect(
			screen.getByText(
				`Votre parcours ${REPRESENTATION_CAMPAIGN_YEAR} est désormais terminé`,
			),
		).toBeInTheDocument();
	});

	it("names the address the acknowledgement was sent to", () => {
		renderConfirmation();

		expect(screen.getByText(DECLARANT_EMAIL)).toBeInTheDocument();
	});

	it("falls back on the account address when the session carries no e-mail", () => {
		renderConfirmation({ email: null });

		expect(screen.getByText("renseignée sur votre compte")).toBeInTheDocument();
	});

	it("recalls the campaign and the reference year of the recap", () => {
		renderConfirmation();

		expect(
			screen.getByText(
				`Année ${REPRESENTATION_CAMPAIGN_YEAR} au titre des données ${REPRESENTATION_YEAR}`,
			),
		).toBeInTheDocument();
	});

	it("leads back to the personal space", () => {
		renderConfirmation();

		expect(screen.getByRole("link", { name: "Mon espace" })).toHaveAttribute(
			"href",
			"/mon-espace",
		);
	});
});

describe("Confirmation — actions à venir", () => {
	it("offers the recap download, disabled until the PDF ticket lands", () => {
		renderConfirmation();

		expect(pdfButton()).toBeDisabled();
		expect(pdfButton()).toHaveAttribute("aria-disabled", "true");
	});

	it("offers the acknowledgement resend, disabled until the e-mail ticket lands", () => {
		renderConfirmation();

		expect(resendButton()).toBeDisabled();
		expect(resendButton()).toHaveAttribute("aria-disabled", "true");
	});
});
