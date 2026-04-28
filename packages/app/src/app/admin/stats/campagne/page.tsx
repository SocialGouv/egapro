import { CampaignStatsPage } from "~/modules/admin/stats";
import { FIRST_DECLARATION_YEAR, getCurrentYear } from "~/modules/domain";

export default function Page() {
	const currentYear = getCurrentYear();
	const availableYears: number[] = [];
	for (let year = currentYear; year >= FIRST_DECLARATION_YEAR; year--) {
		availableYears.push(year);
	}
	return (
		<CampaignStatsPage
			availableYears={availableYears}
			currentYear={currentYear}
		/>
	);
}
