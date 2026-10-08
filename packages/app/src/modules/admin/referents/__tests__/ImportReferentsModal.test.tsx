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
let mutationOnError: ((err: { message: string }) => void) | undefined;
let mutationOnSuccess: (() => void) | undefined;

vi.mock("~/trpc/react", () => ({
	api: {
		adminReferents: {
			import: {
				useMutation: (opts: {
					onSuccess?: () => void;
					onError?: (err: { message: string }) => void;
				}) => {
					mutationOnSuccess = opts?.onSuccess;
					mutationOnError = opts?.onError;
					return { mutate: importMutate, reset: importReset, isPending: false };
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
	render(
		<ImportReferentsModal
			modalRef={modalRef}
			onClose={onClose}
			onSuccess={onSuccess}
		/>,
	);
	return { onClose, onSuccess };
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
	});

	it("renders warning and title", () => {
		renderModal();
		expect(
			screen.getByText(/cette opération remplacera toutes les données/),
		).toBeInTheDocument();
	});

	it("disables Importer until a file is selected", () => {
		renderModal();
		const importBtn = screen.getByRole("button", {
			name: "Importer",
			hidden: true,
		});
		expect(importBtn).toBeDisabled();
	});

	it("shows an error when the file is not valid JSON", async () => {
		renderModal();
		selectFile("bad.json", "not-json");
		fireEvent.click(
			screen.getByRole("button", { name: "Importer", hidden: true }),
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
			screen.getByRole("button", { name: "Importer", hidden: true }),
		);
		await waitFor(() => {
			expect(screen.getByText(/Format invalide/)).toBeInTheDocument();
		});
		expect(importMutate).not.toHaveBeenCalled();
	});

	it("clears the selected file and error when cancelled", async () => {
		const { onClose } = renderModal();
		const input = screen.getByLabelText(/Fichier JSON/, {
			selector: "input",
		}) as HTMLInputElement;
		await userEvent.upload(
			input,
			new File(["not-json"], "bad.json", { type: "application/json" }),
		);
		fireEvent.click(
			screen.getByRole("button", { name: "Importer", hidden: true }),
		);
		await screen.findByText("Le fichier n'est pas un JSON valide.");

		fireEvent.click(
			screen.getByRole("button", { name: "Annuler", hidden: true }),
		);

		expect(onClose).toHaveBeenCalledOnce();
		expect(importReset).toHaveBeenCalledOnce();
		expect(input.files).toHaveLength(0);
		expect(
			screen.queryByText("Le fichier n'est pas un JSON valide."),
		).toBeNull();
		expect(
			screen.getByRole("button", { name: "Importer", hidden: true }),
		).toBeDisabled();
	});

	it("calls the mutation when the payload is valid", async () => {
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
			screen.getByRole("button", { name: "Importer", hidden: true }),
		);
		await waitFor(() => {
			expect(importMutate).toHaveBeenCalledTimes(1);
		});
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
});
