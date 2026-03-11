import "server-only";

import { env } from "~/env";

type SuitCseResponse = {
	siren: string;
	CSE: boolean;
};

/**
 * Fetch CSE existence from the SUIT API for a given SIREN.
 * Returns `true`/`false` if the API responds, or `null` on error/not found.
 */
export async function fetchCseBySiren(siren: string): Promise<boolean | null> {
	const url = `${env.EGAPRO_SUIT_API_URL.replace(/\/$/, "")}/suit/api/externe/portail/CSE/${siren}`;

	try {
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
