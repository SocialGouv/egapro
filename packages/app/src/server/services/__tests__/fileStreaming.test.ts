import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	getFile: vi.fn(),
}));

vi.mock("~/server/services/s3", async (importOriginal) => {
	const actual = await importOriginal<typeof import("~/server/services/s3")>();
	return {
		...actual,
		getFile: mocks.getFile,
	};
});

import { streamStoredFile } from "../fileStreaming";

describe("streamStoredFile", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("streams a PDF inline with the expected headers", async () => {
		mocks.getFile.mockResolvedValue({
			body: new ReadableStream(),
			contentType: "application/pdf",
		});

		const response = await streamStoredFile({
			filePath: "123456789/2027/abc.pdf",
			fileName: "avis-cse.pdf",
			disposition: "inline",
			cacheControl: "private, no-store",
		});

		expect(mocks.getFile).toHaveBeenCalledWith("123456789/2027/abc.pdf");
		expect(response.headers.get("Content-Type")).toBe("application/pdf");
		expect(response.headers.get("Content-Disposition")).toBe(
			`inline; filename="avis-cse.pdf"; filename*=UTF-8''avis-cse.pdf`,
		);
		expect(response.headers.get("Cache-Control")).toBe("private, no-store");
	});

	it("streams a PNG as attachment with the expected headers", async () => {
		mocks.getFile.mockResolvedValue({
			body: new ReadableStream(),
			contentType: "image/png",
		});

		const response = await streamStoredFile({
			filePath: "123456789/2027/photo.png",
			fileName: "photo.png",
			disposition: "attachment",
			cacheControl: "private, max-age=3600",
		});

		expect(response.headers.get("Content-Type")).toBe("image/png");
		expect(response.headers.get("Content-Disposition")).toBe(
			`attachment; filename="photo.png"; filename*=UTF-8''photo.png`,
		);
		expect(response.headers.get("Cache-Control")).toBe("private, max-age=3600");
	});

	it("falls back to application/octet-stream for non-whitelisted content types", async () => {
		mocks.getFile.mockResolvedValue({
			body: new ReadableStream(),
			contentType: "text/html",
		});

		const response = await streamStoredFile({
			filePath: "123456789/2027/evil.html",
			fileName: "evil.html",
			disposition: "inline",
			cacheControl: "private, no-store",
		});

		expect(response.headers.get("Content-Type")).toBe(
			"application/octet-stream",
		);
	});

	it("propagates S3 errors so the caller can return 500", async () => {
		mocks.getFile.mockRejectedValue(new Error("S3 unreachable"));

		await expect(
			streamStoredFile({
				filePath: "123456789/2027/abc.pdf",
				fileName: "avis-cse.pdf",
				disposition: "inline",
				cacheControl: "private, no-store",
			}),
		).rejects.toThrow("S3 unreachable");
	});

	it("encodes non-ASCII filenames in Content-Disposition", async () => {
		mocks.getFile.mockResolvedValue({
			body: new ReadableStream(),
			contentType: "application/pdf",
		});

		const response = await streamStoredFile({
			filePath: "123456789/2027/abc.pdf",
			fileName: "avis-cse-évaluation.pdf",
			disposition: "attachment",
			cacheControl: "private, max-age=3600",
		});

		expect(response.headers.get("Content-Disposition")).toBe(
			`attachment; filename="avis-cse-_valuation.pdf"; filename*=UTF-8''avis-cse-%C3%A9valuation.pdf`,
		);
	});
});
