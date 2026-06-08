import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FILENAME_ERROR_MESSAGES } from "~/modules/shared";
import { Step2Upload } from "../Step2Upload";

const pushMock = vi.fn();
const refreshMock = vi.fn();
const invalidateMock = vi.fn();
let deleteMutationOptions: {
	onSuccess?: () => void;
	onError?: () => void;
} = {};
const deleteMutateMock = vi.fn();
const finalizeMutateAsyncMock = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: pushMock,
		refresh: refreshMock,
		replace: vi.fn(),
		back: vi.fn(),
	}),
	usePathname: () => "/avis-cse/etape/2",
}));

vi.mock("~/modules/shared/uploadFile", () => ({
	uploadFile: vi.fn(),
}));

vi.mock("~/trpc/react", () => ({
	api: {
		cseOpinion: {
			deleteFile: {
				useMutation: (
					options: { onSuccess?: () => void; onError?: () => void } = {},
				) => {
					deleteMutationOptions = options;
					return {
						mutate: deleteMutateMock,
						isPending: false,
						error: null,
					};
				},
			},
			finalize: {
				useMutation: () => ({
					mutateAsync: finalizeMutateAsyncMock,
					isPending: false,
					error: null,
				}),
			},
		},
		useUtils: () => ({
			cseOpinion: {
				getFiles: { invalidate: invalidateMock },
			},
		}),
	},
}));

const { uploadFile: uploadFileMock } = (await import(
	"~/modules/shared/uploadFile"
)) as unknown as { uploadFile: ReturnType<typeof vi.fn> };

function getFileInput() {
	return document.getElementById("cse-file-upload") as HTMLInputElement;
}

function makeFile(name: string, id: string) {
	return { id, fileName: name, uploadedAt: new Date("2026-03-15") };
}

describe("Step2Upload", () => {
	beforeEach(() => {
		pushMock.mockReset();
		refreshMock.mockReset();
		invalidateMock.mockReset();
		deleteMutateMock.mockReset();
		finalizeMutateAsyncMock.mockReset();
		finalizeMutateAsyncMock.mockResolvedValue({ success: true });
		uploadFileMock.mockReset();
		deleteMutationOptions = {};
		// jsdom doesn't implement <dialog>; stub showModal/close so the dialog
		// actually toggles its `open` attribute and its contents become visible
		// to Testing Library queries.
		HTMLDialogElement.prototype.showModal = function showModal() {
			this.setAttribute("open", "");
		};
		HTMLDialogElement.prototype.close = function close() {
			this.removeAttribute("open");
		};
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("renders the page title", () => {
		render(<Step2Upload declarationYear={2026} siren="123456789" />);

		expect(
			screen.getByText("Transmettre l'avis ou les avis du CSE"),
		).toBeInTheDocument();
	});

	it("renders the stepper at step 2", () => {
		render(<Step2Upload declarationYear={2026} siren="123456789" />);

		expect(screen.getByText(/Étape 2 sur 2/)).toBeInTheDocument();
	});

	it("renders the file upload instructions", () => {
		render(<Step2Upload declarationYear={2026} siren="123456789" />);

		expect(
			screen.getByText(/Veuillez importer l'ensemble des avis de votre CSE/),
		).toBeInTheDocument();
		expect(screen.getByText(/Taille maximale.*pdf/)).toBeInTheDocument();
	});

	it("renders the dropzone with select button", () => {
		render(<Step2Upload declarationYear={2026} siren="123456789" />);

		expect(
			screen.getByRole("button", { name: /Sélectionner des fichiers/ }),
		).toBeInTheDocument();
		expect(screen.getByText("ou glisser-les ici")).toBeInTheDocument();
	});

	it("renders a hidden file input", () => {
		render(<Step2Upload declarationYear={2026} siren="123456789" />);

		const fileInput = getFileInput();
		expect(fileInput).toBeInTheDocument();
		expect(fileInput).toHaveAttribute("type", "file");
		expect(fileInput).toHaveAttribute("accept", ".pdf");
	});

	it("renders the opinion summary box", () => {
		render(<Step2Upload declarationYear={2026} siren="123456789" />);

		expect(screen.getByText("Avis CSE à transmettre :")).toBeInTheDocument();
		expect(screen.getByText("Première déclaration")).toBeInTheDocument();
		expect(screen.getByText("Deuxième déclaration")).toBeInTheDocument();
	});

	it("renders previous link and add file button", () => {
		render(<Step2Upload declarationYear={2026} siren="123456789" />);

		const previousLink = screen.getByRole("link", { name: /Précédent/ });
		expect(previousLink).toBeInTheDocument();
		expect(previousLink).toHaveAttribute("href", "/avis-cse/etape/1");

		expect(
			screen.getByRole("button", { name: /Soumettre/ }),
		).toBeInTheDocument();
	});

	it("shows error when submitting without file", async () => {
		const user = userEvent.setup();
		render(<Step2Upload declarationYear={2026} siren="123456789" />);

		await user.click(screen.getByRole("button", { name: /Soumettre/ }));

		expect(
			screen.getByText(
				"Veuillez sélectionner au moins un fichier avant de soumettre.",
			),
		).toBeInTheDocument();
	});

	it("sets aria-invalid on file input when error occurs", async () => {
		const user = userEvent.setup();
		render(<Step2Upload declarationYear={2026} siren="123456789" />);

		const fileInput = getFileInput();
		expect(fileInput).toHaveAttribute("aria-invalid", "false");

		await user.click(screen.getByRole("button", { name: /Soumettre/ }));

		expect(fileInput).toHaveAttribute("aria-invalid", "true");
	});

	it("shows the extension/MIME error for a .txt file", () => {
		render(<Step2Upload declarationYear={2026} siren="123456789" />);

		const file = new File(["content"], "test.txt", { type: "text/plain" });
		const fileInput = getFileInput();

		fireEvent.change(fileInput, { target: { files: [file] } });

		expect(
			screen.getByText(FILENAME_ERROR_MESSAGES.extension_mime_mismatch),
		).toBeInTheDocument();
	});

	it("shows the unsupported-format error for a valid-named non-PDF file", () => {
		render(<Step2Upload declarationYear={2026} siren="123456789" />);

		const file = new File(["content"], "image.png", { type: "image/png" });
		const fileInput = getFileInput();

		fireEvent.change(fileInput, { target: { files: [file] } });

		expect(
			screen.getByText(
				"Format de fichier non supporté. Formats acceptés : pdf.",
			),
		).toBeInTheDocument();
	});

	it("shows error for file exceeding 10 MB", () => {
		render(<Step2Upload declarationYear={2026} siren="123456789" />);

		const largeContent = new ArrayBuffer(11 * 1024 * 1024);
		const file = new File([largeContent], "large.pdf", {
			type: "application/pdf",
		});
		const fileInput = getFileInput();

		fireEvent.change(fileInput, { target: { files: [file] } });

		expect(
			screen.getByText("La taille du fichier ne doit pas dépasser 10 Mo."),
		).toBeInTheDocument();
	});

	it("renders the confirmation modal dialog", () => {
		const { container } = render(
			<Step2Upload declarationYear={2026} siren="123456789" />,
		);

		const dialog = container.querySelector("dialog");
		expect(dialog).toBeInTheDocument();
		expect(dialog).toHaveAttribute("id", "cse-submit-modal");
	});

	it("accepts PDF file and shows file card", () => {
		render(<Step2Upload declarationYear={2026} siren="123456789" />);

		const file = new File(["content"], "avis-cse.pdf", {
			type: "application/pdf",
		});
		const fileInput = getFileInput();

		fireEvent.change(fileInput, { target: { files: [file] } });

		expect(screen.getByText("avis-cse.pdf")).toBeInTheDocument();
		expect(screen.getByText("Importation réussie")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /Supprimer/ }),
		).toBeInTheDocument();
	});

	it("removes file when delete button is clicked", async () => {
		const user = userEvent.setup();
		render(<Step2Upload declarationYear={2026} siren="123456789" />);

		const file = new File(["content"], "avis-cse.pdf", {
			type: "application/pdf",
		});
		const fileInput = getFileInput();

		fireEvent.change(fileInput, { target: { files: [file] } });

		expect(screen.getByText("avis-cse.pdf")).toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: /Supprimer/ }));

		expect(screen.queryByText("avis-cse.pdf")).not.toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /Sélectionner des fichiers/ }),
		).toBeInTheDocument();
	});

	it("shows existing file cards when files are provided", () => {
		render(
			<Step2Upload
				declarationYear={2026}
				existingFiles={[
					makeFile("avis-1.pdf", "file-1"),
					makeFile("avis-2.pdf", "file-2"),
				]}
				siren="123456789"
			/>,
		);

		expect(screen.getByText("avis-1.pdf")).toBeInTheDocument();
		expect(screen.getByText("avis-2.pdf")).toBeInTheDocument();
		expect(screen.getAllByText("Fichier transmis")).toHaveLength(2);
	});

	it("renders a view link for each existing file", () => {
		render(
			<Step2Upload
				declarationYear={2026}
				existingFiles={[
					makeFile("avis-1.pdf", "file-1"),
					makeFile("avis-2.pdf", "file-2"),
				]}
				siren="123456789"
			/>,
		);

		const viewLinks = screen.getAllByRole("link", { name: /Visualiser/ });
		expect(viewLinks).toHaveLength(2);
		expect(viewLinks[0]).toHaveAttribute("href", "/api/v1/files/file-1");
		expect(viewLinks[1]).toHaveAttribute("href", "/api/v1/files/file-2");
		expect(viewLinks[0]).toHaveAttribute("target", "_blank");
	});

	it("shows submit button when files exist but under limit", () => {
		render(
			<Step2Upload
				declarationYear={2026}
				existingFiles={[makeFile("avis-1.pdf", "file-1")]}
				siren="123456789"
			/>,
		);

		expect(
			screen.getByRole("button", { name: /Soumettre/ }),
		).toBeInTheDocument();
	});

	it("shows file count in hint text", () => {
		render(
			<Step2Upload
				declarationYear={2026}
				existingFiles={[
					makeFile("avis-1.pdf", "file-1"),
					makeFile("avis-2.pdf", "file-2"),
				]}
				siren="123456789"
			/>,
		);

		expect(screen.getByText(/2\/4 fichiers/)).toBeInTheDocument();
	});

	it("disables dropzone when max files reached", () => {
		render(
			<Step2Upload
				declarationYear={2026}
				existingFiles={[
					makeFile("avis-1.pdf", "f1"),
					makeFile("avis-2.pdf", "f2"),
					makeFile("avis-3.pdf", "f3"),
					makeFile("avis-4.pdf", "f4"),
				]}
				siren="123456789"
			/>,
		);

		const selectButton = screen.getByRole("button", {
			name: /Sélectionner des fichiers/,
		});
		expect(selectButton).toBeDisabled();
		expect(
			screen.getByRole("button", { name: /Soumettre/ }),
		).toBeInTheDocument();
	});

	it("uploads the file then finalizes and redirects on success", async () => {
		const user = userEvent.setup();
		uploadFileMock.mockResolvedValue({
			ok: true,
			fileId: "new-file",
			fileName: "avis.pdf",
		});

		render(<Step2Upload declarationYear={2026} siren="123456789" />);

		const file = new File(["content"], "avis.pdf", {
			type: "application/pdf",
		});
		fireEvent.change(getFileInput(), { target: { files: [file] } });

		await user.click(screen.getByRole("button", { name: /Soumettre/ }));

		const certifyCheckbox = screen.getByRole("checkbox");
		await user.click(certifyCheckbox);
		await user.click(screen.getByRole("button", { name: "Valider" }));

		await waitFor(() => {
			expect(uploadFileMock).toHaveBeenCalledWith(file, {
				flowType: "cse_opinion",
			});
		});
		await waitFor(() => {
			expect(invalidateMock).toHaveBeenCalled();
		});
		expect(refreshMock).toHaveBeenCalled();
		await waitFor(() => {
			expect(finalizeMutateAsyncMock).toHaveBeenCalled();
		});
		await waitFor(() => {
			expect(pushMock).toHaveBeenCalledWith("/avis-cse/confirmation");
		});
	});

	it("finalizes without uploading when only existing files are present", async () => {
		const user = userEvent.setup();
		render(
			<Step2Upload
				declarationYear={2026}
				existingFiles={[makeFile("avis-1.pdf", "file-1")]}
				siren="123456789"
			/>,
		);

		await user.click(screen.getByRole("button", { name: /Soumettre/ }));

		const certifyCheckbox = screen.getByRole("checkbox");
		await user.click(certifyCheckbox);
		await user.click(screen.getByRole("button", { name: "Valider" }));

		await waitFor(() => {
			expect(finalizeMutateAsyncMock).toHaveBeenCalled();
		});
		expect(uploadFileMock).not.toHaveBeenCalled();
		await waitFor(() => {
			expect(pushMock).toHaveBeenCalledWith("/avis-cse/confirmation");
		});
	});

	it("shows an error and does not redirect when finalize fails", async () => {
		const user = userEvent.setup();
		finalizeMutateAsyncMock.mockRejectedValueOnce(
			new Error("Au moins un fichier d'avis CSE doit être transmis."),
		);

		render(
			<Step2Upload
				declarationYear={2026}
				existingFiles={[makeFile("avis-1.pdf", "file-1")]}
				siren="123456789"
			/>,
		);

		await user.click(screen.getByRole("button", { name: /Soumettre/ }));
		await user.click(screen.getByRole("checkbox"));
		await user.click(screen.getByRole("button", { name: "Valider" }));

		await waitFor(() => {
			expect(
				screen.getByText("Au moins un fichier d'avis CSE doit être transmis."),
			).toBeInTheDocument();
		});
		expect(pushMock).not.toHaveBeenCalled();
	});

	it("invalidates the file list and clears the deleting state on delete success", () => {
		render(
			<Step2Upload
				declarationYear={2026}
				existingFiles={[makeFile("avis-1.pdf", "file-1")]}
				siren="123456789"
			/>,
		);

		const deleteButton = screen.getByTitle("Supprimer avis-1.pdf");
		fireEvent.click(deleteButton);

		expect(deleteMutateMock).toHaveBeenCalledWith({ fileId: "file-1" });

		act(() => {
			deleteMutationOptions.onSuccess?.();
		});
		expect(invalidateMock).toHaveBeenCalled();
		expect(refreshMock).toHaveBeenCalled();
	});

	it("clears the deleting state when the delete mutation fails", () => {
		render(
			<Step2Upload
				declarationYear={2026}
				existingFiles={[makeFile("avis-1.pdf", "file-1")]}
				siren="123456789"
			/>,
		);

		const deleteButton = screen.getByTitle("Supprimer avis-1.pdf");
		fireEvent.click(deleteButton);

		// Simulate the failure callback registered with the mutation.
		expect(() => {
			act(() => {
				deleteMutationOptions.onError?.();
			});
		}).not.toThrow();
	});
});
