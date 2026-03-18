const SIREN_REGEX = /^\d{9}$/;

/**
 * Extracts and validates the SIREN from a SIRET string.
 * Returns the 9-digit SIREN, or null if the input is missing or invalid.
 */
export function parseSiren(siret: string | null | undefined): string | null {
	if (!siret || siret.length < 9) return null;
	const siren = siret.slice(0, 9);
	return SIREN_REGEX.test(siren) ? siren : null;
}
