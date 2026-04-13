type Props = {
	userName: string;
	userEmail: string;
};

export function AdminHomePage({ userName, userEmail }: Props) {
	return (
		<div className="fr-container fr-py-6w">
			<h1 className="fr-h1">Backoffice</h1>
			<p className="fr-text--lead">Bienvenue, {userName}.</p>
			<p>
				Vous êtes connecté en tant qu'administrateur avec l'adresse{" "}
				<strong>{userEmail}</strong>.
			</p>
		</div>
	);
}
