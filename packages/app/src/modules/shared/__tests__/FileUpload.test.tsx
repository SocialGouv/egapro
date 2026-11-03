import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FileUpload } from "../FileUpload";
import { FILENAME_ERROR_MESSAGES } from "../fileNameValidation";

const PDF_MIME = "application/pdf";

const baseProps = {
	inputId: "test-upload",
	labelId: "test-upload-label",
	accept: ".pdf",
	acceptLabel: "pdf",
	allowedMimeTypes: [PDF_MIME],
};

function makePdf(name = "rapport.pdf", size = 2048) {
	const file = new File(["pdf"], name, { type: PDF_MIME });
	Object.defineProperty(file, "size", { value: size });
	return file;
}

function getInput() {
	return document.getElementById("test-upload") as HTMLInputElement;
}

function ControlledFileUpload({
	onChange,
	allowedMimeTypes = [PDF_MIME, "image/png"],
	maxFileCount,
	disabled,
	fileList,
}: {
	onChange?: (files: File[], error: string | null) => void;
	allowedMimeTypes?: string[];
	maxFileCount?: number;
	disabled?: boolean;
	fileList?: "cards" | "table";
}) {
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
	const [error, setError] = useState<string | null>(null);

	return (
		<FileUpload
			accept=".pdf,.png"
			acceptLabel="pdf, png"
			allowedMimeTypes={allowedMimeTypes}
			disabled={disabled}
			error={error}
			fileList={fileList}
			inputId="test-upload"
			labelId="test-upload-label"
			maxFileCount={maxFileCount}
			onFilesChange={(files, nextError) => {
				setSelectedFiles(files);
				setError(nextError);
				onChange?.(files, nextError);
			}}
			selectedFiles={selectedFiles}
		/>
	);
}

describe("FileUpload — accessible name (RGAA 11.2)", () => {
	function renderWithLabel() {
		return render(
			<>
				<label
					className="fr-label"
					htmlFor="test-upload"
					id="test-upload-label"
				>
					Veuillez déposer le rapport de l&apos;évaluation conjointe.
					<span className="fr-hint-text">Taille maximale : 10 Mo.</span>
				</label>
				<FileUpload
					{...baseProps}
					error={null}
					onFilesChange={vi.fn()}
					selectedFiles={[]}
				/>
			</>,
		);
	}

	it("names the file input with the visible label instead of a generic text", () => {
		renderWithLabel();
		const input = getInput();
		expect(input).not.toHaveAttribute("aria-label");
		expect(input).toHaveAccessibleName(
			/Veuillez déposer le rapport de l.évaluation conjointe\./,
		);
	});

	it("keeps the select button's visible name and describes it with the requested document", () => {
		renderWithLabel();
		const button = screen.getByRole("button", {
			name: /Sélectionner un fichier/,
		});
		expect(button).toHaveAccessibleDescription(
			/Veuillez déposer le rapport de l.évaluation conjointe\./,
		);
	});
});

describe("FileUpload", () => {
	beforeEach(() => {
		vi.mocked(URL.createObjectURL).mockClear();
		vi.mocked(URL.revokeObjectURL).mockClear();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("renders the dropzone with a select button", () => {
		render(
			<FileUpload
				{...baseProps}
				error={null}
				onFilesChange={vi.fn()}
				selectedFiles={[]}
			/>,
		);

		expect(
			screen.getByRole("button", { name: /Sélectionner un fichier/ }),
		).toBeInTheDocument();
		expect(screen.getByText("ou glisser-le ici")).toBeInTheDocument();
	});

	it("exposes upload errors as an atomic alert", () => {
		render(
			<FileUpload
				{...baseProps}
				error="Le format du fichier n'est pas supporté."
				onFilesChange={vi.fn()}
				selectedFiles={[]}
			/>,
		);

		const messages = document.querySelector(".fr-messages-group");
		expect(messages).toHaveAttribute("role", "alert");
		expect(messages).toHaveAttribute("aria-atomic", "true");
		expect(messages).toHaveTextContent(
			"Le format du fichier n'est pas supporté.",
		);
	});

	it("opens the file dialog when the select button is clicked", async () => {
		const user = userEvent.setup();
		render(
			<FileUpload
				{...baseProps}
				error={null}
				onFilesChange={vi.fn()}
				selectedFiles={[]}
			/>,
		);
		const clickSpy = vi.spyOn(getInput(), "click");

		await user.click(
			screen.getByRole("button", { name: /Sélectionner un fichier/ }),
		);

		expect(clickSpy).toHaveBeenCalled();
	});

	it("renders a DSFR download link for each selected file", () => {
		render(
			<FileUpload
				{...baseProps}
				error={null}
				onFilesChange={vi.fn()}
				selectedFiles={[makePdf("avis.pdf", 2048)]}
			/>,
		);

		const link = screen.getByRole("link", { name: /Télécharger avis\.pdf/ });
		expect(link).toHaveClass("fr-link");
		expect(link).toHaveAttribute("download", "avis.pdf");
		expect(link).toHaveAttribute("href", "blob:mock/avis.pdf");
		// The file meta is rendered outside the link (only the file name is the
		// underlined link target).
		expect(link).toHaveTextContent("avis.pdf");
		expect(link).not.toHaveTextContent("PDF – 2 Ko");
		expect(screen.getByText("PDF – 2 Ko")).toHaveClass("fr-text-mention--grey");
	});

	describe("table file list", () => {
		it("lists the selected file in a « Fichier déposé » table with a new-tab link", () => {
			render(
				<FileUpload
					{...baseProps}
					error={null}
					fileList="table"
					onFilesChange={vi.fn()}
					selectedFiles={[makePdf("avis.pdf", 2048)]}
				/>,
			);

			const table = screen.getByRole("table", { name: "Fichier déposé" });
			expect(
				within(table).getByRole("columnheader", { name: "Fichier déposé" }),
			).toBeInTheDocument();
			const link = within(table).getByRole("link", { name: /avis\.pdf/ });
			expect(link).toHaveAttribute("href", "blob:mock/avis.pdf");
			expect(link).toHaveAttribute("target", "_blank");
			expect(link).toHaveTextContent("(ouvre une nouvelle fenêtre)");
			expect(link).not.toHaveAttribute("download");
			expect(within(table).getByText("PDF – 2 Ko")).toHaveClass(
				"fr-text-mention--grey",
			);
			expect(
				screen.queryByRole("link", { name: /Télécharger avis\.pdf/ }),
			).not.toBeInTheDocument();
		});

		it("removes the file via an icon-only delete button", async () => {
			const user = userEvent.setup();
			const onFilesChange = vi.fn();
			render(
				<FileUpload
					{...baseProps}
					error={null}
					fileList="table"
					onFilesChange={onFilesChange}
					selectedFiles={[makePdf("avis.pdf")]}
				/>,
			);

			const button = screen.getByRole("button", { name: "Supprimer avis.pdf" });
			expect(button).toHaveAttribute("title", "Supprimer avis.pdf");
			expect(button).toHaveClass("fr-btn--secondary", "fr-icon-delete-line");

			await user.click(button);

			expect(onFilesChange).toHaveBeenCalledWith([], null);
		});

		it("moves focus back to the file selection button after deleting the file", async () => {
			const user = userEvent.setup();
			render(<ControlledFileUpload fileList="table" />);

			fireEvent.change(getInput(), {
				target: { files: [makePdf("avis.pdf")] },
			});
			await user.click(
				screen.getByRole("button", { name: "Supprimer avis.pdf" }),
			);

			expect(screen.queryByRole("table")).not.toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: /Sélectionner un fichier/ }),
			).toHaveFocus();
		});

		it("disables the delete button when the upload is disabled", () => {
			render(
				<FileUpload
					{...baseProps}
					disabled
					error={null}
					fileList="table"
					onFilesChange={vi.fn()}
					selectedFiles={[makePdf("avis.pdf")]}
				/>,
			);

			expect(
				screen.getByRole("button", { name: "Supprimer avis.pdf" }),
			).toBeDisabled();
		});

		it("renders no table while no file is selected", () => {
			render(
				<FileUpload
					{...baseProps}
					error={null}
					fileList="table"
					onFilesChange={vi.fn()}
					selectedFiles={[]}
				/>,
			);

			expect(screen.queryByRole("table")).not.toBeInTheDocument();
		});
	});

	it("creates an object URL per file and revokes it on unmount", () => {
		const { unmount } = render(
			<FileUpload
				{...baseProps}
				error={null}
				onFilesChange={vi.fn()}
				selectedFiles={[makePdf("a.pdf"), makePdf("b.pdf")]}
			/>,
		);

		expect(URL.createObjectURL).toHaveBeenCalledTimes(2);

		unmount();

		expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
		expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock/a.pdf");
		expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock/b.pdf");
	});

	it("labels the delete button with the file name", () => {
		render(
			<FileUpload
				{...baseProps}
				error={null}
				onFilesChange={vi.fn()}
				selectedFiles={[makePdf("avis.pdf")]}
			/>,
		);

		expect(
			screen.getByRole("button", { name: "Supprimer avis.pdf" }),
		).toBeInTheDocument();
	});

	it("removes a file via the delete button", async () => {
		const user = userEvent.setup();
		const onFilesChange = vi.fn();
		render(
			<FileUpload
				{...baseProps}
				error={null}
				maxFileCount={2}
				onFilesChange={onFilesChange}
				selectedFiles={[makePdf("a.pdf"), makePdf("b.pdf")]}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Supprimer a.pdf" }));

		expect(onFilesChange).toHaveBeenCalledWith([expect.any(File)], null);
		expect(onFilesChange.mock.calls[0]?.[0][0].name).toBe("b.pdf");
	});

	it.each([
		[512, "0,5 Ko"],
		[2048, "2 Ko"],
		[5 * 1024 * 1024, "5 Mo"],
	])("formats a %d-byte file size as %s", (size, label) => {
		render(
			<FileUpload
				{...baseProps}
				error={null}
				onFilesChange={vi.fn()}
				selectedFiles={[makePdf("doc.pdf", size)]}
			/>,
		);

		expect(
			screen.getByRole("link", { name: /Télécharger doc\.pdf/ }),
		).toBeInTheDocument();
		expect(screen.getByText(`PDF – ${label}`)).toBeInTheDocument();
	});

	it("falls back to a generic extension label when the name has no extension", () => {
		render(
			<FileUpload
				{...baseProps}
				error={null}
				onFilesChange={vi.fn()}
				selectedFiles={[makePdf("noextension", 1024)]}
			/>,
		);

		expect(
			screen.getByRole("link", { name: /Télécharger noextension/ }),
		).toBeInTheDocument();
		expect(screen.getByText("NOEXTENSION – 1 Ko")).toBeInTheDocument();
	});

	it("accepts a valid file through the input", () => {
		const onFilesChange = vi.fn();
		render(
			<FileUpload
				{...baseProps}
				error={null}
				onFilesChange={onFilesChange}
				selectedFiles={[]}
			/>,
		);
		const file = makePdf();

		fireEvent.change(getInput(), { target: { files: [file] } });

		expect(onFilesChange).toHaveBeenCalledWith([file], null);
	});

	it("ignores a change event with no files", () => {
		const onFilesChange = vi.fn();
		render(
			<FileUpload
				{...baseProps}
				error={null}
				onFilesChange={onFilesChange}
				selectedFiles={[]}
			/>,
		);

		fireEvent.change(getInput(), { target: { files: [] } });

		expect(onFilesChange).not.toHaveBeenCalled();
	});

	it("rejects a file with a disallowed MIME type", () => {
		const onFilesChange = vi.fn();
		render(
			<FileUpload
				{...baseProps}
				error={null}
				onFilesChange={onFilesChange}
				selectedFiles={[]}
			/>,
		);
		// Valid filename/extension (".png" is a known extension) but a MIME type
		// outside this dropzone's allow-list, so the MIME check rejects it.
		const file = new File(["x"], "image.png", { type: "image/png" });

		fireEvent.change(getInput(), { target: { files: [file] } });

		expect(onFilesChange).toHaveBeenCalledWith(
			[],
			"Format de fichier non supporté. Formats acceptés : pdf.",
		);
	});

	it("rejects a file larger than the maximum size", () => {
		const onFilesChange = vi.fn();
		render(
			<FileUpload
				{...baseProps}
				error={null}
				onFilesChange={onFilesChange}
				selectedFiles={[]}
			/>,
		);
		const file = makePdf("big.pdf", 11 * 1024 * 1024);

		fireEvent.change(getInput(), { target: { files: [file] } });

		expect(onFilesChange).toHaveBeenCalledWith(
			[],
			"La taille du fichier ne doit pas dépasser 10 Mo.",
		);
	});

	it("renders the error message and marks the input invalid", () => {
		render(
			<FileUpload
				{...baseProps}
				error="Une erreur"
				onFilesChange={vi.fn()}
				selectedFiles={[]}
			/>,
		);

		expect(screen.getByText("Une erreur")).toBeInTheDocument();
		expect(getInput()).toHaveAttribute("aria-invalid", "true");
	});

	it("accepts a file dropped on the dropzone", () => {
		const onFilesChange = vi.fn();
		render(
			<FileUpload
				{...baseProps}
				error={null}
				onFilesChange={onFilesChange}
				selectedFiles={[]}
			/>,
		);
		const dropzone = screen.getByLabelText("Zone de dépôt de fichier");
		const file = makePdf();

		fireEvent.dragEnter(dropzone, { dataTransfer: { files: [file] } });
		fireEvent.dragOver(dropzone, { dataTransfer: { files: [file] } });
		fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });

		expect(onFilesChange).toHaveBeenCalledWith([file], null);
	});

	it("ignores a drop with no files", () => {
		const onFilesChange = vi.fn();
		render(
			<FileUpload
				{...baseProps}
				error={null}
				onFilesChange={onFilesChange}
				selectedFiles={[]}
			/>,
		);
		const dropzone = screen.getByLabelText("Zone de dépôt de fichier");

		fireEvent.drop(dropzone, { dataTransfer: { files: [] } });

		expect(onFilesChange).not.toHaveBeenCalled();
	});

	it("keeps the dragging state while the pointer stays inside the dropzone", () => {
		render(
			<FileUpload
				{...baseProps}
				error={null}
				onFilesChange={vi.fn()}
				selectedFiles={[]}
			/>,
		);
		const dropzone = screen.getByLabelText("Zone de dépôt de fichier");
		const child = dropzone.querySelector("button") as HTMLElement;

		fireEvent.dragEnter(dropzone);
		fireEvent.dragLeave(dropzone, { relatedTarget: child });
		fireEvent.dragLeave(dropzone, { relatedTarget: document.body });

		expect(dropzone).toBeInTheDocument();
	});

	it("caps the selection at the remaining slots", () => {
		const onFilesChange = vi.fn();
		render(
			<FileUpload
				{...baseProps}
				error={null}
				maxFileCount={2}
				onFilesChange={onFilesChange}
				selectedFiles={[makePdf("a.pdf")]}
			/>,
		);

		fireEvent.change(getInput(), {
			target: { files: [makePdf("b.pdf"), makePdf("c.pdf")] },
		});

		const [files] = onFilesChange.mock.calls[0] ?? [];
		expect(files).toHaveLength(2);
		expect(files[1].name).toBe("b.pdf");
	});

	it("disables the dropzone and input when disabled", () => {
		render(
			<FileUpload
				{...baseProps}
				disabled
				error={null}
				onFilesChange={vi.fn()}
				selectedFiles={[]}
			/>,
		);

		expect(
			screen.getByRole("button", { name: /Sélectionner un fichier/ }),
		).toBeDisabled();
		expect(getInput()).toBeDisabled();
	});
});

describe("FileUpload filename validation", () => {
	it("S1: accepts a valid name with accents and emoji, no error and the file is listed", async () => {
		const onChange = vi.fn();
		render(<ControlledFileUpload onChange={onChange} />);
		const file = new File(["pdf-bytes"], "Mon avis CSE — été 2024 🎉.pdf", {
			type: PDF_MIME,
		});

		await userEvent.upload(getInput(), file);

		expect(onChange).toHaveBeenCalledWith([file], null);
		expect(screen.queryByText(/caractères interdits/i)).not.toBeInTheDocument();
		expect(
			screen.queryByText("Mon avis CSE — été 2024 🎉.pdf"),
		).toBeInTheDocument();
	});

	it("S2: rejects a forbidden character with the forbidden_char message and no file listed", async () => {
		const onChange = vi.fn();
		render(<ControlledFileUpload onChange={onChange} />);
		const file = new File(["pdf-bytes"], "avis<cse>.pdf", { type: PDF_MIME });

		await userEvent.upload(getInput(), file);

		expect(onChange).toHaveBeenCalledWith(
			[],
			FILENAME_ERROR_MESSAGES.forbidden_char,
		);
		expect(
			screen.getByText(FILENAME_ERROR_MESSAGES.forbidden_char),
		).toBeInTheDocument();
		expect(screen.queryByText("avis<cse>.pdf")).not.toBeInTheDocument();
	});

	it("S3: rejects a name over 200 characters with a message mentioning 200", async () => {
		const onChange = vi.fn();
		render(<ControlledFileUpload onChange={onChange} />);
		const longName = `${"a".repeat(201)}.pdf`;
		const file = new File(["pdf-bytes"], longName, { type: PDF_MIME });

		await userEvent.upload(getInput(), file);

		expect(onChange).toHaveBeenCalledWith([], FILENAME_ERROR_MESSAGES.too_long);
		expect(screen.getByText(/200/)).toBeInTheDocument();
		expect(
			screen.getByText(FILENAME_ERROR_MESSAGES.too_long),
		).toHaveTextContent("200");
	});

	it("S4: rejects an extension/MIME mismatch with the extension_mime_mismatch message", async () => {
		const onChange = vi.fn();
		render(<ControlledFileUpload onChange={onChange} />);
		const file = new File(["png-bytes"], "avis-cse.pdf", { type: "image/png" });

		await userEvent.upload(getInput(), file);

		expect(onChange).toHaveBeenCalledWith(
			[],
			FILENAME_ERROR_MESSAGES.extension_mime_mismatch,
		);
		expect(
			screen.getByText(FILENAME_ERROR_MESSAGES.extension_mime_mismatch),
		).toBeInTheDocument();
	});

	it("S5: rejects an invisible character with the invisible_char message", async () => {
		const onChange = vi.fn();
		render(<ControlledFileUpload onChange={onChange} />);
		const file = new File(["pdf-bytes"], "avis\u202Ecse.pdf", {
			type: PDF_MIME,
		});

		await userEvent.upload(getInput(), file);

		expect(onChange).toHaveBeenCalledWith(
			[],
			FILENAME_ERROR_MESSAGES.invisible_char,
		);
		expect(
			screen.getByText(FILENAME_ERROR_MESSAGES.invisible_char),
		).toBeInTheDocument();
	});

	it("runs the filename check before the MIME check: a bad name with a disallowed MIME yields the filename error", async () => {
		const onChange = vi.fn();
		render(
			<ControlledFileUpload
				allowedMimeTypes={[PDF_MIME]}
				onChange={onChange}
			/>,
		);
		const file = new File(["x"], "avis<cse>.png", { type: "image/png" });

		await userEvent.upload(getInput(), file);

		expect(onChange).toHaveBeenCalledWith(
			[],
			FILENAME_ERROR_MESSAGES.forbidden_char,
		);
	});
});
