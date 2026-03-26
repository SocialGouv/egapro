import "server-only";

import { env } from "~/env";

type SuitCseResponse = {
	siren: string;
	CSE: boolean;
};

export type SanctionStatus = {
	hasSanction: boolean;
	validityDate: string | null;
};

async function fetchCseData(siren: string): Promise<SuitCseResponse | null> {
	try {
		const url = `${env.EGAPRO_SUIT_API_URL.replace(/\/$/, "")}/suit/api/externe/portail/CSE/${siren}`;
		const response = await fetch(url, {
			headers: { Accept: "application/json" },
			signal: AbortSignal.timeout(10_000),
			next: { revalidate: 86_400 },
		});

		if (!response.ok) return null;

		return (await response.json()) as SuitCseResponse;
	} catch {
		return null;
	}
}

/**
 * Fetch CSE existence from the SUIT API for a given SIREN.
 * Returns `true`/`false` if the API responds, or `null` on error/not found.
 */
export async function fetchCseBySiren(siren: string): Promise<boolean | null> {
	const data = await fetchCseData(siren);
	return data?.CSE ?? null;
}

/**
 * Fetch sanction status from the SUIT API for a given SIREN.
 * Returns the sanction status if the API responds, or `null` on error/not found.
 *
 * Note: uses the same CSE endpoint for now — will be updated when the
 * dedicated sanction endpoint is available.
 */
export async function fetchSanctionBySiren(
	siren: string,
): Promise<SanctionStatus | null> {
	const data = await fetchCseData(siren);
	if (!data) return null;

	return {
		hasSanction: !data.CSE,
		validityDate: null,
	};
}
