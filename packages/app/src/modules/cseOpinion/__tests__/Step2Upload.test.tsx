import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Step2Upload } from "../Step2Upload";

vi.mock("~/trpc/react", () => ({
	api: {
		cseOpinion: {
			uploadFile: {
				useMutation: () => ({
					mutate: vi.fn(),
					isPending: false,
					error: null,
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
			screen.getByText(/Veuillez importer l'ensemble des avis de votre CSE/),
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

	it("shows error when submitting without file", async () => {
		const user = userEvent.setup();
		render(<Step2Upload />);

		await user.click(screen.getByRole("button", { name: /Soumettre/ }));

		expect(
			screen.getByText("Veuillez sélectionner un fichier avant de soumettre."),
		).toBeInTheDocument();
	});

	it("sets aria-invalid on file input when error occurs", async () => {
		const user = userEvent.setup();
		render(<Step2Upload />);

		const fileInput = getFileInput();
		expect(fileInput).toHaveAttribute("aria-invalid", "false");

		await user.click(screen.getByRole("button", { name: /Soumettre/ }));

		expect(fileInput).toHaveAttribute("aria-invalid", "true");
	});

	it("shows error for non-PDF file", () => {
		render(<Step2Upload />);

		const file = new File(["content"], "test.txt", { type: "text/plain" });
		const fileInput = getFileInput();

		fireEvent.change(fileInput, { target: { files: [file] } });

		expect(
			screen.getByText(
				"Format de fichier non supporté. Formats acceptés : pdf.",
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
			screen.getByText("La taille du fichier ne doit pas dépasser 10 Mo."),
		).toBeInTheDocument();
	});

	it("renders the confirmation modal dialog", () => {
		const { container } = render(<Step2Upload />);

		const dialog = container.querySelector("dialog");
		expect(dialog).toBeInTheDocument();
		expect(dialog).toHaveAttribute("id", "cse-submit-modal");
	});

	it("accepts PDF file and shows file card", () => {
		render(<Step2Upload />);

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
});
