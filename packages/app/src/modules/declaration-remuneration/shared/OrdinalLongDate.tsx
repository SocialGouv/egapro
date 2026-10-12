import { civilLongDateParts } from "~/modules/domain";

export function OrdinalLongDate({ date }: { date: Date }) {
	const { day, monthYear } = civilLongDateParts(date);
	return (
		<>
			{day}
			{day === 1 && <sup>er</sup>} {monthYear}
		</>
	);
}
