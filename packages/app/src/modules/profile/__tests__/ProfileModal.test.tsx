import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type ProfileData = {
	firstName: string | null;
	lastName: string | null;
	email: string | null;
	phone: string | null;
};

const { mockMutate, mockRefetch, trpcState } = vi.hoisted(() => ({
	mockMutate: vi.fn(),
	mockRefetch: vi.fn(),
	trpcState: {
		profile: null as {
			firstName: string | null;
			lastName: string | null;
			email: string | null;
			phone: string | null;
		} | null,
		isPending: false,
	},
}));

vi.mock("~/trpc/react", () => ({
	api: {
		profile: {
			get: {
				useQuery: () => ({ data: trpcState.profile, refetch: mockRefetch }),
			},
			updateProfile: {
				useMutation: ({ onSuccess }: { onSuccess?: () => void }) => ({
					mutate: (input: unknown) => {
						mockMutate(input);
						onSuccess?.();
					},
					isPending: trpcState.isPending,
				}),
			},
		},
	},
}));

import { ProfileModal } from "../ProfileModal";

const PROFILE: ProfileData = {
	firstName: "Julien",
	lastName: "Martin",
	email: "julien.martin@alpha-solution.fr",
	phone: "01 22 33 44 55",
};

const MODAL_ID = "profile-modal";

// Dialog elements are hidden when not open, so role queries need { hidden: true }.
const hiddenOpt = { hidden: true } as const;

const identityFields = [
	{ inputId: "profile-last-name", label: "Nom" },
	{ inputId: "profile-first-name", label: "Prénom" },
];

function getElement(id: string) {
	const element = document.getElementById(id);
	if (!element) throw new Error(`Element #${id} not found`);
	return element;
}

function openDialog() {
	const callsBefore = mockRefetch.mock.calls.length;
	getElement(MODAL_ID).setAttribute("open", "");
	return waitFor(() => {
		expect(mockRefetch.mock.calls.length).toBeGreaterThan(callsBefore);
		expect(getElement("profile-phone")).toHaveValue(
			trpcState.profile?.phone ?? "",
		);
	});
}

function closeDialog() {
	getElement(MODAL_ID).removeAttribute("open");
}

async function renderOpenModal() {
	render(<ProfileModal />);
	await openDialog();
}

beforeEach(() => {
	trpcState.profile = { ...PROFILE };
	trpcState.isPending = false;
	mockMutate.mockClear();
	mockRefetch
		.mockReset()
		.mockImplementation(() => Promise.resolve({ data: trpcState.profile }));
});

afterEach(() => {
	delete (window as unknown as { dsfr?: unknown }).dsfr;
});

describe("ProfileModal — shell", () => {
	it("renders a dialog element with correct id and aria attributes", () => {
		render(<ProfileModal />);
		const dialog = document.getElementById(MODAL_ID);
		expect(dialog?.tagName).toBe("DIALOG");
		expect(dialog).toHaveAttribute("aria-labelledby", "profile-modal-title");
		expect(dialog).toHaveClass("fr-modal");
	});

	it("renders the modal title", () => {
		render(<ProfileModal />);
		expect(screen.getByText("Mon profil").id).toBe("profile-modal-title");
	});

	it("renders the close button", () => {
		render(<ProfileModal />);
		expect(screen.getByTitle("Fermer")).toHaveAttribute(
			"aria-controls",
			MODAL_ID,
		);
	});

	it("renders the help tooltip button", () => {
		const { container } = render(<ProfileModal />);
		const helpButton = screen.getByRole("button", {
			name: "Aide",
			...hiddenOpt,
		});
		expect(helpButton).toHaveAttribute("aria-describedby", "profile-tooltip");
		expect(container.querySelector("#profile-tooltip")).toHaveTextContent(
			"Vous pouvez aussi modifier ces informations directement sur votre profil ProConnect.",
		);
	});

	it("renders the Enregistrer and Annuler buttons", () => {
		render(<ProfileModal />);
		expect(
			screen.getByRole("button", { name: "Enregistrer", ...hiddenOpt }),
		).toBeEnabled();
		expect(
			screen.getByRole("button", { name: "Annuler", ...hiddenOpt }),
		).toHaveAttribute("aria-controls", MODAL_ID);
	});

	it("disables the submit button while the mutation is pending", () => {
		trpcState.isPending = true;
		render(<ProfileModal />);
		expect(
			screen.getByRole("button", { name: "Enregistrer", ...hiddenOpt }),
		).toBeDisabled();
	});
});

describe("ProfileModal — intro copy", () => {
	it("renders the instruction paragraph followed by the obligatory-fields mention", () => {
		render(<ProfileModal />);
		const instruction = screen.getByText(
			"Vérifier les données affichées et compléter les informations manquantes si nécessaire.",
		);
		const mention = screen.getByText("Tous les champs sont obligatoires.");

		expect(instruction.nextElementSibling).toBe(mention);
		expect(instruction).toHaveClass("fr-text-title--grey");
		expect(mention).toHaveClass("fr-text-title--grey");
	});
});

describe("ProfileModal — identity fields", () => {
	it.each(identityFields)("renders $label as an editable DSFR text input", ({
		inputId,
		label,
	}) => {
		render(<ProfileModal />);
		const input = screen.getByLabelText(label);

		expect(input).toHaveAttribute("id", inputId);
		expect(input).toHaveAttribute("type", "text");
		expect(input).toHaveAttribute("aria-required", "true");
		expect(input).toHaveAttribute("aria-describedby", `${inputId}-messages`);
		expect(input).toHaveClass("fr-input");
		expect(input).not.toHaveAttribute("readonly");
		expect(input).not.toHaveAttribute("aria-invalid");
		expect(getElement(`${inputId}-messages`)).toHaveAttribute(
			"aria-live",
			"polite",
		);
	});

	it("prefills the identity fields from the profile query when the dialog opens", async () => {
		await renderOpenModal();

		expect(screen.getByLabelText("Nom")).toHaveValue("Martin");
		expect(screen.getByLabelText("Prénom")).toHaveValue("Julien");
	});

	it("clears every field when the stored profile is empty", async () => {
		trpcState.profile = {
			...PROFILE,
			firstName: null,
			lastName: null,
			phone: null,
		};
		render(<ProfileModal />);
		fireEvent.change(screen.getByLabelText("Nom"), {
			target: { value: "stale" },
		});
		fireEvent.change(getElement("profile-phone"), {
			target: { value: "09 99 99 99 99" },
		});

		getElement(MODAL_ID).setAttribute("open", "");

		await waitFor(() => {
			expect(screen.getByLabelText("Nom")).toHaveValue("");
		});
		expect(screen.getByLabelText("Prénom")).toHaveValue("");
		expect(getElement("profile-phone")).toHaveValue("");
	});

	it("leaves the form on its defaults when the profile query returns nothing", async () => {
		trpcState.profile = null;
		await renderOpenModal();

		expect(screen.getByLabelText("Nom")).toHaveValue("");
		expect(getElement("profile-phone")).toHaveValue("");
	});

	it("survives a failing profile query", async () => {
		mockRefetch.mockRejectedValue(new Error("network down"));
		render(<ProfileModal />);
		getElement(MODAL_ID).setAttribute("open", "");

		await waitFor(() => {
			expect(mockRefetch).toHaveBeenCalled();
		});
		expect(screen.getByLabelText("Nom")).toHaveValue("");
		expect(
			screen.getByRole("button", { name: "Enregistrer", ...hiddenOpt }),
		).toBeEnabled();
	});

	it("discards unsaved edits when the dialog is reopened", async () => {
		await renderOpenModal();
		fireEvent.change(screen.getByLabelText("Nom"), {
			target: { value: "Dupont" },
		});
		fireEvent.change(getElement("profile-phone"), {
			target: { value: "09 99 99 99 99" },
		});

		closeDialog();
		await openDialog();

		expect(screen.getByLabelText("Nom")).toHaveValue("Martin");
		expect(getElement("profile-phone")).toHaveValue("01 22 33 44 55");
	});
});

describe("ProfileModal — email block", () => {
	it("renders the e-mail in bold with the ProConnect source mention", () => {
		render(<ProfileModal />);
		const value = screen.getByText("julien.martin@alpha-solution.fr");

		expect(value.tagName).toBe("STRONG");
		expect(value.parentElement).toHaveTextContent(
			"E-mail : julien.martin@alpha-solution.fr",
		);
		expect(screen.getByText("Source : ProConnect.")).toHaveClass(
			"fr-text--sm",
			"fr-text-mention--grey",
		);
	});

	it("falls back to a dash when the profile carries no e-mail", () => {
		trpcState.profile = { ...PROFILE, email: null };
		render(<ProfileModal />);

		expect(screen.getByText("—").tagName).toBe("STRONG");
	});

	it("exposes no editable e-mail control", () => {
		render(<ProfileModal />);

		expect(screen.queryByLabelText(/e-?mail/i)).not.toBeInTheDocument();
	});
});

describe("ProfileModal — phone field", () => {
	it("renders the phone input with its label and hint", () => {
		render(<ProfileModal />);
		const input = screen.getByLabelText(/Numéro de téléphone/);

		expect(input).toHaveAttribute("type", "tel");
		expect(screen.getByText("Numéro de téléphone")).toBeInTheDocument();
		expect(
			screen.getByText("Format attendu : 01 22 33 44 55 ou +33 1 22 33 44 55"),
		).toBeInTheDocument();
	});
});

describe("ProfileModal — validation", () => {
	it.each(
		identityFields,
	)("blocks the submit and flags $label when it is emptied", async ({
		inputId,
		label,
	}) => {
		await renderOpenModal();
		fireEvent.change(screen.getByLabelText(label), { target: { value: "" } });
		fireEvent.submit(getElement("profile-form"));

		await waitFor(() => {
			expect(
				document.querySelector(`#${inputId}-messages .fr-message--error`),
			).toHaveTextContent("Ce champ est obligatoire");
		});
		expect(getElement(inputId).closest(".fr-input-group")).toHaveClass(
			"fr-input-group--error",
		);
		expect(getElement(inputId)).toHaveAttribute("aria-invalid", "true");
		expect(mockMutate).not.toHaveBeenCalled();
	});

	it("keeps the phone format hint and shows the generic error when invalid", async () => {
		await renderOpenModal();
		fireEvent.change(getElement("profile-phone"), {
			target: { value: "012233" },
		});
		fireEvent.submit(getElement("profile-form"));

		await waitFor(() => {
			expect(
				document.querySelector("#profile-phone-messages .fr-message--error"),
			).toHaveTextContent("Veuillez renseigner votre numéro de téléphone");
		});
		expect(
			screen.getByText("Format attendu : 01 22 33 44 55 ou +33 1 22 33 44 55"),
		).toBeVisible();
		expect(getElement("profile-phone")).toHaveAttribute("aria-invalid", "true");
		expect(mockMutate).not.toHaveBeenCalled();
	});

	it("clears the errors once the form is resubmitted with valid data", async () => {
		await renderOpenModal();
		fireEvent.change(screen.getByLabelText("Nom"), { target: { value: "" } });
		fireEvent.submit(getElement("profile-form"));
		await waitFor(() => {
			expect(
				document.querySelector(
					"#profile-last-name-messages .fr-message--error",
				),
			).toBeInTheDocument();
		});

		fireEvent.change(screen.getByLabelText("Nom"), {
			target: { value: "Martin" },
		});
		fireEvent.submit(getElement("profile-form"));

		await waitFor(() => {
			expect(mockMutate).toHaveBeenCalled();
		});
		expect(
			document.querySelector("#profile-last-name-messages .fr-message--error"),
		).not.toBeInTheDocument();
	});
});

describe("ProfileModal — submission", () => {
	it("sends the edited identity along with the canonical phone", async () => {
		await renderOpenModal();
		fireEvent.change(screen.getByLabelText("Nom"), {
			target: { value: "Durand" },
		});
		fireEvent.change(screen.getByLabelText("Prénom"), {
			target: { value: "Camille" },
		});
		fireEvent.submit(getElement("profile-form"));

		await waitFor(() => {
			expect(mockMutate).toHaveBeenCalledWith({
				firstName: "Camille",
				lastName: "Durand",
				phone: "+33122334455",
			});
		});
	});

	it("closes the modal through the DSFR API once the mutation succeeds", async () => {
		const conceal = vi.fn();
		Object.assign(window, { dsfr: () => ({ modal: { conceal } }) });
		await renderOpenModal();

		fireEvent.submit(getElement("profile-form"));

		await waitFor(() => {
			expect(conceal).toHaveBeenCalled();
		});
	});
});
