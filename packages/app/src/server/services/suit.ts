import "server-only";

import { unstable_cache } from "next/cache";

import { suitFetch } from "./suitClient";

type SuitCseResponse = {
	siren: string;
	CSE: boolean;
};

class SuitHttpError extends Error {
	constructor(readonly status: number) {
		super(`SUIT returned HTTP ${status}`);
	}
}

// Keep the previous 24-hour Next.js data-cache behaviour with Undici's fetch,
// which does not implement Next.js' fetch-level `next.revalidate` option.
const cachedCseBySiren = unstable_cache(
	async (siren: string): Promise<boolean> => {
		const response = await suitFetch(`/suit/api/externe/portail/CSE/${siren}`);
		if (!response.ok) throw new SuitHttpError(response.status);
		const data = (await response.json()) as SuitCseResponse;
		return data.CSE;
	},
	["suit-cse"],
	{ revalidate: 86_400 },
);

/**
 * Fetch CSE existence from the SUIT API for a given SIREN.
 * Returns `true`/`false` if the API responds, or `null` on error/not found.
 */
export async function fetchCseBySiren(siren: string): Promise<boolean | null> {
	try {
		return await cachedCseBySiren(siren);
	} catch (error) {
		if (error instanceof SuitHttpError) {
			// A status at all proves mTLS worked; only a throw means a bad certificate.
			console.warn(`[suit] CSE lookup: HTTP ${error.status}`);
			return null;
		}
		// No response: refused handshake, bad certificate, or timeout.
		console.error("[suit] CSE lookup failed", error);
		return null;
	}
}
