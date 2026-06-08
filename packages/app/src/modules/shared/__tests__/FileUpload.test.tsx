import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { FileUpload } from "../FileUpload";
import { FILENAME_ERROR_MESSAGES } from "../fileNameValidation";
import { FILE_TOO_LARGE_ERROR } from "../uploadConfig";

const PDF_MIME = "application/pdf";

function ControlledFileUpload({
	onChange,
	allowedMimeTypes = [PDF_MIME, "image/png"],
	maxFiles,
	disabled,
}: {
	onChange?: (files: File[], error: string | null) => void;
	allowedMimeTypes?: string[];
	maxFiles?: number;
	disabled?: boolean;
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
			inputId="test-upload"
			maxFiles={maxFiles}
			onFilesChange={(files, nextError) => {
				setSelectedFiles(files);
				setError(nextError);
				onChange?.(files, nextError);
			}}
			selectedFiles={selectedFiles}
		/>
	);
}

function getInput() {
	return document.getElementById("test-upload") as HTMLInputElement;
}

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

	it("still surfaces the MIME error for a valid name with a disallowed MIME type", async () => {
		const onChange = vi.fn();
		render(
			<ControlledFileUpload
				allowedMimeTypes={[PDF_MIME]}
				onChange={onChange}
			/>,
		);
		const file = new File(["x"], "image.png", { type: "image/png" });

		await userEvent.upload(getInput(), file);

		expect(onChange).toHaveBeenCalledWith(
			[],
			"Format de fichier non supporté. Formats acceptés : pdf, png.",
		);
	});

	it("surfaces the size error for a valid name and MIME but oversized file", async () => {
		const onChange = vi.fn();
		render(<ControlledFileUpload onChange={onChange} />);
		const file = new File(["x"], "rapport.pdf", { type: PDF_MIME });
		Object.defineProperty(file, "size", { value: 11 * 1024 * 1024 });

		await userEvent.upload(getInput(), file);

		expect(onChange).toHaveBeenCalledWith([], FILE_TOO_LARGE_ERROR);
		expect(screen.getByText(FILE_TOO_LARGE_ERROR)).toBeInTheDocument();
	});
});

describe("FileUpload interactions", () => {
	it("opens the file picker when the select button is clicked", async () => {
		render(<ControlledFileUpload />);
		const clickSpy = vi.spyOn(getInput(), "click");

		await userEvent.click(
			screen.getByRole("button", { name: /sélectionner des fichiers/i }),
		);

		expect(clickSpy).toHaveBeenCalled();
	});

	it("removes a selected file when its delete button is clicked", async () => {
		const onChange = vi.fn();
		render(<ControlledFileUpload onChange={onChange} />);
		const file = new File(["pdf-bytes"], "rapport.pdf", { type: PDF_MIME });

		await userEvent.upload(getInput(), file);
		expect(screen.getByText("rapport.pdf")).toBeInTheDocument();

		await userEvent.click(screen.getByRole("button", { name: "Supprimer" }));

		expect(onChange).toHaveBeenLastCalledWith([], null);
		expect(screen.queryByText("rapport.pdf")).not.toBeInTheDocument();
	});

	it("accepts a dropped file and lists it", async () => {
		const onChange = vi.fn();
		render(<ControlledFileUpload onChange={onChange} />);
		const file = new File(["pdf-bytes"], "rapport.pdf", { type: PDF_MIME });
		const dropzone = screen.getByLabelText("Zone de dépôt de fichier");

		fireEvent.dragEnter(dropzone);
		fireEvent.dragOver(dropzone);
		fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });

		expect(onChange).toHaveBeenCalledWith([file], null);
		expect(screen.getByText("rapport.pdf")).toBeInTheDocument();
	});

	it("rejects a dropped file with an invalid name", () => {
		const onChange = vi.fn();
		render(<ControlledFileUpload onChange={onChange} />);
		const file = new File(["pdf-bytes"], "avis<cse>.pdf", { type: PDF_MIME });
		const dropzone = screen.getByLabelText("Zone de dépôt de fichier");

		fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });

		expect(onChange).toHaveBeenCalledWith(
			[],
			FILENAME_ERROR_MESSAGES.forbidden_char,
		);
	});

	it("does not throw on drag enter, over and leave events", () => {
		render(<ControlledFileUpload />);
		const dropzone = screen.getByLabelText("Zone de dépôt de fichier");
		const child = dropzone.querySelector("button") as HTMLElement;

		expect(() => {
			fireEvent.dragEnter(dropzone);
			fireEvent.dragOver(dropzone);
			fireEvent.dragLeave(dropzone, { relatedTarget: child });
			fireEvent.dragLeave(dropzone, { relatedTarget: document.body });
		}).not.toThrow();
	});

	it("ignores a change event with no selected files", () => {
		const onChange = vi.fn();
		render(<ControlledFileUpload onChange={onChange} />);

		fireEvent.change(getInput(), { target: { files: [] } });

		expect(onChange).not.toHaveBeenCalled();
	});

	it("ignores a drop with no files", () => {
		const onChange = vi.fn();
		render(<ControlledFileUpload onChange={onChange} />);
		const dropzone = screen.getByLabelText("Zone de dépôt de fichier");

		fireEvent.drop(dropzone, { dataTransfer: { files: [] } });

		expect(onChange).not.toHaveBeenCalled();
	});

	it("caps the selection at maxFiles remaining slots", async () => {
		const onChange = vi.fn();
		render(<ControlledFileUpload maxFiles={2} onChange={onChange} />);
		const fileA = new File(["a"], "a.pdf", { type: PDF_MIME });
		const fileB = new File(["b"], "b.pdf", { type: PDF_MIME });
		const fileC = new File(["c"], "c.pdf", { type: PDF_MIME });

		await userEvent.upload(getInput(), [fileA, fileB, fileC]);

		expect(onChange).toHaveBeenCalledWith([fileA, fileB], null);
	});

	it("disables the select button and the input when disabled", () => {
		render(<ControlledFileUpload disabled />);

		expect(
			screen.getByRole("button", { name: /sélectionner des fichiers/i }),
		).toBeDisabled();
		expect(getInput()).toBeDisabled();
	});

	it.each([
		[2 * 1024, /Ko/],
		[2 * 1024 * 1024, /Mo/],
	])("renders the human-readable size label for a %i-byte file", async (size, unit) => {
		render(<ControlledFileUpload />);
		const file = new File(["pdf-bytes"], "rapport.pdf", { type: PDF_MIME });
		Object.defineProperty(file, "size", { value: size });

		await userEvent.upload(getInput(), file);

		expect(screen.getByText(unit)).toBeInTheDocument();
	});
});
