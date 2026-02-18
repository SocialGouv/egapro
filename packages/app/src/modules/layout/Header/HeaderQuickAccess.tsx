import Link from "next/link";

/** Accès rapide desktop : bouton "Se connecter". */
export function HeaderQuickAccess() {
	return (
		<div className="fr-header__tools">
			<div className="fr-header__tools-links">
				<ul className="fr-btns-group">
					<li>
						<Link className="fr-btn fr-icon-account-circle-line" href="/login">
							Se connecter
						</Link>
					</li>
				</ul>
			</div>
		</div>
	);
}
