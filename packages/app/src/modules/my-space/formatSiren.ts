/** Formats a 9-digit SIREN into the display format "XXX XXX XXX". */
export function formatSiren(siren: string): string {
	return `${siren.slice(0, 3)} ${siren.slice(3, 6)} ${siren.slice(6, 9)}`;
}
