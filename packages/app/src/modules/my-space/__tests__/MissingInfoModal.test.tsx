import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("~/trpc/react", () => ({
	api: {
		company: {
			updateHasCse: {
				useMutation: vi.fn().mockReturnValue({
					mutate: vi.fn(),
					mutateAsync: vi.fn(),
					isPending: false,
				}),
			},
		},
		profile: {
			updatePhone: {
				useMutation: vi.fn().mockReturnValue({
					mutate: vi.fn(),
					mutateAsync: vi.fn(),
					isPending: false,
				}),
			},
		},
	},
}));

import { MissingInfoModal } from "../MissingInfoModal";

describe("MissingInfoModal", () => {
	it("renders the modal with correct id and title", () => {
		const { container } = render(
			<MissingInfoModal hasCse={null} siren="532847196" userPhone={null} />,
		);
		const dialog = container.querySelector("#missing-info-modal");
		expect(dialog).toBeInTheDocument();
		expect(
			container.querySelector("#missing-info-modal-title"),
		).toHaveTextContent("Informations manquantes");
	});

	it("shows both phone and CSE description when both are missing", () => {
		render(
			<MissingInfoModal hasCse={null} siren="532847196" userPhone={null} />,
		);
		expect(
			screen.getByText(
				"Pour continuer, vous devez renseigner un numéro de téléphone et indiquer si un CSE a été mis en place dans votre entreprise.",
			),
		).toBeInTheDocument();
	});

	it("shows phone-only description when only phone is missing", () => {
		render(
			<MissingInfoModal hasCse={true} siren="532847196" userPhone={null} />,
		);
		expect(
			screen.getByText(
				"Pour continuer, vous devez ajouter un numéro de téléphone à votre profil.",
			),
		).toBeInTheDocument();
	});

	it("shows CSE-only description when only CSE is missing", () => {
		render(
			<MissingInfoModal
				hasCse={null}
				siren="532847196"
				userPhone="0122334455"
			/>,
		);
		expect(
			screen.getByText(
				"Pour continuer, vous devez indiquer si un CSE a été mis en place dans votre entreprise.",
			),
		).toBeInTheDocument();
	});

	it("renders phone field when userPhone is null", () => {
		render(
			<MissingInfoModal hasCse={true} siren="532847196" userPhone={null} />,
		);
		expect(screen.getByLabelText(/Numéro de téléphone/)).toBeInTheDocument();
	});

	it("does not render phone field when userPhone is provided", () => {
		render(
			<MissingInfoModal
				hasCse={null}
				siren="532847196"
				userPhone="0122334455"
			/>,
		);
		expect(
			screen.queryByLabelText(/Numéro de téléphone/),
		).not.toBeInTheDocument();
	});

	it("renders CSE radio buttons when hasCse is null", () => {
		render(
			<MissingInfoModal
				hasCse={null}
				siren="532847196"
				userPhone="0122334455"
			/>,
		);
		expect(screen.getByLabelText("Oui")).toBeInTheDocument();
		expect(screen.getByLabelText("Non")).toBeInTheDocument();
		expect(
			screen.getByText(
				"Un CSE a-t-il été mis en place dans votre entreprise ?",
			),
		).toBeInTheDocument();
	});

	it("does not render CSE radio buttons when hasCse is provided", () => {
		render(
			<MissingInfoModal hasCse={true} siren="532847196" userPhone={null} />,
		);
		expect(
			screen.queryByText(
				"Un CSE a-t-il été mis en place dans votre entreprise ?",
			),
		).not.toBeInTheDocument();
	});

	it("renders Enregistrer and Retour buttons", () => {
		const { container } = render(
			<MissingInfoModal hasCse={null} siren="532847196" userPhone={null} />,
		);
		expect(container.querySelector("button[type='submit']")).toHaveTextContent(
			"Enregistrer",
		);
		expect(screen.getByText("Retour")).toBeInTheDocument();
	});

	it("renders the close button", () => {
		render(
			<MissingInfoModal hasCse={null} siren="532847196" userPhone={null} />,
		);
		expect(screen.getByTitle("Fermer")).toBeInTheDocument();
	});

	it("Enregistrer button is not disabled when mutations are idle", () => {
		const { container } = render(
			<MissingInfoModal hasCse={null} siren="532847196" userPhone={null} />,
		);
		expect(container.querySelector("button[type='submit']")).not.toBeDisabled();
	});
});
