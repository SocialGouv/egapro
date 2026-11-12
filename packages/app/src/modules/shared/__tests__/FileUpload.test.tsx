import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FileUpload } from "../FileUpload";
import { FILENAME_ERROR_MESSAGES } from "../fileNameValidation";
import { FILE_TOO_LARGE_ERROR } from "../uploadConfig";
import { UPLOAD_ERROR, type UploadError } from "../uploadErrors";

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
	acceptLabel,
	maxFileCount,
	disabled,
	fileList,
}: {
	onChange?: (files: File[], error: UploadError | null) => void;
	allowedMimeTypes?: string[];
	acceptLabel?: string;
	maxFileCount?: number;
	disabled?: boolean;
	fileList?: "cards" | "table";
}) {
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
	const [error, setError] = useState<UploadError | null>(null);

	return (
		<FileUpload
			accept=".pdf,.png"
			acceptLabel={acceptLabel ?? "pdf, png"}
			allowedMimeTypes={allowedMimeTypes}
			disabled={disabled}
			error={error}
			fileList={fileList}
			inputId="test-upload"
			labelId="test-upload-label"
			maxFileCount={maxFileCount}
			onErrorDismiss={() => setError(null)}
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
					onErrorDismiss={vi.fn()}
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
				onErrorDismiss={vi.fn()}
				onFilesChange={vi.fn()}
				selectedFiles={[]}
			/>,
		);

		expect(
			screen.getByRole("button", { name: /Sélectionner un fichier/ }),
		).toBeInTheDocument();
		expect(screen.getByText("ou glisser-le ici")).toBeInTheDocument();
	});

	it("renders the upload error as an alert with a title, a description and a close button", () => {
		render(
			<FileUpload
				{...baseProps}
				error={UPLOAD_ERROR.format("pdf")}
				onErrorDismiss={vi.fn()}
				onFilesChange={vi.fn()}
				selectedFiles={[]}
			/>,
		);

		const alert = screen.getByRole("alert");
		expect(alert).toHaveClass("fr-alert", "fr-alert--error");
		expect(alert).toHaveTextContent("Format non supporté");
		expect(alert).toHaveTextContent(
			"Ce fichier ne peut pas être importé. Seuls les fichiers au format PDF sont acceptés.",
		);
		expect(
			within(alert).getByRole("button", { name: "Masquer le message" }),
		).toBeInTheDocument();
		expect(getInput()).toHaveAttribute("aria-invalid", "true");
	});

	it("opens the file dialog when the select button is clicked", async () => {
		const user = userEvent.setup();
		render(
			<FileUpload
				{...baseProps}
				error={null}
				onErrorDismiss={vi.fn()}
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
				onErrorDismiss={vi.fn()}
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
					onErrorDismiss={vi.fn()}
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
					onErrorDismiss={vi.fn()}
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
					onErrorDismiss={vi.fn()}
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
					onErrorDismiss={vi.fn()}
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
				onErrorDismiss={vi.fn()}
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
				onErrorDismiss={vi.fn()}
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
				onErrorDismiss={vi.fn()}
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
				onErrorDismiss={vi.fn()}
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
				onErrorDismiss={vi.fn()}
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
				onErrorDismiss={vi.fn()}
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
				onErrorDismiss={vi.fn()}
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
				onErrorDismiss={vi.fn()}
				onFilesChange={onFilesChange}
				selectedFiles={[]}
			/>,
		);
		// Valid filename/extension (".png" is a known extension) but a MIME type
		// outside this dropzone's allow-list, so the MIME check rejects it.
		const file = new File(["x"], "image.png", { type: "image/png" });

		fireEvent.change(getInput(), { target: { files: [file] } });

		expect(onFilesChange).toHaveBeenCalledWith([], UPLOAD_ERROR.format("pdf"));
	});

	it("names the accepted formats of the surface in the format error", () => {
		const onFilesChange = vi.fn();
		render(
			<FileUpload
				{...baseProps}
				accept=".xlsx,.csv"
				acceptLabel="xlsx, csv"
				allowedMimeTypes={["application/pdf"]}
				error={null}
				onErrorDismiss={vi.fn()}
				onFilesChange={onFilesChange}
				selectedFiles={[]}
			/>,
		);
		const file = new File(["x"], "image.png", { type: "image/png" });

		fireEvent.change(getInput(), { target: { files: [file] } });

		expect(onFilesChange).toHaveBeenCalledWith(
			[],
			expect.objectContaining({
				title: "Format non supporté",
				message:
					"Ce fichier ne peut pas être importé. Seuls les fichiers au format XLSX, CSV sont acceptés.",
			}),
		);
	});

	it("reports the format error for a file whose extension the surface does not accept", () => {
		const onFilesChange = vi.fn();
		render(
			<FileUpload
				{...baseProps}
				error={null}
				onErrorDismiss={vi.fn()}
				onFilesChange={onFilesChange}
				selectedFiles={[]}
			/>,
		);
		const file = new File(["docx"], "avis.docx", {
			type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		});

		fireEvent.change(getInput(), { target: { files: [file] } });

		expect(onFilesChange).toHaveBeenCalledWith([], UPLOAD_ERROR.format("pdf"));
	});

	it("keeps the invalid-name error when the declared MIME is accepted", () => {
		const onFilesChange = vi.fn();
		render(
			<FileUpload
				{...baseProps}
				error={null}
				onErrorDismiss={vi.fn()}
				onFilesChange={onFilesChange}
				selectedFiles={[]}
			/>,
		);
		const file = new File(["pdf"], "avis-cse", { type: PDF_MIME });

		fireEvent.change(getInput(), { target: { files: [file] } });

		expect(onFilesChange).toHaveBeenCalledWith(
			[],
			UPLOAD_ERROR.invalidFileName(
				FILENAME_ERROR_MESSAGES.extension_mime_mismatch,
			),
		);
	});

	it("rejects a file larger than the maximum size", () => {
		const onFilesChange = vi.fn();
		render(
			<FileUpload
				{...baseProps}
				error={null}
				onErrorDismiss={vi.fn()}
				onFilesChange={onFilesChange}
				selectedFiles={[]}
			/>,
		);
		const file = makePdf("big.pdf", 11 * 1024 * 1024);

		fireEvent.change(getInput(), { target: { files: [file] } });

		expect(onFilesChange).toHaveBeenCalledWith(
			[],
			expect.objectContaining({
				title: "Fichier trop volumineux",
				message: FILE_TOO_LARGE_ERROR,
			}),
		);
	});

	it("keeps the valid files of a mixed selection and reports the rejected one", () => {
		const onFilesChange = vi.fn();
		render(
			<FileUpload
				{...baseProps}
				error={null}
				maxFileCount={3}
				onErrorDismiss={vi.fn()}
				onFilesChange={onFilesChange}
				selectedFiles={[]}
			/>,
		);
		const valid = makePdf("valide.pdf");
		const tooBig = makePdf("trop-gros.pdf", 11 * 1024 * 1024);

		fireEvent.change(getInput(), {
			target: { files: [valid, tooBig] },
		});

		expect(onFilesChange).toHaveBeenCalledWith(
			[valid],
			expect.objectContaining({ title: "Fichier trop volumineux" }),
		);
	});

	it("anchors the click handler of the close button on onErrorDismiss", async () => {
		const user = userEvent.setup();
		const onErrorDismiss = vi.fn();
		render(
			<FileUpload
				{...baseProps}
				error={UPLOAD_ERROR.network()}
				onErrorDismiss={onErrorDismiss}
				onFilesChange={vi.fn()}
				selectedFiles={[]}
			/>,
		);

		await user.click(
			screen.getByRole("button", { name: "Masquer le message" }),
		);

		expect(onErrorDismiss).toHaveBeenCalledTimes(1);
	});

	it("dismisses the alert and moves focus back to the selection button", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<ControlledFileUpload
				allowedMimeTypes={[PDF_MIME]}
				onChange={onChange}
			/>,
		);

		await userEvent.upload(
			getInput(),
			new File(["x"], "image.png", { type: "image/png" }),
		);
		expect(screen.getByRole("alert")).toBeInTheDocument();

		await user.click(
			screen.getByRole("button", { name: "Masquer le message" }),
		);

		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /Sélectionner un fichier/ }),
		).toHaveFocus();
		expect(onChange).toHaveBeenCalledTimes(1);
	});

	it("accepts a file dropped on the dropzone", () => {
		const onFilesChange = vi.fn();
		render(
			<FileUpload
				{...baseProps}
				error={null}
				onErrorDismiss={vi.fn()}
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
				onErrorDismiss={vi.fn()}
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
				onErrorDismiss={vi.fn()}
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
				onErrorDismiss={vi.fn()}
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
				onErrorDismiss={vi.fn()}
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
			UPLOAD_ERROR.invalidFileName(FILENAME_ERROR_MESSAGES.forbidden_char),
		);
		expect(
			screen.getByText(FILENAME_ERROR_MESSAGES.forbidden_char),
		).toBeInTheDocument();
		expect(screen.getByText("Nom de fichier invalide")).toBeInTheDocument();
		expect(screen.queryByText("avis<cse>.pdf")).not.toBeInTheDocument();
	});

	it("S3: rejects a name over 200 characters with a message mentioning 200", async () => {
		const onChange = vi.fn();
		render(<ControlledFileUpload onChange={onChange} />);
		const longName = `${"a".repeat(201)}.pdf`;
		const file = new File(["pdf-bytes"], longName, { type: PDF_MIME });

		await userEvent.upload(getInput(), file);

		expect(onChange).toHaveBeenCalledWith(
			[],
			UPLOAD_ERROR.invalidFileName(FILENAME_ERROR_MESSAGES.too_long),
		);
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
			UPLOAD_ERROR.invalidFileName(
				FILENAME_ERROR_MESSAGES.extension_mime_mismatch,
			),
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
			UPLOAD_ERROR.invalidFileName(FILENAME_ERROR_MESSAGES.invisible_char),
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
			UPLOAD_ERROR.invalidFileName(FILENAME_ERROR_MESSAGES.forbidden_char),
		);
	});
});
