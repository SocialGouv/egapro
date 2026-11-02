import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const importMutate = vi.fn();
const importReset = vi.fn();
const countFetch = vi.fn();
let mutationOnError: ((err: { message: string }) => void) | undefined;
let mutationOnSuccess: (() => void) | undefined;
let mutationPending = false;

vi.mock("~/trpc/react", () => ({
	api: {
		useUtils: () => ({ adminReferents: { count: { fetch: countFetch } } }),
		adminReferents: {
			import: {
				useMutation: (opts: {
					onSuccess?: () => void;
					onError?: (err: { message: string }) => void;
				}) => {
					mutationOnSuccess = opts?.onSuccess;
					mutationOnError = opts?.onError;
					return {
						mutate: importMutate,
						reset: importReset,
						isPending: mutationPending,
					};
				},
			},
		},
	},
}));

import { ImportReferentsModal } from "../ImportReferentsModal";

function renderModal() {
	const onClose = vi.fn();
	const onSuccess = vi.fn();
	const modalRef = createRef<HTMLDialogElement>();
	const view = render(
		<ImportReferentsModal
			modalRef={modalRef}
			onClose={onClose}
			onSuccess={onSuccess}
		/>,
	);
	return {
		onClose,
		onSuccess,
		modalRef,
		rerender: () =>
			view.rerender(
				<ImportReferentsModal
					modalRef={modalRef}
					onClose={onClose}
					onSuccess={onSuccess}
				/>,
			),
	};
}

const VALID_FILE = JSON.stringify([
	{ region: "11", name: "Jean", type: "email", value: "jean@gouv.fr" },
	{ region: "84", name: "Marie", type: "url", value: "https://example.fr" },
	{ region: "93", name: "Paul", type: "email", value: "paul@gouv.fr" },
]);

function findConfirmButton() {
	return screen.findByRole("button", {
		name: "Confirmer l'import",
		hidden: true,
	});
}

async function reachConfirmStep() {
	const view = renderModal();
	selectFile("referents.json", VALID_FILE);
	fireEvent.click(
		screen.getByRole("button", { name: "Vérifier l'import", hidden: true }),
	);
	await findConfirmButton();
	return view;
}

function selectFile(name: string, content: string) {
	const input = screen.getByLabelText(/Fichier JSON/, {
		selector: "input",
	}) as HTMLInputElement;
	const file = new File([content], name, { type: "application/json" });
	fireEvent.change(input, { target: { files: [file] } });
	return file;
}

describe("ImportReferentsModal", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mutationOnError = undefined;
		mutationOnSuccess = undefined;
		mutationPending = false;
		countFetch.mockResolvedValue({ total: 12 });
	});

	it("renders warning and title", () => {
		renderModal();
		expect(
			screen.getByText(/cette opération remplacera toutes les données/),
		).toBeInTheDocument();
	});

	it("disables the review button until a file is selected", () => {
		renderModal();
		const importBtn = screen.getByRole("button", {
			name: "Vérifier l'import",
			hidden: true,
		});
		expect(importBtn).toBeDisabled();
	});

	it("shows an error when the file is not valid JSON", async () => {
		renderModal();
		selectFile("bad.json", "not-json");
		fireEvent.click(
			screen.getByRole("button", { name: "Vérifier l'import", hidden: true }),
		);
		await waitFor(() => {
			expect(
				screen.getByText("Le fichier n'est pas un JSON valide."),
			).toBeInTheDocument();
		});
		expect(importMutate).not.toHaveBeenCalled();
	});

	it("shows an error when the JSON fails schema validation", async () => {
		renderModal();
		selectFile("wrong.json", JSON.stringify([{ region: "bad" }]));
		fireEvent.click(
			screen.getByRole("button", { name: "Vérifier l'import", hidden: true }),
		);
		await waitFor(() => {
			expect(screen.getByText(/Format invalide/)).toBeInTheDocument();
		});
		expect(importMutate).not.toHaveBeenCalled();
	});

	it("clears the selected file and error when cancelled", async () => {
		const { onClose, modalRef } = renderModal();
		const input = screen.getByLabelText(/Fichier JSON/, {
			selector: "input",
		}) as HTMLInputElement;
		await userEvent.upload(
			input,
			new File(["not-json"], "bad.json", { type: "application/json" }),
		);
		fireEvent.click(
			screen.getByRole("button", { name: "Vérifier l'import", hidden: true }),
		);
		await screen.findByText("Le fichier n'est pas un JSON valide.");

		fireEvent.click(
			screen.getByRole("button", { name: "Annuler", hidden: true }),
		);
		act(() => modalRef.current?.dispatchEvent(new Event("dsfr.conceal")));

		expect(onClose).toHaveBeenCalledOnce();
		expect(importReset).toHaveBeenCalledOnce();
		expect(input.files).toHaveLength(0);
		expect(
			screen.queryByText("Le fichier n'est pas un JSON valide."),
		).toBeNull();
		expect(
			screen.getByRole("button", { name: "Vérifier l'import", hidden: true }),
		).toBeDisabled();
	});

	it("clears the file and error after a DSFR conceal and reopen", async () => {
		const { modalRef } = renderModal();
		const input = screen.getByLabelText(/Fichier JSON/, {
			selector: "input",
		}) as HTMLInputElement;
		await userEvent.upload(
			input,
			new File(["not-json"], "bad.json", { type: "application/json" }),
		);
		fireEvent.click(
			screen.getByRole("button", { name: "Vérifier l'import", hidden: true }),
		);
		await screen.findByText("Le fichier n'est pas un JSON valide.");

		act(() => modalRef.current?.dispatchEvent(new Event("dsfr.conceal")));

		expect(input.files).toHaveLength(0);
		expect(
			screen.queryByText("Le fichier n'est pas un JSON valide."),
		).toBeNull();
		expect(
			screen.getByRole("button", { name: "Vérifier l'import", hidden: true }),
		).toBeDisabled();
	});

	it("keeps an active import guarded after conceal and reopen", async () => {
		const { modalRef, onClose, onSuccess, rerender } = renderModal();
		selectFile(
			"valid.json",
			JSON.stringify([
				{ region: "11", name: "Jean", type: "email", value: "jean@gouv.fr" },
			]),
		);
		fireEvent.click(
			screen.getByRole("button", { name: "Vérifier l'import", hidden: true }),
		);
		fireEvent.click(await findConfirmButton());
		await waitFor(() => expect(importMutate).toHaveBeenCalledOnce());

		mutationPending = true;
		rerender();
		act(() => modalRef.current?.dispatchEvent(new Event("dsfr.conceal")));
		expect(importReset).not.toHaveBeenCalled();
		expect(
			screen.getByRole("button", { name: "Vérifier l'import", hidden: true }),
		).toBeDisabled();
		expect(
			screen.getByLabelText(/Fichier JSON/, { selector: "input" }),
		).toBeDisabled();

		act(() => mutationOnSuccess?.());
		expect(onSuccess).toHaveBeenCalledOnce();
		expect(onClose).not.toHaveBeenCalled();
	});

	it("calls the mutation only once the replacement is confirmed", async () => {
		renderModal();
		const valid = [
			{
				region: "11",
				county: "75",
				name: "Jean",
				type: "email",
				value: "jean@gouv.fr",
				principal: true,
				substituteName: "",
				substituteEmail: "",
			},
		];
		selectFile("valid.json", JSON.stringify(valid));
		fireEvent.click(
			screen.getByRole("button", { name: "Vérifier l'import", hidden: true }),
		);
		const confirm = await findConfirmButton();
		expect(importMutate).not.toHaveBeenCalled();

		fireEvent.click(confirm);
		await waitFor(() => {
			expect(importMutate).toHaveBeenCalledTimes(1);
		});
		expect(importMutate).toHaveBeenCalledWith([
			expect.objectContaining({ name: "Jean", value: "jean@gouv.fr" }),
		]);
	});

	it("checks the file only once on rapid consecutive clicks", async () => {
		renderModal();
		selectFile("valid.json", VALID_FILE);
		const reviewButton = screen.getByRole("button", {
			name: "Vérifier l'import",
			hidden: true,
		});
		fireEvent.click(reviewButton);
		fireEvent.click(reviewButton);

		await findConfirmButton();
		expect(countFetch).toHaveBeenCalledOnce();
	});

	it("starts only one import on rapid consecutive confirmations", async () => {
		renderModal();
		selectFile("valid.json", VALID_FILE);
		fireEvent.click(
			screen.getByRole("button", { name: "Vérifier l'import", hidden: true }),
		);
		const confirm = await findConfirmButton();
		fireEvent.click(confirm);
		fireEvent.click(confirm);

		await waitFor(() => expect(importMutate).toHaveBeenCalledOnce());
	});

	it("surfaces a server error through the mutation onError hook", () => {
		renderModal();
		act(() => {
			mutationOnError?.({ message: "boom" });
		});
		expect(screen.getByText("boom")).toBeInTheDocument();
	});

	it("closes and calls onSuccess when the mutation resolves", () => {
		const { onClose, onSuccess } = renderModal();
		act(() => {
			mutationOnSuccess?.();
		});
		expect(onClose).toHaveBeenCalled();
		expect(onSuccess).toHaveBeenCalled();
	});

	it("announces how many referents are deleted and added before anything is imported", async () => {
		await reachConfirmStep();

		const heading = screen.getByRole("heading", {
			name: "Confirmer le remplacement des référents",
			hidden: true,
		});
		expect(heading).toHaveFocus();
		const section = screen.getByRole("region", {
			name: "Confirmer le remplacement des référents",
			hidden: true,
		});
		expect(section).toHaveTextContent(
			"Le fichier « referents.json » est valide",
		);
		expect(section).toHaveTextContent(
			"12 référents existants seront supprimés",
		);
		expect(section).toHaveTextContent("3 référents seront ajoutés");
		expect(section).toHaveTextContent("Cette suppression est définitive");
		expect(countFetch).toHaveBeenCalledOnce();
		expect(importMutate).not.toHaveBeenCalled();
	});

	it("uses the singular when one referent is deleted and one added", async () => {
		countFetch.mockResolvedValue({ total: 1 });
		renderModal();
		selectFile(
			"one.json",
			JSON.stringify([
				{ region: "11", name: "Jean", type: "email", value: "jean@gouv.fr" },
			]),
		);
		fireEvent.click(
			screen.getByRole("button", { name: "Vérifier l'import", hidden: true }),
		);
		await findConfirmButton();
		expect(
			screen.getByText(/référent existant sera supprimé/),
		).toHaveTextContent("1 référent existant sera supprimé");
		expect(screen.getByText(/référent sera ajouté/)).toHaveTextContent(
			"1 référent sera ajouté",
		);
	});

	it("goes back to the file step without importing, keeping the file, and focuses the title", async () => {
		await reachConfirmStep();

		fireEvent.click(
			screen.getByRole("button", {
				name: "Revenir au choix du fichier",
				hidden: true,
			}),
		);

		expect(importMutate).not.toHaveBeenCalled();
		expect(
			screen.queryByRole("button", {
				name: "Confirmer l'import",
				hidden: true,
			}),
		).toBeNull();
		expect(
			screen.getByRole("heading", {
				name: "Importer des référents",
				hidden: true,
			}),
		).toHaveFocus();
		expect(
			screen.getByRole("button", { name: "Vérifier l'import", hidden: true }),
		).toBeEnabled();
	});

	it("cancels from the confirmation step without importing and resets on conceal", async () => {
		const { onClose, modalRef } = await reachConfirmStep();

		fireEvent.click(
			screen.getByRole("button", { name: "Annuler", hidden: true }),
		);
		act(() => modalRef.current?.dispatchEvent(new Event("dsfr.conceal")));

		expect(onClose).toHaveBeenCalledOnce();
		expect(importMutate).not.toHaveBeenCalled();
		expect(
			screen.queryByRole("button", {
				name: "Confirmer l'import",
				hidden: true,
			}),
		).toBeNull();
		expect(
			screen.getByRole("button", { name: "Vérifier l'import", hidden: true }),
		).toBeDisabled();
	});

	it("refuses to go further when the existing referents cannot be counted", async () => {
		countFetch.mockRejectedValue(new Error("network"));
		renderModal();
		selectFile("referents.json", VALID_FILE);
		fireEvent.click(
			screen.getByRole("button", { name: "Vérifier l'import", hidden: true }),
		);

		expect(
			await screen.findByText(
				"Le nombre de référents existants n'a pas pu être vérifié. Veuillez réessayer.",
			),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("button", {
				name: "Confirmer l'import",
				hidden: true,
			}),
		).toBeNull();
		expect(importMutate).not.toHaveBeenCalled();
	});

	it("keeps the confirmation step and shows the server error when the import fails", async () => {
		await reachConfirmStep();
		fireEvent.click(await findConfirmButton());
		await waitFor(() => expect(importMutate).toHaveBeenCalledOnce());

		act(() => mutationOnError?.({ message: "Import refusé" }));

		expect(screen.getByRole("alert", { hidden: true })).toHaveTextContent(
			"Import refusé",
		);
		expect(await findConfirmButton()).toBeInTheDocument();
	});

	it("does not show the count when the file is invalid", async () => {
		renderModal();
		selectFile("bad.json", "not-json");
		fireEvent.click(
			screen.getByRole("button", { name: "Vérifier l'import", hidden: true }),
		);
		await screen.findByText("Le fichier n'est pas un JSON valide.");
		expect(countFetch).not.toHaveBeenCalled();
	});
});
