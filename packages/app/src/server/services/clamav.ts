import "server-only";

import { env } from "~/env";

type ScanResult = { clean: true } | { clean: false; virus: string };

/**
 * Scan a buffer for viruses using the ClamAV REST API (benzino77/clamav-rest-api).
 * If CLAMAV_URL is not set, scanning is skipped and the file is considered clean.
 */
export async function scanBuffer(
	buffer: Buffer,
	fileName: string,
): Promise<ScanResult> {
	if (!env.CLAMAV_URL) {
		return { clean: true };
	}

	const formData = new FormData();
	formData.append("FILES", new Blob([new Uint8Array(buffer)]), fileName);

	const response = await fetch(`${env.CLAMAV_URL}/api/v1/scan`, {
		method: "POST",
		body: formData,
	});

	if (!response.ok) {
		throw new Error(`ClamAV scan failed with status ${response.status}`);
	}

	const body = (await response.json()) as {
		success: boolean;
		data: { result: Array<{ is_infected: boolean; viruses: string[] }> };
	};

	if (!body.success) {
		throw new Error("ClamAV scan returned an unsuccessful response");
	}

	const result = body.data.result[0];
	if (!result || !result.is_infected) {
		return { clean: true };
	}

	return { clean: false, virus: result.viruses.join(", ") || "Unknown" };
}
