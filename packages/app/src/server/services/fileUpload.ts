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
	/**
	 * Request / timeout signal. On abort, the clamd socket is destroyed and
	 * the S3 multipart is aborted, so no orphan parts are left behind.
	 */
	signal?: AbortSignal;
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
	| "scan_unavailable"
	| "aborted";

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
	const signal = options.signal;
	// Normalise ext to alnum only — `path.extname` rules out `/` traversal
	// (basename suffix) but exotic bytes would survive and land in the S3 key.
	const rawExt = path.extname(options.fileName);
	const ext = /^\.[A-Za-z0-9]{1,10}$/.test(rawExt) ? rawExt : ".bin";
	const fileId = crypto.randomUUID();
	const key = `${options.siren}/${options.year}/${fileId}${ext}`;

	const clamd = createClamdStream(env.CLAMAV_HOST, env.CLAMAV_PORT, signal);
	const s3Upload = createMultipartUpload(key, options.contentType, signal);
	await s3Upload.init();

	let totalBytes = 0;
	let headerBuf = Buffer.alloc(0);
	const reader = stream.getReader();

	try {
		while (true) {
			if (signal?.aborted) throw new UploadAbortedError();
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
				if (signal?.aborted) throw new UploadAbortedError();
				throw new ClamdScanError(clamdResult.reason);
			}
			if (s3Result.status === "rejected") {
				if (signal?.aborted) throw new UploadAbortedError();
				throw s3Result.reason;
			}
		}
	} catch (err) {
		clamd.destroy();
		await s3Upload.abort().catch(() => {});
		await reader.cancel().catch(() => {});

		if (err instanceof FileTooLargeError) {
			return { ok: false, reason: "too_large", error: FILE_TOO_LARGE_ERROR };
		}
		if (err instanceof UploadAbortedError || signal?.aborted) {
			return {
				ok: false,
				reason: "aborted",
				error: "L'upload a été interrompu.",
			};
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
		if (signal?.aborted) {
			return {
				ok: false,
				reason: "aborted",
				error: "L'upload a été interrompu.",
			};
		}
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
 * Sentinel thrown when the request-scoped AbortSignal fires (client
 * disconnect or request-level timeout). Lets the outer catch distinguish an
 * interruption from a genuine scan/S3 failure.
 */
class UploadAbortedError extends Error {
	constructor() {
		super("Upload aborted by request signal");
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
