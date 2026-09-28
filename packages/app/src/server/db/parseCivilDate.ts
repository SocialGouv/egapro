export function parseCivilDate(dateStr: string): Date {
	return new Date(`${dateStr}T00:00:00`);
}
