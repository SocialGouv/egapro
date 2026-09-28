export function OrdinalLongDate({ date }: { date: Date }) {
	const day = date.getUTCDate();
	const suffix = day === 1 ? "er" : "e";
	const monthYear = new Intl.DateTimeFormat("fr-FR", {
		month: "long",
		year: "numeric",
		timeZone: "UTC",
	}).format(date);
	return (
		<>
			{day}
			<sup>{suffix}</sup> {monthYear}
		</>
	);
}
