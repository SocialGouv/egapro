import "server-only";

import { env } from "~/env";

type SuitCseResponse = {
	siren: string;
	CSE: boolean;
};

type SuitSanctionResponse = {
	siren: string;
	sanction: boolean;
};

export type SanctionStatus = {
	hasSanction: boolean;
	validityDate: string | null;
};

/**
 * Fetch CSE existence from the SUIT API for a given SIREN.
 * Returns `true`/`false` if the API responds, or `null` on error/not found.
 */
export async function fetchCseBySiren(siren: string): Promise<boolean | null> {
	try {
		const url = `${env.EGAPRO_SUIT_API_URL.replace(/\/$/, "")}/suit/api/externe/portail/CSE/${siren}`;
		const response = await fetch(url, {
			headers: { Accept: "application/json" },
			signal: AbortSignal.timeout(10_000),
			next: { revalidate: 86_400 },
		});

		if (!response.ok) return null;

		const data = (await response.json()) as SuitCseResponse;
		return data.CSE;
	} catch {
		return null;
	}
}

/**
 * Fetch sanction status from the SUIT API for a given SIREN.
 * Returns the sanction status if the API responds, or `null` on error/not found.
 *
 * When EGAPRO_MOCK_SUIT_SANCTION is true, always returns "no sanction"
 * without calling the API (for dev/testing while the API is unavailable).
 */
export async function fetchSanctionBySiren(
	siren: string,
): Promise<SanctionStatus | null> {
	if (env.EGAPRO_MOCK_SUIT_SANCTION) {
		return { hasSanction: false, validityDate: null };
	}

	try {
		const url = `${env.EGAPRO_SUIT_API_URL.replace(/\/$/, "")}/suit/api/externe/portail/sanction/${siren}`;
		const response = await fetch(url, {
			headers: { Accept: "application/json" },
			signal: AbortSignal.timeout(10_000),
			next: { revalidate: 86_400 },
		});

		if (!response.ok) return null;

		const data = (await response.json()) as SuitSanctionResponse;
		return {
			hasSanction: data.sanction,
			validityDate: null,
		};
	} catch {
		return null;
	}
}
