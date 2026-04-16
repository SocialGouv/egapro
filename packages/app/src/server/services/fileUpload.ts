import "server-only";

import crypto from "node:crypto";
import path from "node:path";

import { env } from "~/env";

import {
	FILE_TOO_LARGE_ERROR,
	MAX_FILE_SIZE,
} from "~/modules/shared/uploadConfig";

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

/**
 * Typed result of {@link handleStreamingUpload}.
 *
 * The `reason` discriminant on failures lets the caller map to the right HTTP
 * status without string-matching error messages (`virus` → 422,
 * `scan_unavailable` → 503, everything else → 400).
 */
export type UploadFailureReason =
	| "too_large"
	| "wrong_type"
	| "empty"
	| "virus"
	| "scan_unavailable";

export type UploadResult =
	| { ok: true; key: string; fileId: string }
	| {
			ok: false;
			reason: UploadFailureReason;
			error: string;
			virusName?: string;
	  };

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

			// Collect header bytes for magic-byte validation (done after scan).
			if (headerBuf.length < MIN_SIGNATURE_BYTES) {
				headerBuf = Buffer.concat([
					headerBuf,
					buf.subarray(0, MIN_SIGNATURE_BYTES - headerBuf.length),
				]);
			}

			// Send to both destinations in parallel. We use allSettled + explicit
			// priority rather than Promise.all so that a clamd failure
			// (ECONNREFUSED, broken pipe mid-stream) is always reported as
			// `scan_unavailable`, regardless of whether S3 also happens to be
			// failing. ClamAV is a pre-requisite for the entire pipeline, so if
			// it is dead the correct client-facing status is 503, not 500.
			const [clamdResult, s3Result] = await Promise.allSettled([
				clamd.sendChunk(buf),
				s3Upload.sendChunk(buf),
			]);
			if (clamdResult.status === "rejected") {
				throw new ClamdScanError(clamdResult.reason);
			}
			if (s3Result.status === "rejected") {
				throw s3Result.reason;
			}
		}
	} catch (err) {
		clamd.destroy();
		await s3Upload.abort().catch(() => {});

		if (err instanceof FileTooLargeError) {
			return { ok: false, reason: "too_large", error: FILE_TOO_LARGE_ERROR };
		}
		if (err instanceof ClamdScanError) {
			console.error("[fileUpload] clamd sendChunk failed", err.cause);
			return {
				ok: false,
				reason: "scan_unavailable",
				error:
					"Le service de scan antivirus est temporairement indisponible. Merci de réessayer dans quelques minutes.",
			};
		}
		throw err;
	}

	if (totalBytes === 0) {
		clamd.destroy();
		await s3Upload.abort().catch(() => {});
		return { ok: false, reason: "empty", error: "Le fichier est vide." };
	}

	// Virus scan runs BEFORE magic-byte validation so that infected files
	// always surface the virus message, even if their header is corrupted
	// or deliberately malformed.
	let scanResult: ScanResult;
	try {
		scanResult = await clamd.finish();
	} catch (err) {
		console.error("[fileUpload] clamd scan failed", err);
		clamd.destroy();
		await s3Upload.abort().catch(() => {});
		return {
			ok: false,
			reason: "scan_unavailable",
			error:
				"Le service de scan antivirus est temporairement indisponible. Merci de réessayer dans quelques minutes.",
		};
	}

	if (!scanResult.clean) {
		await s3Upload.abort();
		return {
			ok: false,
			reason: "virus",
			error: "Fichier rejeté : virus détecté",
			virusName: scanResult.virus,
		};
	}

	// ClamAV says clean — now validate magic bytes.
	const sigResult = validateFileSignature(headerBuf, options.allowedMimeTypes);
	if (!sigResult.valid) {
		clamd.destroy();
		await s3Upload.abort().catch(() => {});
		return { ok: false, reason: "wrong_type", error: sigResult.error };
	}

	await s3Upload.complete();
	return { ok: true, key, fileId };
}

class FileTooLargeError extends Error {
	constructor() {
		super("File too large");
	}
}

/**
 * Wraps a failure from `clamd.sendChunk()` so the outer catch can distinguish
 * an antivirus-availability issue from a generic I/O failure and surface it
 * as `scan_unavailable` (HTTP 503) rather than `server_error` (HTTP 500).
 */
class ClamdScanError extends Error {
	constructor(cause: unknown) {
		super("clamd sendChunk failed");
		this.cause = cause;
	}
}
