import { describe, expect, it, vi } from "vitest";

const sendMock = vi.fn().mockResolvedValue({
	Body: {
		transformToWebStream: () => new ReadableStream(),
	},
	ContentType: "application/pdf",
});

vi.mock("@aws-sdk/client-s3", () => {
	return {
		S3Client: class {
			send = sendMock;
		},
		PutObjectCommand: vi.fn(),
		GetObjectCommand: vi.fn(),
		DeleteObjectCommand: vi.fn(),
	};
});

describe("s3 service", () => {
	describe("buildObjectKey", () => {
		it("builds the correct S3 object key", async () => {
			const { buildObjectKey } = await import("../s3");
			const key = buildObjectKey("123456789", 2027, "abc-def-123");
			expect(key).toBe("123456789/2027/abc-def-123.pdf");
		});
	});

	describe("uploadFile", () => {
		it("sends a PutObjectCommand", async () => {
			const { PutObjectCommand } = await import("@aws-sdk/client-s3");
			const { uploadFile } = await import("../s3");

			await uploadFile("key.pdf", Buffer.from("test"), "application/pdf");

			expect(PutObjectCommand).toHaveBeenCalledWith(
				expect.objectContaining({
					Key: "key.pdf",
					ContentType: "application/pdf",
				}),
			);
		});
	});

	describe("getFile", () => {
		it("returns body and content type", async () => {
			const { getFile } = await import("../s3");
			const result = await getFile("key.pdf");
			expect(result.contentType).toBe("application/pdf");
			expect(result.body).toBeInstanceOf(ReadableStream);
		});
	});

	describe("deleteFile", () => {
		it("sends a DeleteObjectCommand", async () => {
			const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
			const { deleteFile } = await import("../s3");

			await deleteFile("key.pdf");

			expect(DeleteObjectCommand).toHaveBeenCalledWith(
				expect.objectContaining({ Key: "key.pdf" }),
			);
		});
	});
});
