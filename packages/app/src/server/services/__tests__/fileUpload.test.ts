import { beforeEach, describe, expect, it, vi } from "vitest";

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
	beforeEach(() => {
		mockClamd.sendChunk.mockClear();
		mockClamd.finish.mockClear().mockResolvedValue({ clean: true });
		mockClamd.destroy.mockClear();
		mockS3Upload.init.mockClear().mockResolvedValue(undefined);
		mockS3Upload.sendChunk.mockClear().mockResolvedValue(undefined);
		mockS3Upload.flushPart.mockClear().mockResolvedValue(undefined);
		mockS3Upload.complete.mockClear().mockResolvedValue(undefined);
		mockS3Upload.abort.mockClear().mockResolvedValue(undefined);
	});

	it("uploads a clean PDF file successfully", async () => {
		await setEnv();

		const { handleStreamingUpload } = await import("../fileUpload");
		const stream = createReadableStream(PDF_HEADER);

		const result = await handleStreamingUpload(stream, baseOptions);

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.key).toMatch(/^123456789\/2027\/.+\.pdf$/);
			expect(result.fileId).toMatch(/^[a-f0-9-]{36}$/);
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
			expect(result.reason).toBe("wrong_type");
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
			reason: "virus",
			error: "Fichier rejeté : virus détecté",
			virusName: "Eicar-Signature",
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
			reason: "empty",
			error: "Le fichier est vide.",
		});
	});

	it("returns scan_unavailable when clamd.finish() rejects", async () => {
		await setEnv();

		mockClamd.finish.mockRejectedValueOnce(new Error("clamd scan timeout"));
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const { handleStreamingUpload } = await import("../fileUpload");
		const stream = createReadableStream(PDF_HEADER);

		const result = await handleStreamingUpload(stream, baseOptions);

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.reason).toBe("scan_unavailable");
			// User-facing copy must not leak the internal clamd error message.
			expect(result.error).toBe(
				"Le service de scan antivirus est temporairement indisponible. Merci de réessayer dans quelques minutes.",
			);
			expect(result.error).not.toContain("clamd");
		}
		expect(mockS3Upload.abort).toHaveBeenCalled();
		expect(mockS3Upload.complete).not.toHaveBeenCalled();

		consoleSpy.mockRestore();
	});

	it("returns scan_unavailable when clamd.sendChunk rejects mid-stream", async () => {
		await setEnv();

		mockClamd.sendChunk.mockRejectedValueOnce(
			Object.assign(new Error("connect ECONNREFUSED 127.0.0.1:3310"), {
				code: "ECONNREFUSED",
			}),
		);
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const { handleStreamingUpload } = await import("../fileUpload");
		const stream = createReadableStream(PDF_HEADER);

		const result = await handleStreamingUpload(stream, baseOptions);

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.reason).toBe("scan_unavailable");
			// The user-facing copy must not leak the internal ECONNREFUSED detail.
			expect(result.error).toBe(
				"Le service de scan antivirus est temporairement indisponible. Merci de réessayer dans quelques minutes.",
			);
			expect(result.error).not.toContain("ECONNREFUSED");
		}
		expect(mockS3Upload.abort).toHaveBeenCalled();
		expect(mockS3Upload.complete).not.toHaveBeenCalled();
		expect(mockClamd.destroy).toHaveBeenCalled();

		consoleSpy.mockRestore();
	});

	it("aborts S3 and rethrows when sendChunk fails mid-stream", async () => {
		await setEnv();

		mockS3Upload.sendChunk.mockRejectedValueOnce(new Error("S3 UploadPart"));

		const { handleStreamingUpload } = await import("../fileUpload");
		const stream = createReadableStream(PDF_HEADER);

		await expect(handleStreamingUpload(stream, baseOptions)).rejects.toThrow(
			"S3 UploadPart",
		);
		expect(mockS3Upload.abort).toHaveBeenCalled();
		expect(mockS3Upload.complete).not.toHaveBeenCalled();
	});

	it("rejects a file larger than maxSize", async () => {
		await setEnv();

		// Stream two chunks whose combined size exceeds maxSize.
		// First chunk is a valid PDF header so we do not trip signature
		// validation before the size check on the second chunk.
		const firstChunk = PDF_HEADER;
		const secondChunk = new Uint8Array(128);
		const stream = new ReadableStream<Uint8Array>({
			start(controller) {
				controller.enqueue(firstChunk);
				controller.enqueue(secondChunk);
				controller.close();
			},
		});

		const { handleStreamingUpload } = await import("../fileUpload");
		const result = await handleStreamingUpload(stream, {
			...baseOptions,
			maxSize: 100,
		});

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.reason).toBe("too_large");
		}
		expect(mockS3Upload.abort).toHaveBeenCalled();
		expect(mockS3Upload.complete).not.toHaveBeenCalled();
		expect(mockClamd.destroy).toHaveBeenCalled();
	});

	it("rejects a sub-signature-size file with invalid magic bytes", async () => {
		await setEnv();

		// 4 bytes of arbitrary content — smaller than MIN_SIGNATURE_BYTES (8),
		// so the in-loop signature validation is skipped and the late
		// validation branch (after the empty-file check) runs instead.
		const tinyChunk = new Uint8Array([0x3c, 0x68, 0x74, 0x6d]); // "<htm"
		const stream = createReadableStream(tinyChunk);

		const { handleStreamingUpload } = await import("../fileUpload");
		const result = await handleStreamingUpload(stream, baseOptions);

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.reason).toBe("wrong_type");
			expect(result.error).toContain("Format de fichier non supporté");
		}
		expect(mockS3Upload.abort).toHaveBeenCalled();
		expect(mockS3Upload.complete).not.toHaveBeenCalled();
		expect(mockClamd.destroy).toHaveBeenCalled();
	});
});
