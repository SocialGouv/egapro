"use client";

import Link from "next/link";
import { useCallback } from "react";

import { getDsfrModal } from "~/modules/shared";
import styles from "./MobileUserBlock.module.scss";

type Props = {
	userName: string;
	userEmail: string;
	userPhone?: string;
};

/**
 * Inline user block for the mobile header modal: shows the user info and the
 * profile / logout actions directly, without the desktop dropdown intermediate.
 *
 * Lives as a sibling of `.fr-header__menu-links` inside `#modal-menu` so that
 * DSFR's `HeaderLinks` script does not touch it (it only inspects the
 * `.fr-header__menu-links` container).
 */
export function MobileUserBlock({ userName, userEmail, userPhone }: Props) {
	const openProfileModal = useCallback(() => {
		const profile = document.getElementById("profile-modal");
		if (profile) getDsfrModal(profile)?.disclose();
	}, []);

	return (
		<div className={styles.wrapper}>
			<div className={styles.userInfo}>
				<p className={styles.userName}>{userName}</p>
				<p className={styles.userMeta}>{userEmail}</p>
				{userPhone && <p className={styles.userMeta}>{userPhone}</p>}
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
					    (ProConnect), so a full browser navigation is needed. */}
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
