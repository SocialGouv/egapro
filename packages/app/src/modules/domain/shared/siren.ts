const SIREN_REGEX = /^\d{9}$/;

/** Extracts the 9-digit SIREN from a 14-digit SIRET. */
export function extractSiren(siret: string): string {
	return siret.slice(0, 9);
}

/** Formats a 9-digit SIREN into the display format "XXX XXX XXX". */
export function formatSiren(siren: string): string {
	return `${siren.slice(0, 3)} ${siren.slice(3, 6)} ${siren.slice(6, 9)}`;
}

/**
 * Extracts and validates the SIREN from a SIRET string.
 * Returns the 9-digit SIREN, or null if the input is missing or invalid.
 */
export function parseSiren(siret: string | null | undefined): string | null {
	if (!siret || siret.length < 9) return null;
	const siren = siret.slice(0, 9);
	return SIREN_REGEX.test(siren) ? siren : null;
}
