import Link from "next/link";

/** Brand block: Marianne logo, service name and tagline. */
export function HeaderBrand() {
	return (
		<div className="fr-header__brand fr-enlarge-link">
			<div className="fr-header__brand-top">
				<div className="fr-header__logo">
					<p className="fr-logo">
						Ministère
						<br />
						du travail
						<br />
						et des solidarités
					</p>
				</div>
				{/* RGAA 9.2: mobile counterpart of the desktop quick-access <nav>
				    (`.fr-header__tools-links` in HeaderQuickAccess). The two share
				    the same accessible name because only one is displayed per
				    breakpoint (DSFR hides the navbar on desktop and the tools bar
				    on mobile). */}
				<nav aria-label="Accès rapides" className="fr-header__navbar">
					<button
						aria-controls="modal-menu"
						aria-haspopup="dialog"
						className="fr-btn--menu fr-btn"
						data-fr-opened="false"
						id="fr-btn-menu-mobile"
						type="button"
					>
						Menu
					</button>
				</nav>
			</div>
			<div className="fr-header__service">
				<Link
					href="/"
					title="Accueil - Egapro - Ministère du Travail et des Solidarités"
				>
					<p className="fr-header__service-title">Egapro</p>
				</Link>
				<p className="fr-header__service-tagline">
					Indicateurs d'égalité professionnelle femmes‑hommes
				</p>
			</div>
		</div>
	);
}
