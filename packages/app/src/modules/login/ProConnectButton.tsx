import { NewTabNotice } from "~/modules/layout";

/** ProConnect authentication button with official branding and info link. */
export function ProConnectButton() {
	return (
		<div className="fr-connect-group">
			<style>
				{
					".fr-connect--proconnect::before { background-image: url(/img/proconnect-logo.svg); }"
				}
			</style>
			<a
				className="fr-connect fr-connect--proconnect"
				href="/api/auth/signin/proconnect"
			>
				<span className="fr-connect__login">S'identifier avec</span>
				<span className="fr-connect__brand">ProConnect</span>
			</a>
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
