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

// Valid PDF header bytes
const PDF_HEADER = new Uint8Array([
	0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x20, 0x63, 0x6f, 0x6e, 0x74,
	0x65, 0x6e, 0x74,
]);

// Valid PNG header bytes
const PNG_HEADER = new Uint8Array([
	0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
]);

// Invalid content (HTML)
const INVALID_CONTENT = new TextEncoder().encode("<html>not valid</html>");

function setEnv() {
	return import("~/env").then(({ env }) => {
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
	});
}

const baseOptions = {
	siren: "123456789",
	year: 2027,
	fileName: "rapport.pdf",
	contentType: "application/pdf",
	allowedMimeTypes: ["application/pdf", "image/png", "image/jpeg"] as const,
};

describe("fileUpload service", () => {
	it("uploads a clean PDF file successfully", async () => {
		await setEnv();

		const { handleStreamingUpload } = await import("../fileUpload");
		const stream = createReadableStream(PDF_HEADER);

		const result = await handleStreamingUpload(stream, baseOptions);

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.key).toMatch(/^123456789\/2027\/.+\.pdf$/);
		}
		expect(mockS3Upload.init).toHaveBeenCalled();
		expect(mockS3Upload.complete).toHaveBeenCalled();
		expect(mockClamd.sendChunk).toHaveBeenCalled();
		expect(mockClamd.finish).toHaveBeenCalled();
	});

	it("uploads a clean PNG file successfully", async () => {
		await setEnv();

		const { handleStreamingUpload } = await import("../fileUpload");
		const stream = createReadableStream(PNG_HEADER);

		const result = await handleStreamingUpload(stream, {
			...baseOptions,
			fileName: "capture.png",
			contentType: "image/png",
		});

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.key).toMatch(/\.png$/);
		}
	});

	it("preserves the original file extension in the S3 key", async () => {
		await setEnv();

		const { handleStreamingUpload } = await import("../fileUpload");
		const jpegHeader = new Uint8Array([
			0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46,
		]);
		const stream = createReadableStream(jpegHeader);

		const result = await handleStreamingUpload(stream, {
			...baseOptions,
			fileName: "photo.jpg",
			contentType: "image/jpeg",
		});

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.key).toMatch(/\.jpg$/);
		}
	});

	it("rejects a file with invalid magic bytes", async () => {
		await setEnv();

		const { handleStreamingUpload } = await import("../fileUpload");
		const stream = createReadableStream(INVALID_CONTENT);

		const result = await handleStreamingUpload(stream, baseOptions);

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error).toContain("Format de fichier non supporté");
		}
		expect(mockS3Upload.abort).toHaveBeenCalled();
	});

	it("rejects an infected file", async () => {
		await setEnv();

		mockClamd.finish.mockResolvedValueOnce({
			clean: false,
			virus: "Eicar-Signature",
		});

		const { handleStreamingUpload } = await import("../fileUpload");
		const stream = createReadableStream(PDF_HEADER);

		const result = await handleStreamingUpload(stream, baseOptions);

		expect(result).toEqual({
			ok: false,
			error: "Fichier rejeté : virus détecté",
			virus: "Eicar-Signature",
		});
		expect(mockS3Upload.abort).toHaveBeenCalled();
	});

	it("rejects an empty file", async () => {
		await setEnv();

		const { handleStreamingUpload } = await import("../fileUpload");
		const stream = new ReadableStream({
			start(controller) {
				controller.close();
			},
		});

		const result = await handleStreamingUpload(stream, baseOptions);

		expect(result).toEqual({
			ok: false,
			error: "Le fichier est vide.",
		});
	});
});
