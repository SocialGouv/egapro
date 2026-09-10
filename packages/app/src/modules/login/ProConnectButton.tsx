"use client";

import { signIn } from "next-auth/react";

import { triggerAdminStepUp } from "~/modules/admin/access";
import {
	MATOMO_ACTION,
	MATOMO_EVENT_CATEGORY,
	trackEvent,
} from "~/modules/analytics";
import { NewTabNotice } from "~/modules/layout/shared/NewTabNotice";
import { MY_SPACE } from "~/modules/routes";
import styles from "./ProConnectButton.module.scss";

type Props = {
	callbackUrl?: string;
	// Set by the login form when the validated destination targets the
	// backoffice: the request must then carry the admin step-up requirement
	// from this very first sign-in, so an eligible agent never has to pass
	// through ProConnect a second time on the resume screen.
	requiresAdminStepUp?: boolean;
};

/** ProConnect authentication button with official branding and info link. */
export function ProConnectButton({ callbackUrl, requiresAdminStepUp }: Props) {
	function handleLogin(): void {
		trackEvent({
			category: MATOMO_EVENT_CATEGORY.AUTH,
			action: MATOMO_ACTION.LOGIN_START,
		});
		const resolvedCallbackUrl = callbackUrl ?? MY_SPACE;
		if (requiresAdminStepUp) {
			triggerAdminStepUp(resolvedCallbackUrl);
			return;
		}
		void signIn("proconnect", { callbackUrl: resolvedCallbackUrl });
	}

	return (
		<div className={`fr-connect-group ${styles.proConnectGroup}`}>
			<button
				className="fr-connect fr-connect--proconnect"
				onClick={handleLogin}
				type="button"
			>
				<span className="fr-connect__login">S'identifier avec</span>
				<span className="fr-connect__brand">ProConnect</span>
			</button>
			<p>
				<a
					href="https://www.proconnect.gouv.fr/"
					rel="noopener"
					target="_blank"
				>
					Qu'est-ce que ProConnect ?
					<NewTabNotice />
				</a>
			</p>
		</div>
	);
}
