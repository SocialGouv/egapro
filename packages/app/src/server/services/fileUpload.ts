import "server-only";

import crypto from "node:crypto";

import { env } from "~/env";

import { createClamdStream, type ScanResult } from "./clamav";
import { createMultipartUpload } from "./s3";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const PDF_MAGIC_BYTES = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-

type UploadResult =
	| { ok: true; key: string }
	| { ok: false; error: string; virus?: string };

/**
 * Streams a file to ClamAV (INSTREAM) and S3 (multipart) simultaneously.
 *
 * Memory footprint: ~5MB (S3 part buffer) + a few KB (clamd socket).
 */
export async function handleStreamingUpload(
	stream: ReadableStream<Uint8Array>,
	options: { siren: string; year: number; fileName: string },
): Promise<UploadResult> {
	const fileId = crypto.randomUUID();
	const key = `${options.siren}/${options.year}/${fileId}.pdf`;

	const clamd = createClamdStream(env.CLAMAV_HOST, env.CLAMAV_PORT);
	const s3Upload = createMultipartUpload(key, "application/pdf");
	await s3Upload.init();

	let totalBytes = 0;
	let firstChunk = true;

	const reader = stream.getReader();

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			const buf = Buffer.from(value);
			totalBytes += buf.length;

			if (totalBytes > MAX_FILE_SIZE) {
				throw new FileTooLargeError();
			}

			// Validate PDF magic bytes on the first chunk
			if (firstChunk) {
				firstChunk = false;
				const hasPdfSignature = PDF_MAGIC_BYTES.every(
					(byte, index) => buf[index] === byte,
				);
				if (!hasPdfSignature) {
					throw new InvalidPdfError();
				}
			}

			// Send to both destinations in parallel
			await Promise.all([clamd.sendChunk(buf), s3Upload.sendChunk(buf)]);
		}
	} catch (err) {
		clamd.destroy();
		await s3Upload.abort().catch(() => {});

		if (err instanceof FileTooLargeError) {
			return {
				ok: false,
				error: "Le fichier dépasse la taille maximale autorisée de 10 Mo.",
			};
		}
		if (err instanceof InvalidPdfError) {
			return { ok: false, error: "Le fichier n'est pas un PDF valide." };
		}
		throw err;
	}

	if (totalBytes === 0) {
		clamd.destroy();
		await s3Upload.abort().catch(() => {});
		return { ok: false, error: "Le fichier est vide." };
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

class InvalidPdfError extends Error {
	constructor() {
		super("Invalid PDF");
	}
}
