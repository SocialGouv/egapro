import {
	ServiceStatusBanner,
	type ServiceStatusOverviewSummary,
} from "./serviceStatus";

type Props = {
	userName: string;
	userEmail: string;
	serviceStatus: ServiceStatusOverviewSummary;
};

export function AdminHomePage({ userName, userEmail, serviceStatus }: Props) {
	return (
		<>
			<h1 className="fr-h1">Backoffice</h1>
			<ServiceStatusBanner summary={serviceStatus} />
			<p className="fr-text--lead">Bienvenue, {userName}.</p>
			<p>
				Vous êtes connecté en tant qu'administrateur avec l'adresse{" "}
				<strong>{userEmail}</strong>.
			</p>
		</>
	);
}
