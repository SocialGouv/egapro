const FRENCH_DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
	day: "numeric",
	month: "long",
	year: "numeric",
	timeZone: "Europe/Paris",
});

export function formatSiren(siren: string | null | undefined): string {
	const digits = String(siren ?? "").replace(/\D/g, "");
	return digits.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3");
}

export function formatYear(year: number): string {
	return String(year);
}

export function formatFrenchDate(
	date: Date | string | null | undefined,
): string {
	if (!date) return "";
	const d = typeof date === "string" ? new Date(date) : date;
	if (Number.isNaN(d.getTime())) return "";
	const parts = FRENCH_DATE_FORMATTER.formatToParts(d);
	const day = parts.find((p) => p.type === "day")?.value ?? "";
	const month = parts.find((p) => p.type === "month")?.value ?? "";
	const year = parts.find((p) => p.type === "year")?.value ?? "";
	const dayLabel = day === "1" ? "1ᵉʳ" : day;
	return `${dayLabel} ${month} ${year}`;
}

export function escapeHtml(value: unknown): string {
	return String(value)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}
