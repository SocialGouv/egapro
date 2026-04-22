/**
 * Convert a `MM-DD` key (shared across years on the progression axis) to
 * the French display form `DD/MM`.
 */
export function formatMonthDay(monthDay: string): string {
	const [month, day] = monthDay.split("-");
	return `${day}/${month}`;
}
