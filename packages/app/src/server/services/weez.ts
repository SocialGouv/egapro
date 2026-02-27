import "server-only";

/**
 * Mock implementation of the WEEZ API.
 * Returns company name for a given SIREN number.
 * TODO: Replace with real WEEZ API integration.
 */
export async function fetchCompanyName(siren: string): Promise<string> {
	return `Entreprise ${siren}`;
}
