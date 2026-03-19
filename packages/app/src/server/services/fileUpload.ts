import "server-only";

import crypto from "node:crypto";
import path from "node:path";

import { env } from "~/env";

import { FILE_TOO_LARGE_ERROR, MAX_FILE_SIZE } from "~/modules/shared";

import { createClamdStream, type ScanResult } from "./clamav";
import { MIN_SIGNATURE_BYTES, validateFileSignature } from "./fileValidation";
import { createMultipartUpload } from "./s3";

type UploadOptions = {
	siren: string;
	year: number;
	fileName: string;
	contentType: string;
	maxSize?: number;
	/** MIME types to allow, validated via magic bytes on the first chunk. */
	allowedMimeTypes: readonly string[];
};

type UploadResult =
	| { ok: true; key: string }
	| { ok: false; error: string; virus?: string };

/**
 * Streams a file to ClamAV (INSTREAM) and S3 (multipart) simultaneously.
 *
 * The first chunk is validated against allowed MIME types via magic bytes
 * before being forwarded to ClamAV and S3.
 *
 * Memory footprint: ~5MB (S3 part buffer) + a few KB (clamd socket).
 */
export async function handleStreamingUpload(
	stream: ReadableStream<Uint8Array>,
	options: UploadOptions,
): Promise<UploadResult> {
	const maxSize = options.maxSize ?? MAX_FILE_SIZE;
	const ext = path.extname(options.fileName) || ".bin";
	const fileId = crypto.randomUUID();
	const key = `${options.siren}/${options.year}/${fileId}${ext}`;

	const clamd = createClamdStream(env.CLAMAV_HOST, env.CLAMAV_PORT);
	const s3Upload = createMultipartUpload(key, options.contentType);
	await s3Upload.init();

	let totalBytes = 0;
	let headerBuf = Buffer.alloc(0);
	let signatureValidated = false;
	const reader = stream.getReader();

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			const buf = Buffer.from(value);
			totalBytes += buf.length;

			if (totalBytes > maxSize) {
				throw new FileTooLargeError();
			}

			// Validate magic bytes on the first chunk(s)
			if (!signatureValidated) {
				headerBuf = Buffer.concat([headerBuf, buf]);
				if (headerBuf.length >= MIN_SIGNATURE_BYTES) {
					const result = validateFileSignature(
						headerBuf,
						options.allowedMimeTypes,
					);
					if (!result.valid) {
						throw new InvalidFileTypeError(result.error);
					}
					signatureValidated = true;
				}
			}

			// Send to both destinations in parallel
			await Promise.all([clamd.sendChunk(buf), s3Upload.sendChunk(buf)]);
		}
	} catch (err) {
		clamd.destroy();
		await s3Upload.abort().catch(() => {});

		if (err instanceof FileTooLargeError) {
			return { ok: false, error: FILE_TOO_LARGE_ERROR };
		}
		if (err instanceof InvalidFileTypeError) {
			return { ok: false, error: err.message };
		}
		throw err;
	}

	if (totalBytes === 0) {
		clamd.destroy();
		await s3Upload.abort().catch(() => {});
		return { ok: false, error: "Le fichier est vide." };
	}

	// If the file was smaller than MIN_SIGNATURE_BYTES, validate now
	if (!signatureValidated) {
		const result = validateFileSignature(headerBuf, options.allowedMimeTypes);
		if (!result.valid) {
			clamd.destroy();
			await s3Upload.abort().catch(() => {});
			return { ok: false, error: result.error };
		}
	}

	// Get the scan verdict
	let scanResult: ScanResult;
	try {
		scanResult = await clamd.finish();
	} catch {
		clamd.destroy();
		await s3Upload.abort().catch(() => {});
		throw new Error("Antivirus scan failed");
	}

	if (scanResult.clean) {
		await s3Upload.complete();
		return { ok: true, key };
	}

	// Infected → abort S3 upload
	await s3Upload.abort();
	return {
		ok: false,
		error: "Fichier rejeté : virus détecté",
		virus: scanResult.virus,
	};
}

class FileTooLargeError extends Error {
	constructor() {
		super("File too large");
	}
}

class InvalidFileTypeError extends Error {}
