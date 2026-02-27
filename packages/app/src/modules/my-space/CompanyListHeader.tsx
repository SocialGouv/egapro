import { NewTabNotice } from "~/modules/layout/shared/NewTabNotice";

export function CompanyListHeader() {
	return (
		<div className="fr-grid-row fr-grid-row--middle fr-grid-row--gutters fr-mb-3w">
			<div className="fr-col">
				<h2>Mes entreprises</h2>
			</div>
			<div className="fr-col-auto">
				{/* TODO: Replace href with real ProConnect account URL */}
				<a
					className="fr-btn fr-btn--secondary fr-btn--icon-right fr-icon-arrow-right-line"
					href="https://proconnect.gouv.fr"
					rel="noopener noreferrer"
					target="_blank"
				>
					Ajouter une entreprise sur ProConnect
					<NewTabNotice />
				</a>
			</div>
		</div>
	);
}
