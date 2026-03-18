/** Maximum file size in bytes (10 MB). */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** ClamAV scan timeout in milliseconds (30s). */
export const SCAN_TIMEOUT_MS = 30_000;

/** Minimum S3 multipart part size in bytes (5 MB, required by S3 except for the last part). */
export const S3_PART_MIN_SIZE = 5 * 1024 * 1024;
