import { StatsDashboard } from "~/modules/admin/stats";
import { FIRST_DECLARATION_YEAR, getCurrentYear } from "~/modules/domain";

export default function Page() {
	const currentYear = getCurrentYear();
	const availableYears: number[] = [];
	for (let y = currentYear; y >= FIRST_DECLARATION_YEAR; y--)
		availableYears.push(y);
	return (
		<StatsDashboard availableYears={availableYears} currentYear={currentYear} />
	);
}
