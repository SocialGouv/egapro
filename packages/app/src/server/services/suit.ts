import "server-only";

import { suitFetch } from "./suitClient";

type SuitCseResponse = {
	siren: string;
	CSE: boolean;
};

/**
 * Fetch CSE existence from the SUIT API for a given SIREN.
 * Returns `true`/`false` if the API responds, or `null` on error/not found.
 */
export async function fetchCseBySiren(siren: string): Promise<boolean | null> {
	try {
		const response = await suitFetch(`/suit/api/externe/portail/CSE/${siren}`);

		if (!response.ok) {
			// A status at all proves mTLS worked; only a throw means a bad certificate.
			console.warn(`[suit] CSE lookup: HTTP ${response.status}`);
			return null;
		}

		const data = (await response.json()) as SuitCseResponse;
		return data.CSE;
	} catch (error) {
		// No response: refused handshake, bad certificate, or timeout.
		console.error("[suit] CSE lookup failed", error);
		return null;
	}
}
