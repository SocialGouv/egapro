import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSession } from "next-auth/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LockProvider } from "~/modules/declaration-remuneration/shared/lock/LockContext";
import { FILENAME_ERROR_MESSAGES } from "~/modules/shared";
import { computeContentTypeColumns } from "../contentTypeColumns";
import { Step2Upload } from "../Step2Upload";
import type {
	ContentTypeColumn,
	StoredFileContentType,
	UploadedFile,
} from "../types";

const pushMock = vi.fn();
const refreshMock = vi.fn();
const invalidateFilesMock = vi.fn();
const invalidateTypesMock = vi.fn();
const deleteMutateMock = vi.fn();
const finalizeMutateAsyncMock = vi.fn();
const setTypesMutateMock = vi.fn();
let deleteMutationOptions: {
	onSuccess?: (data: unknown, variables: { fileId: string }) => void;
	onError?: () => void;
} = {};
let setTypesMutationOptions: {
	onSuccess?: () => void;
	onError?: () => void;
} = {};

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
				useMutation: (options: typeof deleteMutationOptions = {}) => {
					deleteMutationOptions = options;
					return { mutate: deleteMutateMock, isPending: false, error: null };
				},
			},
			finalize: {
				useMutation: () => ({
					mutateAsync: finalizeMutateAsyncMock,
					isPending: false,
					error: null,
				}),
			},
			setFileContentTypes: {
				useMutation: (options: typeof setTypesMutationOptions = {}) => {
					setTypesMutationOptions = options;
					return { mutate: setTypesMutateMock, isPending: false, error: null };
				},
			},
		},
		useUtils: () => ({
			cseOpinion: {
				getFiles: { invalidate: invalidateFilesMock },
				getFileContentTypes: { invalidate: invalidateTypesMock },
			},
		}),
	},
}));

const { uploadFile: uploadFileMock } = (await import(
	"~/modules/shared/uploadFile"
)) as unknown as { uploadFile: ReturnType<typeof vi.fn> };

const SINGLE_COLUMN = computeContentTypeColumns({
	hasSecondDeclaration: false,
	firstDeclGapConsulted: false,
	secondDeclGapConsulted: null,
	firstDeclGapHigh: false,
	secondDeclGapHigh: false,
});

const DUAL_COLUMNS = computeContentTypeColumns({
	hasSecondDeclaration: true,
	firstDeclGapConsulted: true,
	secondDeclGapConsulted: true,
	firstDeclGapHigh: true,
	secondDeclGapHigh: true,
});

function getFileInput() {
	return document.getElementById("cse-file-upload") as HTMLInputElement;
}

function makeFile(name: string, id: string): UploadedFile {
	return {
		id,
		fileName: name,
		uploadedAt: new Date("2026-03-15"),
		fileSize: 63365,
	};
}

function renderStep(
	props: {
		existingFiles?: UploadedFile[];
		columns?: ContentTypeColumn[];
		initialAssociations?: StoredFileContentType[];
		isReadOnly?: boolean;
	} = {},
) {
	return render(
		<LockProvider isReadOnly={props.isReadOnly ?? false}>
			<Step2Upload
				columns={props.columns ?? SINGLE_COLUMN}
				declarationYear={2026}
				existingFiles={props.existingFiles}
				initialAssociations={props.initialAssociations}
				siren="123456789"
			/>
		</LockProvider>,
	);
}

describe("Step2Upload", () => {
	beforeEach(() => {
		pushMock.mockReset();
		refreshMock.mockReset();
		invalidateFilesMock.mockReset();
		invalidateTypesMock.mockReset();
		deleteMutateMock.mockReset();
		finalizeMutateAsyncMock.mockReset();
		finalizeMutateAsyncMock.mockResolvedValue({ success: true });
		setTypesMutateMock.mockReset();
		uploadFileMock.mockReset();
		deleteMutationOptions = {};
		setTypesMutationOptions = {};
		// jsdom doesn't implement <dialog>; stub showModal/close so the dialog
		// actually toggles its `open` attribute and its contents become visible.
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
		renderStep();

		expect(
			screen.getByText("Transmettre l'avis ou les avis du CSE"),
		).toBeInTheDocument();
	});

	it("renders the stepper at step 2", () => {
		renderStep();

		expect(screen.getByText(/Étape 2 sur 2/)).toBeInTheDocument();
	});

	it("renders the file upload instructions", () => {
		renderStep();

		expect(
			screen.getByText(/renseigner le type de document correspondant/),
		).toBeInTheDocument();
		expect(screen.getByText(/Taille maximale.*pdf/)).toBeInTheDocument();
	});

	it("renders the dropzone with select button", () => {
		renderStep();

		expect(
			screen.getByRole("button", { name: /Sélectionner des fichiers/ }),
		).toBeInTheDocument();
		expect(screen.getByText("ou glisser-les ici")).toBeInTheDocument();
	});

	it("renders a hidden file input accepting pdf", () => {
		renderStep();

		const fileInput = getFileInput();
		expect(fileInput).toHaveAttribute("type", "file");
		expect(fileInput).toHaveAttribute("accept", ".pdf");
	});

	it("renders the opinion summary box", () => {
		renderStep({ columns: DUAL_COLUMNS });

		expect(screen.getByText("Avis CSE à transmettre :")).toBeInTheDocument();
		expect(screen.getByText("Première déclaration")).toBeInTheDocument();
		expect(screen.getByText("Deuxième déclaration")).toBeInTheDocument();
	});

	it("renders previous link and submit button", () => {
		renderStep();

		const previousLink = screen.getByRole("link", { name: /Précédent/ });
		expect(previousLink).toHaveAttribute("href", "/avis-cse/etape/1");
		expect(
			screen.getByRole("button", { name: "Soumettre" }),
		).toBeInTheDocument();
	});

	it("keeps the submit button enabled even before any file is added", () => {
		renderStep();

		expect(screen.getByRole("button", { name: "Soumettre" })).toBeEnabled();
	});

	it("does not render the matrix when there is no existing file", () => {
		renderStep();

		expect(screen.queryByRole("table")).not.toBeInTheDocument();
	});

	it("shows the extension/MIME error for a .txt file", () => {
		renderStep();

		const file = new File(["content"], "test.txt", { type: "text/plain" });
		fireEvent.change(getFileInput(), { target: { files: [file] } });

		expect(
			screen.getByText(FILENAME_ERROR_MESSAGES.extension_mime_mismatch),
		).toBeInTheDocument();
	});

	it("shows the unsupported-format error for a valid-named non-PDF file", () => {
		renderStep();

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
		renderStep();

		const largeContent = new ArrayBuffer(11 * 1024 * 1024);
		const file = new File([largeContent], "large.pdf", {
			type: "application/pdf",
		});
		fireEvent.change(getFileInput(), { target: { files: [file] } });

		expect(
			screen.getByText("La taille du fichier ne doit pas dépasser 10 Mo."),
		).toBeInTheDocument();
	});

	it("renders the confirmation modal dialog", () => {
		const { container } = renderStep();

		const dialog = container.querySelector("dialog");
		expect(dialog).toHaveAttribute("id", "cse-submit-modal");
	});

	it("auto-uploads a selected PDF immediately, never showing an import action, and does not finalize", async () => {
		uploadFileMock.mockResolvedValue({
			ok: true,
			fileId: "new-file",
			fileName: "avis.pdf",
		});

		renderStep();

		const file = new File(["content"], "avis.pdf", { type: "application/pdf" });
		fireEvent.change(getFileInput(), { target: { files: [file] } });

		// Selection alone triggers the upload — no intermediate "Importer" step.
		await waitFor(() => {
			expect(uploadFileMock).toHaveBeenCalledWith(file, {
				flowType: "cse_opinion",
			});
		});
		await waitFor(() => {
			expect(invalidateFilesMock).toHaveBeenCalled();
		});
		expect(invalidateTypesMock).toHaveBeenCalled();
		expect(refreshMock).toHaveBeenCalled();
		expect(
			screen.queryByRole("button", { name: "Importer le ou les fichiers" }),
		).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Soumettre" })).toBeEnabled();
		expect(finalizeMutateAsyncMock).not.toHaveBeenCalled();
		expect(pushMock).not.toHaveBeenCalled();
	});

	it("renders the matrix with the existing files and the required content-type columns", () => {
		renderStep({
			columns: DUAL_COLUMNS,
			existingFiles: [makeFile("avis-1.pdf", "file-1")],
		});

		expect(screen.getByRole("link", { name: /avis-1\.pdf/ })).toHaveAttribute(
			"href",
			"/api/v1/files/file-1",
		);
		expect(screen.getAllByRole("checkbox")).toHaveLength(DUAL_COLUMNS.length);
	});

	it("renders the second-declaration column headers when a second declaration must be displayed", () => {
		renderStep({
			columns: DUAL_COLUMNS,
			existingFiles: [makeFile("avis-1.pdf", "file-1")],
		});

		const secondDeclarationColumns = DUAL_COLUMNS.filter(
			(column) => column.declarationNumber === 2,
		);
		expect(secondDeclarationColumns).toHaveLength(2);
		expect(screen.getAllByText("2e déclaration")).toHaveLength(
			secondDeclarationColumns.length,
		);
		for (const column of secondDeclarationColumns) {
			expect(
				screen.getByRole("columnheader", {
					name: new RegExp(`${column.label}[\\s\\S]*2e déclaration`),
				}),
			).toBeInTheDocument();
		}
	});

	it("does not show a file counter in the hint text", () => {
		renderStep({
			existingFiles: [
				makeFile("avis-1.pdf", "file-1"),
				makeFile("avis-2.pdf", "file-2"),
			],
		});

		expect(screen.queryByText(/fichiers\)/)).not.toBeInTheDocument();
	});

	it("disables the dropzone when the max number of files is reached", () => {
		renderStep({
			existingFiles: [
				makeFile("avis-1.pdf", "f1"),
				makeFile("avis-2.pdf", "f2"),
				makeFile("avis-3.pdf", "f3"),
				makeFile("avis-4.pdf", "f4"),
			],
		});

		expect(
			screen.getByRole("button", { name: /Sélectionner des fichiers/ }),
		).toBeDisabled();
	});

	it("reveals the missing-content error only after a submit attempt, blocking finalize (S8)", async () => {
		const user = userEvent.setup();
		renderStep({
			columns: DUAL_COLUMNS,
			existingFiles: [makeFile("avis-1.pdf", "file-1")],
		});

		// Loading files must not surface the error, and the button stays enabled.
		expect(
			screen.queryByText("Un avis CSE est manquant"),
		).not.toBeInTheDocument();
		const submit = screen.getByRole("button", { name: "Soumettre" });
		expect(submit).toBeEnabled();

		await user.click(submit);

		expect(screen.getByText("Un avis CSE est manquant")).toBeInTheDocument();
		expect(
			screen.getByText(
				"Ajoutez l'avis d'exactitude des données et des méthodes de calcul de la première déclaration, ou indiquez s'il est déjà inclus dans l'un des fichiers déposés.",
			),
		).toBeInTheDocument();
		expect(finalizeMutateAsyncMock).not.toHaveBeenCalled();
	});

	it("hides the missing-content error again once the required association is completed", async () => {
		const user = userEvent.setup();
		renderStep({
			columns: SINGLE_COLUMN,
			existingFiles: [makeFile("avis-1.pdf", "file-1")],
		});

		await user.click(screen.getByRole("button", { name: "Soumettre" }));
		expect(screen.getByText("Un avis CSE est manquant")).toBeInTheDocument();

		await user.click(
			screen.getByRole("checkbox", { name: "Exactitude — avis-1.pdf" }),
		);

		expect(
			screen.queryByText("Un avis CSE est manquant"),
		).not.toBeInTheDocument();
	});

	it("blocks finalize and names a file row left without any checked checkbox", async () => {
		const user = userEvent.setup();
		renderStep({
			columns: SINGLE_COLUMN,
			existingFiles: [
				makeFile("avis-1.pdf", "file-1"),
				makeFile("avis-2.pdf", "file-2"),
			],
			// file-1 covers the only required column; file-2 stays orphan.
			initialAssociations: [
				{ declarationNumber: 1, type: "accuracy", fileId: "file-1" },
			],
		});

		await user.click(screen.getByRole("button", { name: "Soumettre" }));

		// The required column is covered, so the missing-content error stays hidden.
		expect(
			screen.queryByText("Un avis CSE est manquant"),
		).not.toBeInTheDocument();
		expect(
			screen.getByText(
				"Chaque fichier doit être associé à au moins un type de contenu",
			),
		).toBeInTheDocument();
		expect(
			screen.getByText(/Le fichier «\s*avis-2\.pdf\s*» n'est associé/),
		).toBeInTheDocument();
		expect(finalizeMutateAsyncMock).not.toHaveBeenCalled();
	});

	it("persists the full association payload through setFileContentTypes when a checkbox is toggled (S7)", async () => {
		const user = userEvent.setup();
		renderStep({
			columns: DUAL_COLUMNS,
			existingFiles: [makeFile("avis-1.pdf", "file-1")],
		});

		await user.click(
			screen.getByRole("checkbox", {
				name: "Exactitude — 1re déclaration — avis-1.pdf",
			}),
		);

		expect(setTypesMutateMock).toHaveBeenCalledWith({
			associations: [
				{ declarationNumber: 1, type: "accuracy", fileId: "file-1" },
			],
		});
	});

	it("allows one file to cover several content types (S7)", async () => {
		const user = userEvent.setup();
		renderStep({
			columns: DUAL_COLUMNS,
			existingFiles: [makeFile("avis-1.pdf", "file-1")],
		});

		await user.click(
			screen.getByRole("checkbox", {
				name: "Exactitude — 1re déclaration — avis-1.pdf",
			}),
		);
		await user.click(
			screen.getByRole("checkbox", {
				name: "Justification — 1re déclaration — avis-1.pdf",
			}),
		);

		expect(setTypesMutateMock).toHaveBeenLastCalledWith({
			associations: [
				{ declarationNumber: 1, type: "accuracy", fileId: "file-1" },
				{ declarationNumber: 1, type: "gap", fileId: "file-1" },
			],
		});
	});

	it("frees a content type and re-persists when its checkbox is unchecked (S6)", async () => {
		const user = userEvent.setup();
		renderStep({
			columns: SINGLE_COLUMN,
			existingFiles: [makeFile("avis-1.pdf", "file-1")],
			initialAssociations: [
				{ declarationNumber: 1, type: "accuracy", fileId: "file-1" },
			],
		});

		await user.click(
			screen.getByRole("checkbox", { name: "Exactitude — avis-1.pdf" }),
		);

		expect(setTypesMutateMock).toHaveBeenCalledWith({ associations: [] });
		expect(
			screen.getByRole("checkbox", { name: "Exactitude — avis-1.pdf" }),
		).not.toBeChecked();
	});

	it("surfaces an error when persisting the association fails", () => {
		renderStep({
			columns: SINGLE_COLUMN,
			existingFiles: [makeFile("avis-1.pdf", "file-1")],
		});

		act(() => {
			setTypesMutationOptions.onError?.();
		});

		expect(
			screen.getByText(
				"Une erreur est survenue lors de l'enregistrement. Veuillez réessayer.",
			),
		).toBeInTheDocument();

		act(() => {
			setTypesMutationOptions.onSuccess?.();
		});

		expect(
			screen.queryByText(
				"Une erreur est survenue lors de l'enregistrement. Veuillez réessayer.",
			),
		).not.toBeInTheDocument();
	});

	it("hydrates the matrix from the stored associations on return (S10)", () => {
		renderStep({
			columns: SINGLE_COLUMN,
			existingFiles: [makeFile("avis-1.pdf", "file-1")],
			initialAssociations: [
				{ declarationNumber: 1, type: "accuracy", fileId: "file-1" },
			],
		});

		expect(
			screen.getByRole("checkbox", { name: "Exactitude — avis-1.pdf" }),
		).toBeChecked();
		expect(
			screen.queryByText("Un avis CSE est manquant"),
		).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Soumettre" })).toBeEnabled();
	});

	it("opens the finalize modal then finalizes and redirects when the matrix is complete", async () => {
		const user = userEvent.setup();
		renderStep({
			columns: SINGLE_COLUMN,
			existingFiles: [makeFile("avis-1.pdf", "file-1")],
			initialAssociations: [
				{ declarationNumber: 1, type: "accuracy", fileId: "file-1" },
			],
		});

		await user.click(screen.getByRole("button", { name: "Soumettre" }));

		await user.click(
			screen.getByRole("checkbox", {
				name: "Je certifie que les avis transmis sont conformes.",
			}),
		);
		await user.click(screen.getByRole("button", { name: "Valider" }));

		await waitFor(() => {
			expect(finalizeMutateAsyncMock).toHaveBeenCalled();
		});
		expect(uploadFileMock).not.toHaveBeenCalled();
		await waitFor(() => {
			expect(pushMock).toHaveBeenCalledWith("/avis-cse/confirmation");
		});
	});

	it("discloses the finalize modal through the DSFR runtime when available", async () => {
		const user = userEvent.setup();
		const disclose = vi.fn();
		// Simulate the DSFR JS runtime so getDsfrModal returns its modal API.
		(
			window as unknown as { dsfr: () => { modal: { disclose: () => void } } }
		).dsfr = () => ({ modal: { disclose } });

		try {
			renderStep({
				columns: SINGLE_COLUMN,
				existingFiles: [makeFile("avis-1.pdf", "file-1")],
				initialAssociations: [
					{ declarationNumber: 1, type: "accuracy", fileId: "file-1" },
				],
			});

			await user.click(screen.getByRole("button", { name: "Soumettre" }));

			expect(disclose).toHaveBeenCalled();
		} finally {
			delete (window as unknown as { dsfr?: unknown }).dsfr;
		}
	});

	it("shows an error and does not redirect when finalize fails", async () => {
		const user = userEvent.setup();
		finalizeMutateAsyncMock.mockRejectedValueOnce(
			new Error("Au moins un fichier d'avis CSE doit être transmis."),
		);

		renderStep({
			columns: SINGLE_COLUMN,
			existingFiles: [makeFile("avis-1.pdf", "file-1")],
			initialAssociations: [
				{ declarationNumber: 1, type: "accuracy", fileId: "file-1" },
			],
		});

		await user.click(screen.getByRole("button", { name: "Soumettre" }));
		await user.click(
			screen.getByRole("checkbox", {
				name: "Je certifie que les avis transmis sont conformes.",
			}),
		);
		await user.click(screen.getByRole("button", { name: "Valider" }));

		await waitFor(() => {
			expect(
				screen.getByText("Au moins un fichier d'avis CSE doit être transmis."),
			).toBeInTheDocument();
		});
		expect(pushMock).not.toHaveBeenCalled();
	});

	it("falls back to a generic error when finalize rejects with a non-Error value", async () => {
		const user = userEvent.setup();
		finalizeMutateAsyncMock.mockRejectedValueOnce("boom");

		renderStep({
			columns: SINGLE_COLUMN,
			existingFiles: [makeFile("avis-1.pdf", "file-1")],
			initialAssociations: [
				{ declarationNumber: 1, type: "accuracy", fileId: "file-1" },
			],
		});

		await user.click(screen.getByRole("button", { name: "Soumettre" }));
		await user.click(
			screen.getByRole("checkbox", {
				name: "Je certifie que les avis transmis sont conformes.",
			}),
		);
		await user.click(screen.getByRole("button", { name: "Valider" }));

		await waitFor(() => {
			expect(
				screen.getByText("Erreur lors de la validation du dépôt."),
			).toBeInTheDocument();
		});
		expect(pushMock).not.toHaveBeenCalled();
	});

	it("clears the association and refreshes on delete success", () => {
		renderStep({
			columns: SINGLE_COLUMN,
			existingFiles: [makeFile("avis-1.pdf", "file-1")],
			initialAssociations: [
				{ declarationNumber: 1, type: "accuracy", fileId: "file-1" },
			],
		});

		expect(
			screen.getByRole("checkbox", { name: "Exactitude — avis-1.pdf" }),
		).toBeChecked();

		fireEvent.click(screen.getByRole("button", { name: /Supprimer/ }));
		expect(deleteMutateMock).toHaveBeenCalledWith({ fileId: "file-1" });

		act(() => {
			deleteMutationOptions.onSuccess?.(undefined, { fileId: "file-1" });
		});

		expect(invalidateFilesMock).toHaveBeenCalled();
		expect(invalidateTypesMock).toHaveBeenCalled();
		expect(refreshMock).toHaveBeenCalled();
		expect(
			screen.getByRole("checkbox", { name: "Exactitude — avis-1.pdf" }),
		).not.toBeChecked();
	});

	it("clears the deleting state when the delete mutation fails", () => {
		renderStep({
			columns: SINGLE_COLUMN,
			existingFiles: [makeFile("avis-1.pdf", "file-1")],
		});

		fireEvent.click(screen.getByRole("button", { name: /Supprimer/ }));

		expect(() => {
			act(() => {
				deleteMutationOptions.onError?.();
			});
		}).not.toThrow();
	});

	describe("declaration lock", () => {
		it("disables the file upload select button when locked", () => {
			renderStep({ isReadOnly: true });

			expect(
				screen.getByRole("button", { name: /Sélectionner des fichiers/ }),
			).toBeDisabled();
		});

		it("disables the submit button when locked", () => {
			renderStep({ isReadOnly: true });

			expect(screen.getByRole("button", { name: "Soumettre" })).toBeDisabled();
		});

		it("disables the matrix delete and checkbox controls when locked", () => {
			renderStep({
				columns: SINGLE_COLUMN,
				existingFiles: [makeFile("avis-1.pdf", "file-1")],
				isReadOnly: true,
			});

			expect(
				screen.getByRole("checkbox", { name: "Exactitude — avis-1.pdf" }),
			).toBeDisabled();
			expect(screen.getByRole("button", { name: /Supprimer/ })).toBeDisabled();
		});

		it("keeps the controls enabled when the lock is inactive", () => {
			renderStep({ isReadOnly: false });

			expect(
				screen.getByRole("button", { name: /Sélectionner des fichiers/ }),
			).toBeEnabled();
			expect(screen.getByRole("button", { name: "Soumettre" })).toBeEnabled();
		});
	});

	describe("admin impersonation", () => {
		afterEach(() => {
			vi.mocked(useSession).mockReset();
		});

		it("disables the upload and submit controls under the static provider when impersonating", () => {
			vi.mocked(useSession).mockReturnValue({
				data: {
					user: {
						id: "admin-1",
						impersonation: { siren: "123456789", name: "Acme" },
					},
					expires: "2099-01-01",
				},
				status: "authenticated",
			} as unknown as ReturnType<typeof useSession>);

			// The layout feeds `isReadOnly={false}` but impersonation must still
			// disable writes through the unified context.
			renderStep({
				columns: SINGLE_COLUMN,
				existingFiles: [makeFile("avis-1.pdf", "file-1")],
				isReadOnly: false,
			});

			expect(
				screen.getByRole("button", { name: /Sélectionner des fichiers/ }),
			).toBeDisabled();
			expect(screen.getByRole("button", { name: "Soumettre" })).toBeDisabled();
			expect(screen.getByRole("button", { name: /Supprimer/ })).toBeDisabled();
		});
	});
});
