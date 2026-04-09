type Props = {
	userName: string;
	userEmail: string;
};

export function AdminHomePage({ userName, userEmail }: Props) {
	return (
		<>
			<h1 className="fr-h1">Backoffice</h1>
			<p className="fr-text--lead">Bienvenue, {userName}.</p>
			<p>
				Vous êtes connecté en tant qu'administrateur avec l'adresse{" "}
				<strong>{userEmail}</strong>.
			</p>
		</>
	);
}
