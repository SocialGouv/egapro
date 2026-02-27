import { api } from "~/trpc/server";

import { CompanyCardList } from "./CompanyCardList";
import { CompanyListHeader } from "./CompanyListHeader";
import { CompanyTable } from "./CompanyTable";
import { ViewToggle } from "./ViewToggle";
import { WelcomeBanner } from "./WelcomeBanner";

export async function MyCompaniesPage() {
	const companies = await api.company.list();

	return (
		<main id="content">
			<div className="fr-container fr-my-4w">
				<WelcomeBanner />
				<CompanyListHeader />
				<ViewToggle
					companyCount={companies.length}
					listView={<CompanyCardList companies={companies} />}
					tableView={<CompanyTable companies={companies} />}
				/>
			</div>
		</main>
	);
}
