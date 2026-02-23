import Link from "next/link";

/** Brand block: Marianne logo, service name and tagline. */
export function HeaderBrand() {
	return (
		<div className="fr-header__brand fr-enlarge-link">
			<div className="fr-header__brand-top">
				<div className="fr-header__logo">
					<p className="fr-logo">
						Ministry
						<br />
						of labour
						<br />
						and solidarity
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
					title="Home - Egapro - Ministry of Labour and Solidarity"
				>
					<p className="fr-header__service-title">Egapro</p>
				</Link>
				<p className="fr-header__service-tagline">
					Professional equality indicators women‑men
				</p>
			</div>
		</div>
	);
}
