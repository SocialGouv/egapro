export function OrdinalLongDate({ date }: { date: Date }) {
	const day = date.getUTCDate();
	const monthYear = new Intl.DateTimeFormat("fr-FR", {
		month: "long",
		year: "numeric",
		timeZone: "UTC",
	}).format(date);
	return (
		<>
			{day}
			{day === 1 && <sup>er</sup>} {monthYear}
		</>
	);
}
