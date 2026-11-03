import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
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
		profile: null as ProfileData | null,
		saveOutcome: "success" as "success" | "error" | "pending",
		settlePendingSave: null as (() => void) | null,
	},
}));

vi.mock("~/trpc/react", async () => {
	const { useState } = await vi.importActual<typeof import("react")>("react");
	return {
		api: {
			profile: {
				get: {
					useQuery: () => ({ data: trpcState.profile, refetch: mockRefetch }),
				},
				updateProfile: {
					useMutation: ({ onSuccess }: { onSuccess?: () => void }) => {
						const [status, setStatus] = useState<"idle" | "pending" | "error">(
							"idle",
						);
						return {
							mutate: (input: unknown) => {
								mockMutate(input);
								if (trpcState.saveOutcome === "success") {
									onSuccess?.();
									return;
								}
								setStatus(trpcState.saveOutcome);
								trpcState.settlePendingSave = () => {
									setStatus("idle");
									onSuccess?.();
								};
							},
							reset: () => setStatus("idle"),
							isPending: status === "pending",
							isError: status === "error",
						};
					},
				},
			},
		},
	};
});

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

const REVIEW_HEADING = "Vérifier vos modifications";

function findReviewHeading() {
	return screen.findByRole("heading", { name: REVIEW_HEADING, level: 3 });
}

function queryReviewHeading() {
	return screen.queryByRole("heading", {
		name: REVIEW_HEADING,
		...hiddenOpt,
	});
}

async function reviewEdits(edits: Record<string, string>) {
	for (const [id, value] of Object.entries(edits)) {
		fireEvent.change(getElement(id), { target: { value } });
	}
	fireEvent.submit(getElement("profile-form"));
	return findReviewHeading();
}

function mockDsfrModal() {
	const modal = { conceal: vi.fn(), disclose: vi.fn(), focus: vi.fn() };
	Object.assign(window, { dsfr: () => ({ modal }) });
	return modal;
}

beforeEach(() => {
	trpcState.profile = { ...PROFILE };
	trpcState.saveOutcome = "success";
	trpcState.settlePendingSave = null;
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

	it("renders autocomplete tokens for identity fields", () => {
		render(<ProfileModal />);
		expect(document.getElementById("profile-last-name")).toHaveAttribute(
			"autocomplete",
			"family-name",
		);
		expect(document.getElementById("profile-first-name")).toHaveAttribute(
			"autocomplete",
			"given-name",
		);
		expect(getElement("profile-form")).not.toHaveAttribute(
			"autocomplete",
			"off",
		);
	});

	it("renders the review and cancel buttons, and no direct save button", () => {
		render(<ProfileModal />);
		expect(
			screen.getByRole("button", {
				name: "Vérifier mes modifications",
				...hiddenOpt,
			}),
		).toHaveAttribute("type", "submit");
		expect(
			screen.getByRole("button", { name: "Annuler", ...hiddenOpt }),
		).toHaveAttribute("aria-controls", MODAL_ID);
		expect(
			screen.queryByRole("button", { name: /enregistrer/i, ...hiddenOpt }),
		).not.toBeInTheDocument();
	});
});

describe("ProfileModal — intro copy", () => {
	it("renders the instruction paragraph followed by the obligatory-fields mention", () => {
		render(<ProfileModal />);
		const instruction = screen.getByText(
			"Vérifier les informations pré-remplies à partir de votre compte ProConnect et compléter les informations manquantes si nécessaire.",
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
			screen.getByRole("button", { name: "Vérifier mes modifications" }),
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
	it("renders the e-mail in bold without the ProConnect source mention", () => {
		render(<ProfileModal />);
		const value = screen.getByText("julien.martin@alpha-solution.fr");

		expect(value.tagName).toBe("STRONG");
		expect(value.parentElement).toHaveTextContent(
			"E-mail : julien.martin@alpha-solution.fr",
		);
		expect(screen.queryByText("Source : ProConnect.")).not.toBeInTheDocument();
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
		expect(queryReviewHeading()).not.toBeInTheDocument();
		expect(mockMutate).not.toHaveBeenCalled();
	});

	it("keeps the phone format hint and shows the format error when invalid", async () => {
		await renderOpenModal();
		fireEvent.change(getElement("profile-phone"), {
			target: { value: "012233" },
		});
		fireEvent.submit(getElement("profile-form"));

		await waitFor(() => {
			expect(
				document.querySelector("#profile-phone-messages .fr-message--error"),
			).toHaveTextContent(
				"Le numéro de téléphone n'est pas valide. Saisissez-le au format 01 22 33 44 55 ou +33 1 22 33 44 55",
			);
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

		expect(await findReviewHeading()).toBeInTheDocument();
		expect(
			document.querySelector("#profile-last-name-messages .fr-message--error"),
		).not.toBeInTheDocument();
		expect(mockMutate).not.toHaveBeenCalled();
	});
});

describe("ProfileModal — review step", () => {
	it("shows a summary of old and new values without saving anything", async () => {
		await renderOpenModal();

		const heading = await reviewEdits({
			"profile-last-name": "Durand",
			"profile-phone": "01 22 33 44 56",
		});

		expect(heading).toHaveFocus();
		expect(mockMutate).not.toHaveBeenCalled();
		expect(getElement("profile-form").parentElement).not.toBeVisible();

		const table = screen.getByRole("table", {
			name: "Modifications à confirmer",
		});
		const rows = within(table).getAllByRole("row").slice(1);
		expect(rows.map((row) => row.textContent)).toEqual([
			"NomMartinDurand",
			"Numéro de téléphone+33 1 22 33 44 55+33 1 22 33 44 56",
		]);
		expect(
			within(table).getByRole("rowheader", { name: "Nom" }),
		).toBeInTheDocument();
		expect(
			within(table).getByRole("columnheader", { name: "Nouvelle valeur" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Confirmer et enregistrer" }),
		).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Annuler" })).toHaveAttribute(
			"aria-controls",
			MODAL_ID,
		);
	});

	it("offers no confirmation when nothing was changed", async () => {
		await renderOpenModal();

		await reviewEdits({});

		expect(
			screen.getByText(
				"Vous n’avez modifié aucune information : il n’y a rien à enregistrer.",
			),
		).toBeInTheDocument();
		expect(screen.queryByRole("table")).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Confirmer et enregistrer" }),
		).not.toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Revenir aux champs" }),
		).toBeInTheDocument();
	});

	it("returns to the fields with the edits kept and the title focused", async () => {
		await renderOpenModal();
		await reviewEdits({ "profile-first-name": "Camille" });

		fireEvent.click(screen.getByRole("button", { name: "Revenir aux champs" }));

		expect(queryReviewHeading()).not.toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "Mon profil" })).toHaveFocus();
		expect(screen.getByLabelText("Prénom")).toBeVisible();
		expect(screen.getByLabelText("Prénom")).toHaveValue("Camille");
		expect(mockMutate).not.toHaveBeenCalled();
	});

	it("saves nothing when the review is cancelled, and reopens on the stored values", async () => {
		await renderOpenModal();
		await reviewEdits({ "profile-last-name": "Durand" });

		closeDialog();
		await openDialog();

		expect(mockMutate).not.toHaveBeenCalled();
		expect(queryReviewHeading()).not.toBeInTheDocument();
		expect(screen.getByLabelText("Nom")).toHaveValue("Martin");
		expect(screen.getByLabelText("Nom")).toBeVisible();
	});
});

describe("ProfileModal — confirmation", () => {
	it("sends the edited identity along with the canonical phone once confirmed", async () => {
		await renderOpenModal();
		await reviewEdits({
			"profile-last-name": "Durand",
			"profile-first-name": "Camille",
		});

		fireEvent.click(
			screen.getByRole("button", { name: "Confirmer et enregistrer" }),
		);

		expect(mockMutate).toHaveBeenCalledTimes(1);
		expect(mockMutate).toHaveBeenCalledWith({
			firstName: "Camille",
			lastName: "Durand",
			phone: "+33122334455",
		});
	});

	it("closes the modal and gives focus back to the opening control once saved", async () => {
		const modal = mockDsfrModal();
		await renderOpenModal();
		await reviewEdits({ "profile-last-name": "Durand" });

		fireEvent.click(
			screen.getByRole("button", { name: "Confirmer et enregistrer" }),
		);

		expect(modal.conceal).toHaveBeenCalledTimes(1);
		expect(modal.focus).toHaveBeenCalledTimes(1);
	});

	it("applies a single update while the save is pending", async () => {
		trpcState.saveOutcome = "pending";
		await renderOpenModal();
		await reviewEdits({ "profile-last-name": "Durand" });

		fireEvent.click(
			screen.getByRole("button", { name: "Confirmer et enregistrer" }),
		);
		const pendingButton = screen.getByRole("button", {
			name: "Enregistrement en cours…",
		});
		fireEvent.click(pendingButton);
		fireEvent.click(screen.getByRole("button", { name: "Revenir aux champs" }));

		expect(pendingButton).toHaveAttribute("aria-disabled", "true");
		expect(mockMutate).toHaveBeenCalledTimes(1);
		expect(await findReviewHeading()).toBeInTheDocument();
	});

	it("leaves focus alone when the save lands after the modal was closed", async () => {
		const modal = mockDsfrModal();
		trpcState.saveOutcome = "pending";
		await renderOpenModal();
		await reviewEdits({ "profile-last-name": "Durand" });
		fireEvent.click(
			screen.getByRole("button", { name: "Confirmer et enregistrer" }),
		);

		closeDialog();
		act(() => trpcState.settlePendingSave?.());

		expect(modal.conceal).not.toHaveBeenCalled();
		expect(modal.focus).not.toHaveBeenCalled();
	});

	it("keeps the review open with an alert when the save fails, and lets the user retry", async () => {
		const modal = mockDsfrModal();
		trpcState.saveOutcome = "error";
		await renderOpenModal();
		await reviewEdits({ "profile-last-name": "Durand" });

		fireEvent.click(
			screen.getByRole("button", { name: "Confirmer et enregistrer" }),
		);

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"L’enregistrement de vos informations a échoué. Vos modifications sont conservées : vous pouvez réessayer.",
		);
		expect(modal.conceal).not.toHaveBeenCalled();

		trpcState.saveOutcome = "success";
		fireEvent.click(
			screen.getByRole("button", { name: "Confirmer et enregistrer" }),
		);

		expect(mockMutate).toHaveBeenCalledTimes(2);
		expect(mockMutate).toHaveBeenLastCalledWith({
			firstName: "Julien",
			lastName: "Durand",
			phone: "+33122334455",
		});
		expect(modal.conceal).toHaveBeenCalledTimes(1);
	});

	it("clears the save error when going back to the fields", async () => {
		trpcState.saveOutcome = "error";
		await renderOpenModal();
		await reviewEdits({ "profile-last-name": "Durand" });
		fireEvent.click(
			screen.getByRole("button", { name: "Confirmer et enregistrer" }),
		);
		await screen.findByRole("alert");

		fireEvent.click(screen.getByRole("button", { name: "Revenir aux champs" }));
		await reviewEdits({});

		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});
});
