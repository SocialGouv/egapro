import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	resendReceipt: vi.fn(),
}));

vi.mock("~/trpc/react", () => ({
	api: {
		mail: {
			resendReceipt: {
				useMutation: () => ({
					mutate: mocks.resendReceipt,
					isPending: false,
				}),
			},
		},
	},
}));

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

function pdfLink() {
	return screen.getByRole("link", {
		name: "Télécharger le récapitulatif de la déclaration",
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

	it("nests the recap card under a section heading, skipping no level", () => {
		renderConfirmation();

		expect(
			screen.getByRole("heading", {
				level: 2,
				name: "Documents récapitulatifs de la déclaration",
			}),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", {
				level: 3,
				name: "Télécharger le récapitulatif de la déclaration",
			}),
		).toContainElement(pdfLink());
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

describe("Confirmation — actions de fin de parcours", () => {
	beforeEach(() => {
		mocks.resendReceipt.mockClear();
	});

	it("downloads the recap of the reference year from the representation route (S20)", () => {
		renderConfirmation();

		const link = pdfLink();

		expect(link).toHaveAttribute(
			"href",
			`/api/representation-pdf?year=${REPRESENTATION_YEAR}`,
		);
		expect(link).toHaveAttribute("download");
		expect(link).not.toHaveAttribute("aria-disabled");
	});

	it("offers an actionable acknowledgement resend", () => {
		renderConfirmation();

		expect(resendButton()).toBeEnabled();
		expect(resendButton()).not.toHaveAttribute("aria-disabled");
	});

	it("resends the acknowledgement of the representation declaration (S20)", async () => {
		const user = userEvent.setup();
		renderConfirmation();

		await user.click(resendButton());

		expect(mocks.resendReceipt).toHaveBeenCalledWith({
			kind: "representation",
			year: REPRESENTATION_YEAR,
		});
	});
});
