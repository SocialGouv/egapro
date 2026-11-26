import { HeadBucketCommand, type S3Client } from "@aws-sdk/client-s3";
import { describe, expect, it, vi } from "vitest";

import { createS3Probe } from "../s3.js";

const BUCKET = "egapro-dev-app";
const ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE";
const SECRET_ACCESS_KEY = "wJalrXUtnFEMI-K7MDENG-bPxRfiCYEXAMPLEKEY";

function fakeClient(send: () => Promise<unknown>): {
	client: S3Client;
	send: ReturnType<typeof vi.fn>;
} {
	const sendMock = vi.fn(send);
	return { client: { send: sendMock } as unknown as S3Client, send: sendMock };
}

function withStatus(status: number, message: string): Error {
	return Object.assign(new Error(message), {
		$metadata: { httpStatusCode: status },
	});
}

describe("s3 probe", () => {
	it("declares itself as a critical internal probe", () => {
		const { client } = fakeClient(async () => ({}));

		expect(
			createS3Probe({ client, bucketName: BUCKET, secrets: [] }),
		).toMatchObject({
			key: "s3",
			label: "S3 (stockage des fichiers)",
			criticality: "critical",
			kind: "internal",
			intervalSeconds: 60,
			timeoutMs: 10_000,
		});
	});

	it("is operational when HeadBucket answers, and forwards the stop signal", async () => {
		const { client, send } = fakeClient(async () => ({}));
		const signal = new AbortController().signal;

		const result = await createS3Probe({
			client,
			bucketName: BUCKET,
			secrets: [],
		}).probe(signal);

		expect(result.status).toBe("operational");
		expect(send.mock.calls[0]?.[0]).toBeInstanceOf(HeadBucketCommand);
		expect(send.mock.calls[0]?.[0]).toMatchObject({
			input: { Bucket: BUCKET },
		});
		expect(send.mock.calls[0]?.[1]).toEqual({ abortSignal: signal });
	});

	it("is misconfigured when the credentials are refused", async () => {
		const { client } = fakeClient(async () => {
			throw withStatus(403, "Forbidden");
		});

		const result = await createS3Probe({
			client,
			bucketName: BUCKET,
			secrets: [],
		}).probe(new AbortController().signal);

		expect(result.status).toBe("misconfigured");
	});

	it("is unavailable when the endpoint answers with a server error", async () => {
		const { client } = fakeClient(async () => {
			throw withStatus(503, "Service Unavailable");
		});

		const result = await createS3Probe({
			client,
			bucketName: BUCKET,
			secrets: [],
		}).probe(new AbortController().signal);

		expect(result.status).toBe("unavailable");
	});

	it("is unavailable when the endpoint cannot be reached", async () => {
		const { client } = fakeClient(async () => {
			throw Object.assign(new Error("getaddrinfo ENOTFOUND s3"), {
				code: "ENOTFOUND",
			});
		});

		const result = await createS3Probe({
			client,
			bucketName: BUCKET,
			secrets: [],
		}).probe(new AbortController().signal);

		expect(result.status).toBe("unavailable");
		expect(result.message).toBe("getaddrinfo ENOTFOUND s3");
	});

	it("keeps the access key, the secret and the signed URL out of the message", async () => {
		const signedUrl = `https://${BUCKET}.s3.gra.io.cloud.ovh.net/?X-Amz-Credential=${ACCESS_KEY_ID}&X-Amz-Signature=0123456789abcdef`;

		const { client } = fakeClient(async () => {
			throw withStatus(
				500,
				`HeadBucket denied for ${ACCESS_KEY_ID} / ${SECRET_ACCESS_KEY} on ${signedUrl}`,
			);
		});

		const result = await createS3Probe({
			client,
			bucketName: BUCKET,
			secrets: [ACCESS_KEY_ID, SECRET_ACCESS_KEY],
		}).probe(new AbortController().signal);

		expect(result.message).not.toContain(ACCESS_KEY_ID);
		expect(result.message).not.toContain(SECRET_ACCESS_KEY);
		expect(result.message).not.toContain("X-Amz-Signature");
		expect(result.message).toContain("[redacted]");
	});
});
