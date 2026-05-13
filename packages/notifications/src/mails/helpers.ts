export function escapeHtml(value: unknown): string {
	return String(value)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

export function formatSiren(siren: string | null | undefined): string {
	const digits = String(siren ?? "").replace(/\D/g, "");
	return digits.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3");
}

export function getPublicUrl(): string {
	const url = process.env.EGAPRO_PUBLIC_URL ?? "https://egapro.travail.gouv.fr";
	return url.replace(/\/$/, "");
}
