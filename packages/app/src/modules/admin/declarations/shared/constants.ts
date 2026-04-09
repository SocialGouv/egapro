export const STATUS_LABELS: Record<string, string> = {
	draft: "Brouillon",
	submitted: "Transmise",
};

export function formatDate(date: Date | null | undefined): string {
	if (!date) return "—";
	return new Intl.DateTimeFormat("fr-FR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	}).format(new Date(date));
}

export function formatDateTime(date: Date | null | undefined): string {
	if (!date) return "—";
	return new Intl.DateTimeFormat("fr-FR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(date));
}
