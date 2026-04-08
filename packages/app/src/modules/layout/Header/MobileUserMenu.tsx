"use client";

import Link from "next/link";
import { useCallback } from "react";

import { getDsfrModal } from "~/modules/shared";
import styles from "./MobileUserMenu.module.scss";

interface MobileUserMenuProps {
	userName: string;
	userEmail: string;
	userPhone?: string;
}

/**
 * Inline account block for the mobile header modal: shows user info plus
 * profile and logout actions. Replaces the desktop dropdown, which cannot
 * render correctly inside the modal.
 */
export function MobileUserMenu({
	userName,
	userEmail,
	userPhone,
}: MobileUserMenuProps) {
	const openProfileModal = useCallback(() => {
		// Close the mobile menu modal first so the profile modal is not stacked.
		const menu = document.getElementById("modal-menu");
		if (menu) getDsfrModal(menu)?.conceal();
		const profile = document.getElementById("profile-modal");
		if (profile) getDsfrModal(profile)?.disclose();
	}, []);

	return (
		<div className={styles.wrapper}>
			<div className={styles.userInfo}>
				<p className={styles.userName}>{userName}</p>
				<p className={styles.userEmail}>{userEmail}</p>
				{userPhone && <p className={styles.userEmail}>{userPhone}</p>}
			</div>
			<ul className="fr-btns-group">
				<li>
					<Link
						className="fr-btn fr-btn--tertiary-no-outline fr-icon-building-line fr-btn--icon-left"
						href="/mon-espace/mes-entreprises"
					>
						Mes entreprises
					</Link>
				</li>
				<li>
					<button
						className="fr-btn fr-btn--tertiary-no-outline fr-icon-account-circle-line fr-btn--icon-left"
						onClick={openProfileModal}
						type="button"
					>
						Voir mon profil
					</button>
				</li>
				<li>
					{/* Native <a> required: this route redirects to an external IdP
					    (ProConnect), so we need a full browser navigation, not a
					    client-side RSC fetch. */}
					<a
						className="fr-btn fr-btn--secondary fr-icon-logout-box-r-line fr-btn--icon-left"
						href="/api/auth/logout"
					>
						Se déconnecter
					</a>
				</li>
			</ul>
		</div>
	);
}
