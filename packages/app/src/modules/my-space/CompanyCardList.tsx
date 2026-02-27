import { CompanyCard } from "./CompanyCard";
import type { CompanyItem } from "./types";

type Props = {
	companies: CompanyItem[];
};

export function CompanyCardList({ companies }: Props) {
	return (
		<div className="fr-grid-row fr-grid-row--gutters">
			{companies.map((company) => (
				<div className="fr-col-12 fr-col-md-6" key={company.siren}>
					<CompanyCard company={company} />
				</div>
			))}
		</div>
	);
}
