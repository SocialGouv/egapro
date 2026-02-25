import styles from "./LoginForm.module.scss";
import { LoginAccordion } from "./LoginAccordion";
import { ProConnectButton } from "./ProConnectButton";

/**
 * Left column of the login page: title, description, ProConnect button, accordion.
 *
 * Figma gap hierarchy:
 * - 32px (2rem) between the main content group and the accordion
 * - 24px (1.5rem) between title, description, and button within the group
 */
export function LoginForm() {
	return (
		<div className={styles.form}>
			<div className={styles.content}>
				<h1>Connectez-vous avec ProConnect</h1>
				<p>
					Accédez à votre espace de déclaration Egapro avec la solution
					sécurisée ProConnect et votre e-mail professionnel (contact utilisé en
					cas de contrôle).
				</p>
				<ProConnectButton />
			</div>
			<LoginAccordion />
		</div>
	);
}
