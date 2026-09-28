import { isAdminReturnPath } from "~/modules/admin/access";

import { LoginAccordion } from "./LoginAccordion";
import styles from "./LoginForm.module.scss";
import { ProConnectButton } from "./ProConnectButton";

type Props = {
	callbackUrl?: string;
};

/**
 * Left column of the login page: title, description, ProConnect button, accordion.
 *
 * Figma gap hierarchy:
 * - 32px (2rem) between the main content group and the accordion
 * - 24px (1.5rem) between title, description, and button within the group
 */
export function LoginForm({ callbackUrl }: Props) {
	// `callbackUrl` reaches this component already validated by the page
	// (`sanitizeCallbackUrl`): safe to test as-is against the backoffice
	// prefix. Any other destination leaves the ProConnect request unchanged —
	// that is the rule the epic does not negotiate.
	const requiresAdminStepUp = isAdminReturnPath(callbackUrl ?? "");

	return (
		<div className={styles.form}>
			<div className={styles.content}>
				<h1>Connectez-vous avec ProConnect</h1>
				<p>
					Accédez à votre espace de déclaration Egapro avec la solution
					sécurisée ProConnect et votre e-mail professionnel (contact utilisé en
					cas de contrôle).
				</p>
				<ProConnectButton
					callbackUrl={callbackUrl}
					requiresAdminStepUp={requiresAdminStepUp}
				/>
			</div>
			<LoginAccordion />
		</div>
	);
}
