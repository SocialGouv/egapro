import Link from "next/link";

/** Bloc marque : logo Marianne, nom de service et tagline. */
export function HeaderBrand() {
	return (
		<div className="fr-header__brand fr-enlarge-link">
			<div className="fr-header__brand-top">
				<div className="fr-header__logo">
					<p className="fr-logo">
						Ministère
						<br />
						du travail,
						<br />
						et de l'emploi
					</p>
				</div>
				<div className="fr-header__navbar">
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
				</div>
			</div>
			<div className="fr-header__service">
				<Link
					href="/"
					title="Accueil - Egapro - Ministère du Travail, de l'Emploi et de l'Insertion"
				>
					<p className="fr-header__service-title">Egapro</p>
				</Link>
				<p className="fr-header__service-tagline">
					Index de l'égalité professionnelle et représentation équilibrée
					femmes‑hommes
				</p>
			</div>
		</div>
	);
}
