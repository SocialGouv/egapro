import "server-only";

import { ALLOWED_UPLOAD_MIME_TYPES } from "~/modules/shared/uploadConfig";
import { buildContentDisposition, getFile } from "./s3";

const ALLOWED_CONTENT_TYPES: ReadonlySet<string> = new Set(
	ALLOWED_UPLOAD_MIME_TYPES,
);

type StreamStoredFileInput = {
	filePath: string;
	fileName: string;
	disposition: "inline" | "attachment";
	cacheControl: string;
};

/**
 * Stream a stored file from S3 with sanitised headers.
 *
 * Single source of truth for file delivery: enforces the upload MIME whitelist
 * (defence-in-depth — unknown content types fall back to
 * `application/octet-stream`), builds an RFC 5987-compliant
 * `Content-Disposition`, and applies the caller-supplied `Cache-Control`.
 *
 * Used by the unified `/api/v1/files/[fileId]` endpoint for both SUIT
 * (`attachment`) and in-app session (`inline`) consumers.
 */
export async function streamStoredFile({
	filePath,
	fileName,
	disposition,
	cacheControl,
}: StreamStoredFileInput): Promise<Response> {
	const { body, contentType } = await getFile(filePath);
	const safeContentType = ALLOWED_CONTENT_TYPES.has(contentType)
		? contentType
		: "application/octet-stream";

	return new Response(body, {
		headers: {
			"Content-Type": safeContentType,
			"Content-Disposition": buildContentDisposition(fileName, disposition),
			"Cache-Control": cacheControl,
		},
	});
}
