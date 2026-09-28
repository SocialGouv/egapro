import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
	"~/trpc/react",
	async () => await import("~/test/resendReceiptApiMock"),
);

import { resendReceiptMutate } from "~/test/resendReceiptApiMock";
import { DemarcheConfirmation } from "../DemarcheConfirmation";
import type { DemarcheDocument } from "../demarcheDocuments";

const YEAR = 2025;
const DATA_YEAR = YEAR - 1;
const EMAIL = "declarant@example.fr";
const TITLE = `Démarche des indicateurs de rémunération ${YEAR}`;
const SUCCESS_MESSAGE = `Votre parcours ${YEAR} est désormais terminé`;

const RECAP: DemarcheDocument = {
	dataYear: DATA_YEAR,
	href: `/api/declaration-pdf?year=${YEAR}`,
	title: "Télécharger le récapitulatif de la déclaration des indicateurs",
	year: YEAR,
};

const TRANSMITTED: DemarcheDocument = {
	dataYear: DATA_YEAR,
	href: `/api/transmitted-pdf?year=${YEAR}`,
	title: "Télécharger le récapitulatif des éléments transmis",
	year: YEAR,
};

type Overrides = {
	children?: React.ReactNode;
	documents?: DemarcheDocument[];
	documentsTitle?: string;
	documentsTitleHidden?: boolean;
};

function renderConfirmation({ documents = [RECAP], ...rest }: Overrides = {}) {
	return render(
		<DemarcheConfirmation
			documents={documents}
			email={EMAIL}
			receiptKind="declaration"
			receiptYear={YEAR}
			successMessage={SUCCESS_MESSAGE}
			title={TITLE}
			{...rest}
		/>,
	);
}

function resendButton() {
	return screen.getByRole("button", { name: "Renvoyer l'accusé de réception" });
}

beforeEach(() => {
	resendReceiptMutate.mockClear();
});

describe("DemarcheConfirmation", () => {
	it("titles the screen and announces the completion", () => {
		renderConfirmation();

		expect(
			screen.getByRole("heading", { level: 1, name: TITLE }),
		).toBeInTheDocument();
		expect(screen.getByText(SUCCESS_MESSAGE)).toBeInTheDocument();
	});

	it("marks the completion pictogram as a success rather than an error", () => {
		const { container } = renderConfirmation();

		// Without the modifier, the DSFR artwork paints its check in Marianne red.
		expect(
			container.querySelector(".fr-artwork--green-emeraude"),
		).toBeInTheDocument();
	});

	it("names the address the acknowledgement was sent to", () => {
		renderConfirmation();

		expect(
			screen.getByText(/Un accusé de réception a été envoyé/),
		).toBeInTheDocument();
		expect(screen.getByText(EMAIL)).toBeInTheDocument();
	});

	it("greys out the spam notice with the real DSFR utility class", () => {
		renderConfirmation();

		expect(screen.getByText(/vérifiez vos courriers indésirables/)).toHaveClass(
			"fr-text-mention--grey",
		);
	});

	// The maquette sizes this button at 40px; only the banners pin the small one.
	it("offers the resend button at the default DSFR size", () => {
		renderConfirmation();

		expect(resendButton()).toHaveClass("fr-btn", "fr-btn--tertiary");
		expect(resendButton()).not.toHaveClass("fr-btn--sm");
	});

	it("resends the receipt for the kind and year it was given", async () => {
		renderConfirmation();

		await userEvent.click(resendButton());

		expect(resendReceiptMutate).toHaveBeenCalledWith({
			kind: "declaration",
			year: YEAR,
		});
	});

	it("renders every document as a download card, in the order given", () => {
		renderConfirmation({ documents: [RECAP, TRANSMITTED] });

		const links = screen.getAllByRole("link", {
			name: /Télécharger le récapitulatif/,
		});
		expect(links.map((link) => link.getAttribute("href"))).toEqual([
			RECAP.href,
			TRANSMITTED.href,
		]);
		expect(links[0]).toHaveAttribute("download");
		expect(
			screen.getAllByText(`Année ${YEAR} au titre des données ${DATA_YEAR}`),
		).toHaveLength(2);
	});

	it("renders no card when the démarche produced no document", () => {
		renderConfirmation({ documents: [] });

		expect(
			screen.queryByRole("link", { name: /Télécharger le récapitulatif/ }),
		).not.toBeInTheDocument();
	});

	it("heads the documents section visibly by default", () => {
		renderConfirmation();

		const heading = screen.getByRole("heading", {
			level: 2,
			name: "Documents récapitulatifs de votre démarche",
		});
		expect(heading).toHaveClass("fr-h5");
		expect(heading).not.toHaveClass("fr-sr-only");
	});

	it("accepts a caller-supplied documents heading", () => {
		renderConfirmation({ documentsTitle: "Documents de votre déclaration" });

		expect(
			screen.getByRole("heading", {
				level: 2,
				name: "Documents de votre déclaration",
			}),
		).toBeInTheDocument();
	});

	// Hidden rather than dropped: assistive technology still needs the heading.
	it("keeps the documents heading for screen readers when it is hidden", () => {
		renderConfirmation({ documentsTitleHidden: true });

		expect(
			screen.getByRole("heading", {
				level: 2,
				name: "Documents récapitulatifs de votre démarche",
			}),
		).toHaveClass("fr-sr-only");
	});

	it("renders the caller's own content above the acknowledgement", () => {
		renderConfirmation({
			children: <p>Votre entreprise ne dispose pas de CSE.</p>,
		});

		expect(
			screen.getByText("Votre entreprise ne dispose pas de CSE."),
		).toBeInTheDocument();
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

	it("closes the démarche on a single Mon espace action", () => {
		renderConfirmation();

		expect(screen.getByRole("link", { name: "Mon espace" })).toHaveAttribute(
			"href",
			"/mon-espace",
		);
	});
});
