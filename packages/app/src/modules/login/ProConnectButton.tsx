"use client";

import { signIn } from "next-auth/react";

import {
	MATOMO_ACTION,
	MATOMO_EVENT_CATEGORY,
	trackEvent,
} from "~/modules/analytics";
import { NewTabNotice } from "~/modules/layout/shared/NewTabNotice";

import styles from "./ProConnectButton.module.scss";

/** ProConnect authentication button with official branding and info link. */
export function ProConnectButton() {
	function handleLogin(): void {
		trackEvent({
			category: MATOMO_EVENT_CATEGORY.AUTH,
			action: MATOMO_ACTION.LOGIN_START,
		});
		void signIn("proconnect");
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
					title="Qu'est-ce que ProConnect ? - nouvelle fenêtre"
				>
					Qu'est-ce que ProConnect ?
					<NewTabNotice />
				</a>
			</p>
		</div>
	);
}
