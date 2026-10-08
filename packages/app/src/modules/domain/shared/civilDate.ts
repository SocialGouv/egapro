export function civilDate(year: number, monthIndex: number, day: number): Date {
	return new Date(Date.UTC(year, monthIndex, day));
}

export function isCivilDayOver(day: Date, now: Date): boolean {
	return now.getTime() >= day.getTime() + 24 * 60 * 60 * 1000;
}
