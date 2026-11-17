import { HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";

import { sanitizeMessage } from "../sanitize.js";
import { startTimer } from "./timing.js";
import type { Probe, ProbeStatus } from "./types.js";

const S3_TIMEOUT_MS = 10_000;
const S3_INTERVAL_SECONDS = 60;

export type S3ConnectionConfig = {
	endpoint: string;
	region: string;
	accessKeyId: string;
	secretAccessKey: string;
	bucketName: string;
};

export type S3ProbeOptions = {
	client: S3Client;
	bucketName: string;
	secrets: readonly string[];
	intervalSeconds?: number;
	timeoutMs?: number;
};

export function createS3Client({
	endpoint,
	region,
	accessKeyId,
	secretAccessKey,
}: S3ConnectionConfig): S3Client {
	return new S3Client({
		endpoint,
		region,
		credentials: { accessKeyId, secretAccessKey },
		forcePathStyle: true,
	});
}

export function createS3Probe({
	client,
	bucketName,
	secrets,
	intervalSeconds = S3_INTERVAL_SECONDS,
	timeoutMs = S3_TIMEOUT_MS,
}: S3ProbeOptions): Probe {
	return {
		key: "s3",
		label: "S3 (stockage des fichiers)",
		criticality: "critical",
		kind: "internal",
		intervalSeconds,
		timeoutMs,
		async probe(signal) {
			const elapsed = startTimer();
			try {
				await client.send(new HeadBucketCommand({ Bucket: bucketName }), {
					abortSignal: signal,
				});
				return { status: "operational", latencyMs: elapsed() };
			} catch (error) {
				return {
					status: statusFromError(error),
					latencyMs: elapsed(),
					message: sanitizeMessage(error, secrets),
				};
			}
		},
	};
}

function statusFromError(error: unknown): ProbeStatus {
	const httpStatus =
		typeof error === "object" && error !== null && "$metadata" in error
			? (error as { $metadata?: { httpStatusCode?: unknown } }).$metadata
					?.httpStatusCode
			: undefined;

	return httpStatus === 401 || httpStatus === 403
		? "misconfigured"
		: "unavailable";
}
