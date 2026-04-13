import { act, renderHook } from "@testing-library/react";
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type Mock,
	vi,
} from "vitest";

import type { UploadFileResult } from "../uploadFile";
import { useFileUploadForm } from "../useFileUploadForm";

vi.mock("../uploadFile", () => ({
	uploadFile: vi.fn(),
}));

vi.mock("../getDsfrModal", () => ({
	getDsfrModal: vi.fn(),
}));

const { uploadFile } = await import("../uploadFile");
const { getDsfrModal } = await import("../getDsfrModal");

const uploadFileMock = uploadFile as unknown as Mock;
const getDsfrModalMock = getDsfrModal as unknown as Mock;

function attachDialog<
	T extends { modalRef: React.RefObject<HTMLDialogElement | null> },
>(hookResult: { current: T }) {
	const dialog = document.createElement("dialog");
	dialog.showModal = vi.fn();
	dialog.close = vi.fn();
	(
		hookResult.current.modalRef as { current: HTMLDialogElement | null }
	).current = dialog;
	return dialog;
}

function preventSubmit(): React.FormEvent {
	return {
		preventDefault: vi.fn(),
	} as unknown as React.FormEvent;
}

function makeFile(name = "rapport.pdf") {
	return new File(["pdf"], name, { type: "application/pdf" });
}

describe("useFileUploadForm", () => {
	beforeEach(() => {
		uploadFileMock.mockReset();
		getDsfrModalMock.mockReset();
		getDsfrModalMock.mockReturnValue(null);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("starts with empty state", () => {
		const { result } = renderHook(() =>
			useFileUploadForm({ flowType: "joint_evaluation" }),
		);

		expect(result.current.selectedFiles).toEqual([]);
		expect(result.current.uploadError).toBeNull();
		expect(result.current.isPending).toBe(false);
	});

	it("updates selected files and error when handleFilesChange is called", () => {
		const { result } = renderHook(() =>
			useFileUploadForm({ flowType: "cse_opinion" }),
		);
		const file = makeFile();

		act(() => {
			result.current.handleFilesChange([file], null);
		});

		expect(result.current.selectedFiles).toEqual([file]);
		expect(result.current.uploadError).toBeNull();
	});

	it("propagates an error string from handleFilesChange", () => {
		const { result } = renderHook(() =>
			useFileUploadForm({ flowType: "cse_opinion" }),
		);

		act(() => {
			result.current.handleFilesChange([], "Boom");
		});

		expect(result.current.uploadError).toBe("Boom");
	});

	it("handleSubmit prevents default and shows an error when no file is selected", () => {
		const { result } = renderHook(() =>
			useFileUploadForm({ flowType: "joint_evaluation" }),
		);
		const event = preventSubmit();

		act(() => {
			result.current.handleSubmit(event);
		});

		expect(event.preventDefault).toHaveBeenCalled();
		expect(result.current.uploadError).toBe(
			"Veuillez sélectionner au moins un fichier avant de soumettre.",
		);
	});

	it("handleSubmit opens the native dialog when DSFR API is unavailable", () => {
		const { result } = renderHook(() =>
			useFileUploadForm({ flowType: "joint_evaluation" }),
		);
		const dialog = attachDialog(result);

		act(() => {
			result.current.handleFilesChange([makeFile()], null);
		});
		act(() => {
			result.current.handleSubmit(preventSubmit());
		});

		expect(dialog.showModal).toHaveBeenCalled();
		expect(result.current.uploadError).toBeNull();
	});

	it("handleSubmit calls modal.disclose() when DSFR API is available", () => {
		const { result } = renderHook(() =>
			useFileUploadForm({ flowType: "joint_evaluation" }),
		);
		const disclose = vi.fn();
		const conceal = vi.fn();
		getDsfrModalMock.mockReturnValue({ disclose, conceal });
		attachDialog(result);

		act(() => {
			result.current.handleFilesChange([makeFile()], null);
		});
		act(() => {
			result.current.handleSubmit(preventSubmit());
		});

		expect(disclose).toHaveBeenCalled();
	});

	it("handleSubmit is a no-op when modalRef is empty", () => {
		const { result } = renderHook(() =>
			useFileUploadForm({ flowType: "joint_evaluation" }),
		);

		act(() => {
			result.current.handleFilesChange([makeFile()], null);
		});
		expect(() => {
			act(() => {
				result.current.handleSubmit(preventSubmit());
			});
		}).not.toThrow();
	});

	it("closeModal closes the native dialog when DSFR API is unavailable", () => {
		const { result } = renderHook(() =>
			useFileUploadForm({ flowType: "joint_evaluation" }),
		);
		const dialog = attachDialog(result);

		act(() => {
			result.current.closeModal();
		});

		expect(dialog.close).toHaveBeenCalled();
	});

	it("closeModal calls modal.conceal() when DSFR API is available", () => {
		const { result } = renderHook(() =>
			useFileUploadForm({ flowType: "joint_evaluation" }),
		);
		const conceal = vi.fn();
		getDsfrModalMock.mockReturnValue({ disclose: vi.fn(), conceal });
		attachDialog(result);

		act(() => {
			result.current.closeModal();
		});

		expect(conceal).toHaveBeenCalled();
	});

	it("closeModal is a no-op when modalRef is empty", () => {
		const { result } = renderHook(() =>
			useFileUploadForm({ flowType: "joint_evaluation" }),
		);

		expect(() => {
			act(() => {
				result.current.closeModal();
			});
		}).not.toThrow();
	});

	it("handleConfirm uploads each file then calls onUploaded and onAllUploaded", async () => {
		const onUploaded = vi.fn();
		const onAllUploaded = vi.fn();
		const { result } = renderHook(() =>
			useFileUploadForm({
				flowType: "cse_opinion",
				onUploaded,
				onAllUploaded,
			}),
		);
		attachDialog(result);

		uploadFileMock
			.mockResolvedValueOnce({
				ok: true,
				fileId: "id-1",
				fileName: "a.pdf",
			} satisfies UploadFileResult)
			.mockResolvedValueOnce({
				ok: true,
				fileId: "id-2",
				fileName: "b.pdf",
			} satisfies UploadFileResult);

		act(() => {
			result.current.handleFilesChange(
				[makeFile("a.pdf"), makeFile("b.pdf")],
				null,
			);
		});

		await act(async () => {
			await result.current.handleConfirm();
		});

		expect(uploadFileMock).toHaveBeenCalledTimes(2);
		expect(onUploaded).toHaveBeenNthCalledWith(1, {
			fileId: "id-1",
			fileName: "a.pdf",
		});
		expect(onUploaded).toHaveBeenNthCalledWith(2, {
			fileId: "id-2",
			fileName: "b.pdf",
		});
		expect(onAllUploaded).toHaveBeenCalledTimes(1);
		expect(result.current.selectedFiles).toEqual([]);
		expect(result.current.isPending).toBe(false);
		expect(result.current.uploadError).toBeNull();
	});

	it("handleConfirm is a no-op when no files are selected", async () => {
		const onAllUploaded = vi.fn();
		const { result } = renderHook(() =>
			useFileUploadForm({ flowType: "cse_opinion", onAllUploaded }),
		);
		attachDialog(result);

		await act(async () => {
			await result.current.handleConfirm();
		});

		expect(uploadFileMock).not.toHaveBeenCalled();
		expect(onAllUploaded).not.toHaveBeenCalled();
		expect(result.current.isPending).toBe(false);
	});

	it("formats virus error with the signature when present", async () => {
		const { result } = renderHook(() =>
			useFileUploadForm({ flowType: "cse_opinion" }),
		);
		attachDialog(result);
		uploadFileMock.mockResolvedValue({
			ok: false,
			reason: "virus",
			error: "ignored",
			virusName: "Eicar",
		});

		act(() => {
			result.current.handleFilesChange([makeFile()], null);
		});
		await act(async () => {
			await result.current.handleConfirm();
		});

		expect(result.current.uploadError).toBe(
			"Fichier rejeté par l'antivirus (signature : Eicar).",
		);
		expect(result.current.isPending).toBe(false);
	});

	it("formats virus error without a signature", async () => {
		const { result } = renderHook(() =>
			useFileUploadForm({ flowType: "cse_opinion" }),
		);
		attachDialog(result);
		uploadFileMock.mockResolvedValue({
			ok: false,
			reason: "virus",
			error: "ignored",
		});

		act(() => {
			result.current.handleFilesChange([makeFile()], null);
		});
		await act(async () => {
			await result.current.handleConfirm();
		});

		expect(result.current.uploadError).toBe("Fichier rejeté par l'antivirus.");
	});

	const reasonCases: Array<{
		reason:
			| "scan_unavailable"
			| "max_files"
			| "unauthorized"
			| "not_found"
			| "too_large"
			| "wrong_type"
			| "empty"
			| "missing_flow"
			| "missing_filename"
			| "server_error";
		serverError: string;
		expected: string;
	}> = [
		{
			reason: "scan_unavailable",
			serverError: "ignored",
			expected:
				"Le service de scan antivirus est temporairement indisponible. Merci de réessayer dans quelques minutes.",
		},
		{
			reason: "max_files",
			serverError: "Limite atteinte",
			expected: "Limite atteinte",
		},
		{
			reason: "unauthorized",
			serverError: "ignored",
			expected: "Non authentifié. Merci de vous reconnecter.",
		},
		{
			reason: "not_found",
			serverError: "ignored",
			expected: "Déclaration introuvable pour l'année en cours.",
		},
		{
			reason: "too_large",
			serverError: "Trop gros",
			expected: "Trop gros",
		},
		{
			reason: "wrong_type",
			serverError: "Mauvais type",
			expected: "Mauvais type",
		},
		{
			reason: "empty",
			serverError: "Vide",
			expected: "Vide",
		},
		{
			reason: "missing_flow",
			serverError: "Flow manquant",
			expected: "Flow manquant",
		},
		{
			reason: "missing_filename",
			serverError: "Nom manquant",
			expected: "Nom manquant",
		},
		{
			reason: "server_error",
			serverError: "ignored",
			expected: "Erreur lors de l'upload du fichier. Merci de réessayer.",
		},
	];

	for (const { reason, serverError, expected } of reasonCases) {
		it(`maps the "${reason}" reason to the expected user message`, async () => {
			const { result } = renderHook(() =>
				useFileUploadForm({ flowType: "cse_opinion" }),
			);
			attachDialog(result);
			uploadFileMock.mockResolvedValue({
				ok: false,
				reason,
				error: serverError,
			});

			act(() => {
				result.current.handleFilesChange([makeFile()], null);
			});
			await act(async () => {
				await result.current.handleConfirm();
			});

			expect(result.current.uploadError).toBe(expected);
			expect(result.current.isPending).toBe(false);
		});
	}

	it("stops uploading after the first failure and skips the remaining files", async () => {
		const onUploaded = vi.fn();
		const onAllUploaded = vi.fn();
		const { result } = renderHook(() =>
			useFileUploadForm({
				flowType: "cse_opinion",
				onUploaded,
				onAllUploaded,
			}),
		);
		attachDialog(result);

		uploadFileMock
			.mockResolvedValueOnce({
				ok: true,
				fileId: "id-1",
				fileName: "a.pdf",
			})
			.mockResolvedValueOnce({
				ok: false,
				reason: "server_error",
				error: "boom",
			});

		act(() => {
			result.current.handleFilesChange(
				[makeFile("a.pdf"), makeFile("b.pdf")],
				null,
			);
		});
		await act(async () => {
			await result.current.handleConfirm();
		});

		expect(uploadFileMock).toHaveBeenCalledTimes(2);
		expect(onUploaded).toHaveBeenCalledTimes(1);
		expect(onAllUploaded).not.toHaveBeenCalled();
		expect(result.current.uploadError).toBe(
			"Erreur lors de l'upload du fichier. Merci de réessayer.",
		);
	});

	it("falls back to a generic error when uploadFile throws", async () => {
		const onAllUploaded = vi.fn();
		const { result } = renderHook(() =>
			useFileUploadForm({ flowType: "cse_opinion", onAllUploaded }),
		);
		attachDialog(result);
		uploadFileMock.mockRejectedValue(new Error("network down"));

		act(() => {
			result.current.handleFilesChange([makeFile()], null);
		});
		await act(async () => {
			await result.current.handleConfirm();
		});

		expect(result.current.uploadError).toBe(
			"Erreur lors de l'upload du fichier",
		);
		expect(result.current.isPending).toBe(false);
		expect(onAllUploaded).not.toHaveBeenCalled();
	});
});
