import "server-only";

import {
	CreateBucketCommand,
	DeleteObjectCommand,
	GetObjectCommand,
	HeadBucketCommand,
	PutObjectCommand,
	S3Client,
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
		await s3Client.send(
			new HeadBucketCommand({ Bucket: env.S3_BUCKET_NAME }),
		);
	} catch (error: unknown) {
		const statusCode =
			error instanceof Error && "$metadata" in error
				? (error as Error & { $metadata: { httpStatusCode: number } })
						.$metadata.httpStatusCode
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
