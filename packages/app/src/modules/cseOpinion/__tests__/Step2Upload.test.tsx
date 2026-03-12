import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Step2Upload } from "../Step2Upload";

const submitFilesMock = vi.fn();
const deleteFileMock = vi.fn();

vi.mock("~/trpc/react", () => ({
	api: {
		cseOpinion: {
			submitFiles: {
				useMutation: () => ({
					mutateAsync: submitFilesMock,
				}),
			},
			deleteFile: {
				useMutation: () => ({
					mutateAsync: deleteFileMock,
				}),
			},
		},
	},
}));

function getFileInput() {
	return document.getElementById("cse-file-upload") as HTMLInputElement;
}

describe("Step2Upload", () => {
	it("renders the page title", () => {
		render(<Step2Upload />);

		expect(
			screen.getByText("Transmettre l'avis ou les avis du CSE"),
		).toBeInTheDocument();
	});

	it("renders the stepper at step 2", () => {
		render(<Step2Upload />);

		expect(screen.getByText(/Étape 2 sur 2/)).toBeInTheDocument();
	});

	it("renders the file upload instructions", () => {
		render(<Step2Upload />);

		expect(
			screen.getByText("Veuillez importer l'ensemble des avis de votre CSE"),
		).toBeInTheDocument();
		expect(screen.getByText(/Taille maximale.*pdf/)).toBeInTheDocument();
	});

	it("renders the dropzone with select button", () => {
		render(<Step2Upload />);

		expect(
			screen.getByRole("button", { name: /Sélectionner un fichier/ }),
		).toBeInTheDocument();
		expect(screen.getByText("ou glisser-le ici")).toBeInTheDocument();
	});

	it("renders a hidden file input", () => {
		render(<Step2Upload />);

		const fileInput = getFileInput();
		expect(fileInput).toBeInTheDocument();
		expect(fileInput).toHaveAttribute("type", "file");
		expect(fileInput).toHaveAttribute("accept", ".pdf");
	});

	it("renders the opinion summary box", () => {
		render(<Step2Upload />);

		expect(screen.getByText("Avis CSE à transmettre :")).toBeInTheDocument();
		expect(screen.getByText("Première déclaration")).toBeInTheDocument();
		expect(screen.getByText("Deuxième déclaration")).toBeInTheDocument();
	});

	it("renders previous link and submit button", () => {
		render(<Step2Upload />);

		const previousLink = screen.getByRole("link", { name: /Précédent/ });
		expect(previousLink).toBeInTheDocument();
		expect(previousLink).toHaveAttribute("href", "/avis-cse/etape/1");

		expect(
			screen.getByRole("button", { name: /Soumettre/ }),
		).toBeInTheDocument();
	});

	it("disables submit button when no files are present", () => {
		render(<Step2Upload />);

		const submitButton = screen.getByRole("button", { name: /Soumettre/ });
		expect(submitButton).toBeDisabled();
	});

	it("enables submit button when a file is selected", () => {
		render(<Step2Upload />);

		const file = new File(["content"], "avis.pdf", {
			type: "application/pdf",
		});
		fireEvent.change(getFileInput(), { target: { files: [file] } });

		const submitButton = screen.getByRole("button", { name: /Soumettre/ });
		expect(submitButton).toBeEnabled();
	});

	it("sets aria-invalid on file input when error occurs", () => {
		render(<Step2Upload />);

		const fileInput = getFileInput();
		expect(fileInput).toHaveAttribute("aria-invalid", "false");

		const file = new File(["content"], "test.txt", { type: "text/plain" });
		fireEvent.change(fileInput, { target: { files: [file] } });

		expect(fileInput).toHaveAttribute("aria-invalid", "true");
	});

	it("shows error for non-PDF file", () => {
		render(<Step2Upload />);

		const file = new File(["content"], "test.txt", { type: "text/plain" });
		const fileInput = getFileInput();

		fireEvent.change(fileInput, { target: { files: [file] } });

		expect(
			screen.getByText(
				"Format de fichier non supporté. Seul le format PDF est accepté.",
			),
		).toBeInTheDocument();
	});

	it("shows error for file exceeding 10 MB", () => {
		render(<Step2Upload />);

		const largeContent = new ArrayBuffer(11 * 1024 * 1024);
		const file = new File([largeContent], "large.pdf", {
			type: "application/pdf",
		});
		const fileInput = getFileInput();

		fireEvent.change(fileInput, { target: { files: [file] } });

		expect(
			screen.getByText(
				"Le fichier dépasse la taille maximale autorisée de 10 Mo.",
			),
		).toBeInTheDocument();
	});

	it("renders the confirmation modal dialog", () => {
		const { container } = render(<Step2Upload />);

		const dialog = container.querySelector("dialog");
		expect(dialog).toBeInTheDocument();
		expect(dialog).toHaveAttribute("id", "cse-submit-modal");
	});

	it("accepts PDF file and shows file card with pending state", () => {
		render(<Step2Upload />);

		const file = new File(["content"], "avis-cse.pdf", {
			type: "application/pdf",
		});
		const fileInput = getFileInput();

		fireEvent.change(fileInput, { target: { files: [file] } });

		expect(screen.getByText("avis-cse.pdf")).toBeInTheDocument();
		expect(screen.getByText("En attente d'envoi")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Envoyer/ })).toBeInTheDocument();
	});

	it("removes selected file when delete button is clicked", async () => {
		const user = userEvent.setup();
		render(<Step2Upload />);

		const file = new File(["content"], "avis-cse.pdf", {
			type: "application/pdf",
		});
		const fileInput = getFileInput();

		fireEvent.change(fileInput, { target: { files: [file] } });

		expect(screen.getByText("avis-cse.pdf")).toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: /Supprimer/ }));

		expect(screen.queryByText("avis-cse.pdf")).not.toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /Sélectionner un fichier/ }),
		).toBeInTheDocument();
	});

	it("renders existing uploaded files", () => {
		const existingFiles = [
			{
				id: "file-1",
				fileName: "existing.pdf",
				fileSize: 1024,
				uploadedAt: new Date("2026-01-01"),
			},
		];

		render(<Step2Upload existingFiles={existingFiles} />);

		expect(screen.getByText("existing.pdf")).toBeInTheDocument();
		expect(screen.getByText("Importation réussie")).toBeInTheDocument();
	});

	it("calls upload API when Envoyer button is clicked", async () => {
		const user = userEvent.setup();
		const mockResponse = {
			id: "new-id",
			fileName: "avis.pdf",
			fileSize: 100,
			uploadedAt: new Date().toISOString(),
		};

		vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
			new Response(JSON.stringify(mockResponse), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			}),
		);

		render(<Step2Upload />);

		const file = new File(["content"], "avis.pdf", {
			type: "application/pdf",
		});
		fireEvent.change(getFileInput(), { target: { files: [file] } });

		await user.click(screen.getByRole("button", { name: /Envoyer/ }));

		await waitFor(() => {
			expect(globalThis.fetch).toHaveBeenCalledWith(
				"/api/cse-opinion/upload",
				expect.objectContaining({ method: "POST" }),
			);
		});
	});

	it("shows upload error from API response", async () => {
		const user = userEvent.setup();

		vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
			new Response(
				JSON.stringify({ error: "Le fichier a été rejeté par l'antivirus." }),
				{ status: 422, headers: { "Content-Type": "application/json" } },
			),
		);

		render(<Step2Upload />);

		const file = new File(["content"], "virus.pdf", {
			type: "application/pdf",
		});
		fireEvent.change(getFileInput(), { target: { files: [file] } });

		await user.click(screen.getByRole("button", { name: /Envoyer/ }));

		await waitFor(() => {
			expect(
				screen.getByText("Le fichier a été rejeté par l'antivirus."),
			).toBeInTheDocument();
		});
	});

	it("calls deleteFile mutation when deleting an uploaded file", async () => {
		const user = userEvent.setup();
		deleteFileMock.mockResolvedValue({ success: true });

		const existingFiles = [
			{
				id: "file-1",
				fileName: "existing.pdf",
				fileSize: 1024,
				uploadedAt: new Date("2026-01-01"),
			},
		];

		render(<Step2Upload existingFiles={existingFiles} />);

		await user.click(screen.getByRole("button", { name: /Supprimer/ }));

		await waitFor(() => {
			expect(deleteFileMock).toHaveBeenCalledWith({ fileId: "file-1" });
		});
	});
});
