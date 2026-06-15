import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FileUpload } from "../FileUpload";

const baseProps = {
	inputId: "test-upload",
	accept: ".pdf",
	acceptLabel: "pdf",
	allowedMimeTypes: ["application/pdf"],
};

function makePdf(name = "rapport.pdf", size = 2048) {
	const file = new File(["pdf"], name, { type: "application/pdf" });
	Object.defineProperty(file, "size", { value: size });
	return file;
}

function getInput() {
	return document.getElementById("test-upload") as HTMLInputElement;
}

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
		expect(link).not.toHaveTextContent("PDF – 2.00 Ko");
		expect(screen.getByText("PDF – 2.00 Ko")).toBeInTheDocument();
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
		[512, "512 o"],
		[2048, "2.00 Ko"],
		[5 * 1024 * 1024, "5.00 Mo"],
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
		expect(screen.getByText("NOEXTENSION – 1.00 Ko")).toBeInTheDocument();
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

	it("rejects a file with an unsupported MIME type", () => {
		const onFilesChange = vi.fn();
		render(
			<FileUpload
				{...baseProps}
				error={null}
				onFilesChange={onFilesChange}
				selectedFiles={[]}
			/>,
		);
		const file = new File(["x"], "note.txt", { type: "text/plain" });

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
