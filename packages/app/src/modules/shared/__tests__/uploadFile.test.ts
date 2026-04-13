import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { uploadFile } from "../uploadFile";

function makeFile(name = "rapport.pdf", type = "application/pdf") {
	return new File(["pdf-content"], name, { type });
}

function mockFetch(response: {
	ok: boolean;
	status?: number;
	body: Record<string, unknown>;
}) {
	const fetchMock = vi.fn().mockResolvedValue({
		ok: response.ok,
		status: response.status ?? (response.ok ? 200 : 500),
		json: vi.fn().mockResolvedValue(response.body),
	});
	vi.stubGlobal("fetch", fetchMock);
	return fetchMock;
}

describe("uploadFile", () => {
	beforeEach(() => {
		vi.unstubAllGlobals();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("sends the file to /api/upload with the expected headers", async () => {
		const fetchMock = mockFetch({
			ok: true,
			body: { fileId: "f-1", fileName: "rapport.pdf" },
		});
		const file = makeFile();

		await uploadFile(file, { flowType: "joint_evaluation" });

		expect(fetchMock).toHaveBeenCalledWith("/api/upload", {
			method: "POST",
			headers: {
				"Content-Type": "application/pdf",
				"X-Filename": "rapport.pdf",
				"X-Flow-Type": "joint_evaluation",
			},
			body: file,
		});
	});

	it("falls back to application/octet-stream when file.type is empty", async () => {
		const fetchMock = mockFetch({
			ok: true,
			body: { fileId: "f-1", fileName: "blob.bin" },
		});
		const file = new File(["data"], "blob.bin", { type: "" });

		await uploadFile(file, { flowType: "cse_opinion" });

		expect(fetchMock).toHaveBeenCalledWith(
			"/api/upload",
			expect.objectContaining({
				headers: expect.objectContaining({
					"Content-Type": "application/octet-stream",
				}),
			}),
		);
	});

	it("returns a success result when the server responds with ok", async () => {
		mockFetch({
			ok: true,
			body: { fileId: "file-123", fileName: "rapport.pdf" },
		});

		const result = await uploadFile(makeFile(), {
			flowType: "joint_evaluation",
		});

		expect(result).toEqual({
			ok: true,
			fileId: "file-123",
			fileName: "rapport.pdf",
		});
	});

	it("returns the structured failure when the server provides a known reason", async () => {
		mockFetch({
			ok: false,
			status: 422,
			body: {
				reason: "virus",
				error: "Fichier rejeté",
				virus: "Eicar-Test-Signature",
			},
		});

		const result = await uploadFile(makeFile(), {
			flowType: "cse_opinion",
		});

		expect(result).toEqual({
			ok: false,
			reason: "virus",
			error: "Fichier rejeté",
			virusName: "Eicar-Test-Signature",
		});
	});

	it("returns max_files reason when server reports the limit", async () => {
		mockFetch({
			ok: false,
			status: 409,
			body: {
				reason: "max_files",
				error: "Limite atteinte",
			},
		});

		const result = await uploadFile(makeFile(), {
			flowType: "cse_opinion",
		});

		expect(result).toEqual({
			ok: false,
			reason: "max_files",
			error: "Limite atteinte",
			virusName: undefined,
		});
	});

	it("falls back to wrong_type when status is 400 and no structured reason", async () => {
		mockFetch({
			ok: false,
			status: 400,
			body: { error: "Bad request" },
		});

		const result = await uploadFile(makeFile(), {
			flowType: "joint_evaluation",
		});

		expect(result).toEqual({
			ok: false,
			reason: "wrong_type",
			error: "Bad request",
			virusName: undefined,
		});
	});

	it("falls back to unauthorized when status is 401 and no structured reason", async () => {
		mockFetch({
			ok: false,
			status: 401,
			body: {},
		});

		const result = await uploadFile(makeFile(), {
			flowType: "joint_evaluation",
		});

		expect(result).toEqual({
			ok: false,
			reason: "unauthorized",
			error: "Erreur lors de l'upload du fichier",
			virusName: undefined,
		});
	});

	it("falls back to server_error for other failure statuses", async () => {
		mockFetch({
			ok: false,
			status: 503,
			body: { error: "Service indisponible" },
		});

		const result = await uploadFile(makeFile(), {
			flowType: "joint_evaluation",
		});

		expect(result).toEqual({
			ok: false,
			reason: "server_error",
			error: "Service indisponible",
			virusName: undefined,
		});
	});

	it("ignores an unknown reason string and falls back on the status", async () => {
		mockFetch({
			ok: false,
			status: 401,
			body: { reason: "totally_unknown" },
		});

		const result = await uploadFile(makeFile(), {
			flowType: "joint_evaluation",
		});

		expect(result).toMatchObject({
			ok: false,
			reason: "unauthorized",
		});
	});
});
