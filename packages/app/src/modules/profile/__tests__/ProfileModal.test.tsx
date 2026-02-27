import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mockRefetch = vi.fn().mockResolvedValue({
	data: {
		firstName: "Julien",
		lastName: "Martin",
		email: "julien.martin@alpha-solution.fr",
		phone: "01 22 33 44 55",
	},
});

const mockMutate = vi.fn();

vi.mock("~/trpc/react", () => ({
	api: {
		profile: {
			get: {
				useQuery: () => ({
					data: {
						firstName: "Julien",
						lastName: "Martin",
						email: "julien.martin@alpha-solution.fr",
						phone: "01 22 33 44 55",
					},
					refetch: mockRefetch,
				}),
			},
			updatePhone: {
				useMutation: ({ onSuccess }: { onSuccess?: () => void }) => ({
					mutate: (input: { phone: string }) => {
						mockMutate(input);
						onSuccess?.();
					},
					isPending: false,
				}),
			},
		},
	},
}));

import { ProfileModal } from "../ProfileModal";

// Dialog elements are hidden when not open, so role queries need { hidden: true }.
const hiddenOpt = { hidden: true } as const;

function getPhoneInput() {
	const input = document.getElementById("profile-phone");
	if (!input) throw new Error("Phone input not found");
	return input;
}

function getForm() {
	const form = document.getElementById("profile-form");
	if (!form) throw new Error("Form not found");
	return form;
}

describe("ProfileModal", () => {
	it("renders a dialog element with correct id and aria attributes", () => {
		render(<ProfileModal />);
		const dialog = document.getElementById("profile-modal");
		expect(dialog).toBeInTheDocument();
		expect(dialog?.tagName).toBe("DIALOG");
		expect(dialog).toHaveAttribute("aria-labelledby", "profile-modal-title");
		expect(dialog).toHaveClass("fr-modal");
	});

	it("renders the modal title", () => {
		render(<ProfileModal />);
		expect(screen.getByText("Mon profil")).toBeInTheDocument();
		expect(screen.getByText("Mon profil").id).toBe("profile-modal-title");
	});

	it("renders the description paragraph", () => {
		render(<ProfileModal />);
		expect(
			screen.getByText(
				/Les informations sont issues de votre compte ProConnect/,
			),
		).toBeInTheDocument();
	});

	it("renders the close button", () => {
		render(<ProfileModal />);
		const closeButton = screen.getByTitle("Fermer");
		expect(closeButton).toBeInTheDocument();
		expect(closeButton).toHaveAttribute("aria-controls", "profile-modal");
	});

	it("renders the readonly Nom field with label and edit icon", () => {
		render(<ProfileModal />);
		expect(screen.getByText("Nom")).toBeInTheDocument();
		expect(screen.getByText("Martin")).toBeInTheDocument();
	});

	it("renders the readonly Prénom field with label and edit icon", () => {
		render(<ProfileModal />);
		expect(screen.getByText("Prénom")).toBeInTheDocument();
		expect(screen.getByText("Julien")).toBeInTheDocument();
	});

	it("renders the readonly Email field", () => {
		render(<ProfileModal />);
		expect(screen.getByText("Email du déclarant")).toBeInTheDocument();
		expect(
			screen.getByText("julien.martin@alpha-solution.fr"),
		).toBeInTheDocument();
	});

	it("renders the phone input with label and hint", () => {
		render(<ProfileModal />);
		expect(
			screen.getByText("Numéro de téléphone (obligatoire)"),
		).toBeInTheDocument();
		expect(
			screen.getByText("Format attendu : 01 22 33 44 55"),
		).toBeInTheDocument();
		const input = getPhoneInput();
		expect(input).toHaveAttribute("type", "tel");
	});

	it("renders the Enregistrer and Annuler buttons", () => {
		render(<ProfileModal />);
		expect(
			screen.getByRole("button", { name: "Enregistrer", ...hiddenOpt }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Annuler", ...hiddenOpt }),
		).toBeInTheDocument();
	});

	it("renders the Annuler button with aria-controls for the modal", () => {
		render(<ProfileModal />);
		expect(
			screen.getByRole("button", { name: "Annuler", ...hiddenOpt }),
		).toHaveAttribute("aria-controls", "profile-modal");
	});

	it("shows validation error when submitting empty phone", () => {
		render(<ProfileModal />);
		fireEvent.change(getPhoneInput(), { target: { value: "" } });
		fireEvent.submit(getForm());
		expect(
			screen.getByText("Le numéro de téléphone est obligatoire."),
		).toBeInTheDocument();
	});

	it("shows validation error for invalid phone format", () => {
		render(<ProfileModal />);
		fireEvent.change(getPhoneInput(), { target: { value: "0122334455" } });
		fireEvent.submit(getForm());
		const errorMessage = document.querySelector(
			"#profile-phone-messages .fr-message--error",
		);
		expect(errorMessage).toBeInTheDocument();
		expect(errorMessage).toHaveTextContent("Format attendu : 01 22 33 44 55");
	});

	it("calls mutation with valid phone on form submit", () => {
		render(<ProfileModal />);
		fireEvent.change(getPhoneInput(), {
			target: { value: "01 22 33 44 55" },
		});
		fireEvent.submit(getForm());
		expect(mockMutate).toHaveBeenCalledWith({ phone: "01 22 33 44 55" });
	});

	it("clears error when user types after validation failure", () => {
		render(<ProfileModal />);
		const input = getPhoneInput();
		fireEvent.change(input, { target: { value: "" } });
		fireEvent.submit(getForm());
		expect(
			screen.getByText("Le numéro de téléphone est obligatoire."),
		).toBeInTheDocument();
		fireEvent.change(input, { target: { value: "0" } });
		expect(
			screen.queryByText("Le numéro de téléphone est obligatoire."),
		).not.toBeInTheDocument();
	});

	it("has proper aria-describedby on the phone input", () => {
		render(<ProfileModal />);
		expect(getPhoneInput()).toHaveAttribute(
			"aria-describedby",
			"profile-phone-messages",
		);
	});

	it("has a messages group with aria-live polite for phone field", () => {
		render(<ProfileModal />);
		const messagesGroup = document.getElementById("profile-phone-messages");
		expect(messagesGroup).toBeInTheDocument();
		expect(messagesGroup).toHaveAttribute("aria-live", "polite");
	});
});
