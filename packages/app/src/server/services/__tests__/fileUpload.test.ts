import { describe, expect, it, vi } from "vitest";

const mockClamd = {
	sendChunk: vi.fn(),
	finish: vi.fn().mockResolvedValue({ clean: true }),
	destroy: vi.fn(),
};

const mockS3Upload = {
	init: vi.fn().mockResolvedValue(undefined),
	sendChunk: vi.fn().mockResolvedValue(undefined),
	flushPart: vi.fn().mockResolvedValue(undefined),
	complete: vi.fn().mockResolvedValue(undefined),
	abort: vi.fn().mockResolvedValue(undefined),
};

vi.mock("../clamav", () => ({
	createClamdStream: vi.fn().mockReturnValue(mockClamd),
}));

vi.mock("../s3", () => ({
	createMultipartUpload: vi.fn().mockReturnValue(mockS3Upload),
}));

function createReadableStream(data: Uint8Array): ReadableStream<Uint8Array> {
	return new ReadableStream({
		start(controller) {
			controller.enqueue(data);
			controller.close();
		},
	});
}

// %PDF- header for valid PDFs
const PDF_HEADER = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);

describe("fileUpload service", () => {
	it("uploads a clean file successfully", async () => {
		const { env } = await import("~/env");
		Object.defineProperty(env, "CLAMAV_HOST", {
			value: "localhost",
			writable: true,
			configurable: true,
		});
		Object.defineProperty(env, "CLAMAV_PORT", {
			value: 3310,
			writable: true,
			configurable: true,
		});

		const { handleStreamingUpload } = await import("../fileUpload");
		const stream = createReadableStream(PDF_HEADER);

		const result = await handleStreamingUpload(stream, {
			siren: "123456789",
			year: 2027,
			fileName: "test.pdf",
		});

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.key).toMatch(/^123456789\/2027\/.+\.pdf$/);
		}
		expect(mockS3Upload.init).toHaveBeenCalled();
		expect(mockS3Upload.complete).toHaveBeenCalled();
		expect(mockClamd.sendChunk).toHaveBeenCalled();
		expect(mockClamd.finish).toHaveBeenCalled();
	});

	it("rejects an infected file", async () => {
		const { env } = await import("~/env");
		Object.defineProperty(env, "CLAMAV_HOST", {
			value: "localhost",
			writable: true,
			configurable: true,
		});
		Object.defineProperty(env, "CLAMAV_PORT", {
			value: 3310,
			writable: true,
			configurable: true,
		});

		mockClamd.finish.mockResolvedValueOnce({
			clean: false,
			virus: "Eicar-Signature",
		});

		const { handleStreamingUpload } = await import("../fileUpload");
		const stream = createReadableStream(PDF_HEADER);

		const result = await handleStreamingUpload(stream, {
			siren: "123456789",
			year: 2027,
			fileName: "virus.pdf",
		});

		expect(result).toEqual({
			ok: false,
			error: "Fichier rejeté : virus détecté",
			virus: "Eicar-Signature",
		});
		expect(mockS3Upload.abort).toHaveBeenCalled();
	});

	it("rejects a non-PDF file", async () => {
		const { env } = await import("~/env");
		Object.defineProperty(env, "CLAMAV_HOST", {
			value: "localhost",
			writable: true,
			configurable: true,
		});
		Object.defineProperty(env, "CLAMAV_PORT", {
			value: 3310,
			writable: true,
			configurable: true,
		});

		const { handleStreamingUpload } = await import("../fileUpload");
		const stream = createReadableStream(new Uint8Array([0x00, 0x01, 0x02]));

		const result = await handleStreamingUpload(stream, {
			siren: "123456789",
			year: 2027,
			fileName: "fake.pdf",
		});

		expect(result).toEqual({
			ok: false,
			error: "Le fichier n'est pas un PDF valide.",
		});
		expect(mockS3Upload.abort).toHaveBeenCalled();
	});

	it("rejects an empty file", async () => {
		const { env } = await import("~/env");
		Object.defineProperty(env, "CLAMAV_HOST", {
			value: "localhost",
			writable: true,
			configurable: true,
		});
		Object.defineProperty(env, "CLAMAV_PORT", {
			value: 3310,
			writable: true,
			configurable: true,
		});

		const { handleStreamingUpload } = await import("../fileUpload");
		const stream = new ReadableStream({
			start(controller) {
				controller.close();
			},
		});

		const result = await handleStreamingUpload(stream, {
			siren: "123456789",
			year: 2027,
			fileName: "empty.pdf",
		});

		expect(result).toEqual({
			ok: false,
			error: "Le fichier est vide.",
		});
	});
});
