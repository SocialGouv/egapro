export function formatCsePresence(hasCse: boolean | null): string {
	if (hasCse === null) return "Non renseigné";
	return hasCse ? "Oui" : "Non";
}
