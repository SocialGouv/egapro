import { render, screen } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { mockImpersonatingSession } from "~/test/impersonationMock";

const mockedUseSession = vi.mocked(useSession);

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
			<MissingInfoModal
				cseApplicable={true}
				hasCse={null}
				siren="532847196"
				userPhone={null}
			/>,
		);
		const dialog = container.querySelector("#missing-info-modal");
		expect(dialog).toBeInTheDocument();
		expect(
			container.querySelector("#missing-info-modal-title"),
		).toHaveTextContent("Informations manquantes");
	});

	it("shows both phone and CSE description when both are missing", () => {
		render(
			<MissingInfoModal
				cseApplicable={true}
				hasCse={null}
				siren="532847196"
				userPhone={null}
			/>,
		);
		expect(
			screen.getByText(
				"Pour continuer, vous devez ajouter un numéro de téléphone à votre profil et nous indiquer si un CSE a été mis en place.",
			),
		).toBeInTheDocument();
	});

	it("shows phone-only description when only phone is missing", () => {
		render(
			<MissingInfoModal
				cseApplicable={true}
				hasCse={true}
				siren="532847196"
				userPhone={null}
			/>,
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
				cseApplicable={true}
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
			<MissingInfoModal
				cseApplicable={true}
				hasCse={true}
				siren="532847196"
				userPhone={null}
			/>,
		);
		expect(screen.getByLabelText(/Numéro de téléphone/)).toBeInTheDocument();
	});

	it("does not render phone field when userPhone is provided", () => {
		render(
			<MissingInfoModal
				cseApplicable={true}
				hasCse={null}
				siren="532847196"
				userPhone="0122334455"
			/>,
		);
		expect(
			screen.queryByLabelText(/Numéro de téléphone/),
		).not.toBeInTheDocument();
	});

	it("renders CSE radio buttons when hasCse is null and CSE is applicable", () => {
		render(
			<MissingInfoModal
				cseApplicable={true}
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
			<MissingInfoModal
				cseApplicable={true}
				hasCse={true}
				siren="532847196"
				userPhone={null}
			/>,
		);
		expect(
			screen.queryByText(
				"Un CSE a-t-il été mis en place dans votre entreprise ?",
			),
		).not.toBeInTheDocument();
	});

	it("hides CSE radios and limits the description to the phone when CSE is not applicable", () => {
		render(
			<MissingInfoModal
				cseApplicable={false}
				hasCse={null}
				siren="532847196"
				userPhone={null}
			/>,
		);
		expect(
			screen.getByText(
				"Pour continuer, vous devez ajouter un numéro de téléphone à votre profil.",
			),
		).toBeInTheDocument();
		expect(
			screen.queryByText(
				"Un CSE a-t-il été mis en place dans votre entreprise ?",
			),
		).not.toBeInTheDocument();
		expect(screen.queryByLabelText("Oui")).not.toBeInTheDocument();
		expect(screen.queryByLabelText("Non")).not.toBeInTheDocument();
	});

	it("renders Enregistrer and Retour buttons", () => {
		render(
			<MissingInfoModal
				cseApplicable={true}
				hasCse={null}
				siren="532847196"
				userPhone={null}
			/>,
		);
		expect(
			screen.getByRole("button", { name: "Enregistrer", hidden: true }),
		).toHaveTextContent("Enregistrer");
		expect(screen.getByText("Retour")).toBeInTheDocument();
	});

	it("renders the close button", () => {
		render(
			<MissingInfoModal
				cseApplicable={true}
				hasCse={null}
				siren="532847196"
				userPhone={null}
			/>,
		);
		expect(screen.getByTitle("Fermer")).toBeInTheDocument();
	});

	it("Enregistrer button is not disabled when mutations are idle", () => {
		render(
			<MissingInfoModal
				cseApplicable={true}
				hasCse={null}
				siren="532847196"
				userPhone={null}
			/>,
		);
		expect(
			screen.getByRole("button", { name: "Enregistrer", hidden: true }),
		).not.toBeDisabled();
	});

	describe("admin impersonation", () => {
		afterEach(() => {
			mockedUseSession.mockReset();
		});

		it("does not render the modal when impersonating", () => {
			mockImpersonatingSession(mockedUseSession);

			const { container } = render(
				<MissingInfoModal
					cseApplicable={true}
					hasCse={null}
					siren="532847196"
					userPhone={null}
				/>,
			);
			expect(container.querySelector("#missing-info-modal")).toBeNull();
		});
	});
});
