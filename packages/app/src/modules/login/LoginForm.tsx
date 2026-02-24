import { LoginAccordion } from "./LoginAccordion";
import { ProConnectButton } from "./ProConnectButton";

/** Left column of the login page: title, description, ProConnect button, accordion. */
export function LoginForm() {
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
				flex: 1,
				gap: "1.5rem",
			}}
		>
			<h1>Connectez-vous avec ProConnect</h1>
			<p className="fr-text--lg">
				Accédez à votre espace de déclaration Egapro avec la solution sécurisée
				ProConnect et votre e-mail professionnel (contact utilisé en cas de
				contrôle).
			</p>
			<ProConnectButton />
			<LoginAccordion />
		</div>
	);
}
