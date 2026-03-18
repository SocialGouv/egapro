import "server-only";

import {
	AbortMultipartUploadCommand,
	CompleteMultipartUploadCommand,
	CreateBucketCommand,
	CreateMultipartUploadCommand,
	DeleteObjectCommand,
	GetObjectCommand,
	HeadBucketCommand,
	PutObjectCommand,
	S3Client,
	UploadPartCommand,
} from "@aws-sdk/client-s3";

import { env } from "~/env";

const globalForS3 = globalThis as unknown as {
	s3Client: S3Client | undefined;
};

const s3Client =
	globalForS3.s3Client ??
	new S3Client({
		endpoint: env.S3_ENDPOINT,
		region: env.S3_REGION,
		credentials: {
			accessKeyId: env.S3_ACCESS_KEY_ID,
			secretAccessKey: env.S3_SECRET_ACCESS_KEY,
		},
		forcePathStyle: true,
	});

if (env.NODE_ENV !== "production") globalForS3.s3Client = s3Client;

export async function ensureBucket(): Promise<void> {
	try {
		await s3Client.send(new HeadBucketCommand({ Bucket: env.S3_BUCKET_NAME }));
	} catch (error: unknown) {
		const statusCode =
			error instanceof Error && "$metadata" in error
				? (error as Error & { $metadata: { httpStatusCode: number } }).$metadata
						.httpStatusCode
				: undefined;

		if (statusCode === 404 || statusCode === 403) {
			await s3Client.send(
				new CreateBucketCommand({ Bucket: env.S3_BUCKET_NAME }),
			);
		} else {
			throw error;
		}
	}
}

export function buildObjectKey(
	siren: string,
	year: number,
	fileId: string,
): string {
	return `${siren}/${year}/${fileId}.pdf`;
}

export async function uploadFile(
	key: string,
	buffer: Buffer,
	contentType: string,
): Promise<void> {
	await s3Client.send(
		new PutObjectCommand({
			Bucket: env.S3_BUCKET_NAME,
			Key: key,
			Body: buffer,
			ContentType: contentType,
		}),
	);
}

export async function getFile(
	key: string,
): Promise<{ body: ReadableStream; contentType: string }> {
	const response = await s3Client.send(
		new GetObjectCommand({
			Bucket: env.S3_BUCKET_NAME,
			Key: key,
		}),
	);

	if (!response.Body) {
		throw new Error("Empty response body from S3");
	}

	return {
		body: response.Body.transformToWebStream(),
		contentType: response.ContentType ?? "application/pdf",
	};
}

export async function deleteFile(key: string): Promise<void> {
	await s3Client.send(
		new DeleteObjectCommand({
			Bucket: env.S3_BUCKET_NAME,
			Key: key,
		}),
	);
}

import { S3_PART_MIN_SIZE } from "~/modules/shared";

/**
 * Creates an incremental multipart upload to S3.
 * Chunks are buffered until they reach S3_PART_MIN_SIZE, then flushed as a part.
 */
export function createMultipartUpload(key: string, contentType: string) {
	let uploadId: string;
	let partNumber = 1;
	const parts: { ETag: string; PartNumber: number }[] = [];
	let buffer = Buffer.alloc(0);

	return {
		async init() {
			const res = await s3Client.send(
				new CreateMultipartUploadCommand({
					Bucket: env.S3_BUCKET_NAME,
					Key: key,
					ContentType: contentType,
				}),
			);
			if (!res.UploadId) {
				throw new Error("S3 CreateMultipartUpload returned no UploadId");
			}
			uploadId = res.UploadId;
		},

		async sendChunk(data: Buffer) {
			buffer = Buffer.concat([buffer, data]);
			if (buffer.length >= S3_PART_MIN_SIZE) {
				await this.flushPart();
			}
		},

		async flushPart() {
			if (buffer.length === 0) return;

			const res = await s3Client.send(
				new UploadPartCommand({
					Bucket: env.S3_BUCKET_NAME,
					Key: key,
					UploadId: uploadId,
					PartNumber: partNumber,
					Body: buffer,
				}),
			);
			if (!res.ETag) {
				throw new Error("S3 UploadPart returned no ETag");
			}
			parts.push({ ETag: res.ETag, PartNumber: partNumber });
			partNumber++;
			buffer = Buffer.alloc(0);
		},

		async complete() {
			await this.flushPart();
			return s3Client.send(
				new CompleteMultipartUploadCommand({
					Bucket: env.S3_BUCKET_NAME,
					Key: key,
					UploadId: uploadId,
					MultipartUpload: { Parts: parts },
				}),
			);
		},

		async abort() {
			return s3Client.send(
				new AbortMultipartUploadCommand({
					Bucket: env.S3_BUCKET_NAME,
					Key: key,
					UploadId: uploadId,
				}),
			);
		},
	};
}
