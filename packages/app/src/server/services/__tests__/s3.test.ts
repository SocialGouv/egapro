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
		AbortMultipartUploadCommand: vi.fn(),
		CompleteMultipartUploadCommand: vi.fn(),
		CreateBucketCommand: vi.fn(),
		CreateMultipartUploadCommand: vi.fn(),
		DeleteObjectCommand: vi.fn(),
		GetObjectCommand: vi.fn(),
		HeadBucketCommand: vi.fn(),
		PutObjectCommand: vi.fn(),
		UploadPartCommand: vi.fn(),
	};
});

describe("s3 service", () => {
	describe("ensureBucket", () => {
		it("does nothing when bucket already exists", async () => {
			sendMock.mockResolvedValueOnce({});
			const { ensureBucket } = await import("../s3");
			await ensureBucket();
			const { HeadBucketCommand } = await import("@aws-sdk/client-s3");
			expect(HeadBucketCommand).toHaveBeenCalled();
		});

		it("creates bucket when it does not exist", async () => {
			const notFoundError = new Error("NotFound");
			Object.assign(notFoundError, {
				$metadata: { httpStatusCode: 404 },
			});
			sendMock.mockRejectedValueOnce(notFoundError);
			sendMock.mockResolvedValueOnce({});

			const { ensureBucket } = await import("../s3");
			await ensureBucket();

			const { CreateBucketCommand } = await import("@aws-sdk/client-s3");
			expect(CreateBucketCommand).toHaveBeenCalled();
		});
	});

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

	describe("createMultipartUpload", () => {
		it("initializes, sends chunks, and completes", async () => {
			sendMock
				.mockResolvedValueOnce({ UploadId: "test-upload-id" })
				.mockResolvedValueOnce({ ETag: '"etag-1"' })
				.mockResolvedValueOnce({});

			const { createMultipartUpload } = await import("../s3");
			const upload = createMultipartUpload("key.pdf", "application/pdf");

			await upload.init();
			await upload.sendChunk(Buffer.from("test-data"));
			await upload.complete();

			const { CreateMultipartUploadCommand, UploadPartCommand } = await import(
				"@aws-sdk/client-s3"
			);
			expect(CreateMultipartUploadCommand).toHaveBeenCalledWith(
				expect.objectContaining({ Key: "key.pdf" }),
			);
			expect(UploadPartCommand).toHaveBeenCalledWith(
				expect.objectContaining({
					UploadId: "test-upload-id",
					PartNumber: 1,
				}),
			);
		});

		it("aborts the upload on error", async () => {
			sendMock
				.mockResolvedValueOnce({ UploadId: "test-upload-id" })
				.mockResolvedValueOnce({});

			const { createMultipartUpload } = await import("../s3");
			const upload = createMultipartUpload("key.pdf", "application/pdf");

			await upload.init();
			await upload.abort();

			const { AbortMultipartUploadCommand } = await import(
				"@aws-sdk/client-s3"
			);
			expect(AbortMultipartUploadCommand).toHaveBeenCalledWith(
				expect.objectContaining({ UploadId: "test-upload-id" }),
			);
		});
	});
});
