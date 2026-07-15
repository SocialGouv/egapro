"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";

import { getDsfrModal } from "~/modules/shared";
import styles from "./MobileUserBlock.module.scss";

/** Frames to wait for the DSFR focus trap before focusing the name anyway. */
const FOCUS_TRAP_MAX_FRAMES = 30;

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
	const userNameRef = useRef<HTMLParagraphElement>(null);

	const openProfileModal = useCallback(() => {
		const profile = document.getElementById("profile-modal");
		if (profile) getDsfrModal(profile)?.disclose();
	}, []);

	// RGAA 12.8: when the mobile menu opens, the DSFR focus trap moves focus to
	// the first interactive element (the "Fermer" button). The expected target
	// is the first *content* element instead: the user name. Wait for the trap
	// to settle (it polls with requestAnimationFrame until the modal is
	// focusable), then re-target the focus onto the name. Closing the menu is
	// untouched: DSFR gives focus back to the burger button natively.
	useEffect(() => {
		const menuModal = document.getElementById("modal-menu");
		if (!menuModal) return;

		let frame: number | null = null;

		const cancelPendingFocus = () => {
			if (frame !== null) window.cancelAnimationFrame(frame);
			frame = null;
		};

		const handleDisclose = () => {
			let attemptsLeft = FOCUS_TRAP_MAX_FRAMES;
			const settle = () => {
				const trapSettled = menuModal.contains(document.activeElement);
				if (trapSettled || attemptsLeft <= 0) {
					frame = null;
					userNameRef.current?.focus();
					return;
				}
				attemptsLeft -= 1;
				frame = window.requestAnimationFrame(settle);
			};
			frame = window.requestAnimationFrame(settle);
		};

		menuModal.addEventListener("dsfr.disclose", handleDisclose);
		menuModal.addEventListener("dsfr.conceal", cancelPendingFocus);
		return () => {
			menuModal.removeEventListener("dsfr.disclose", handleDisclose);
			menuModal.removeEventListener("dsfr.conceal", cancelPendingFocus);
			cancelPendingFocus();
		};
	}, []);

	return (
		<div className={styles.wrapper}>
			<div className={styles.userInfo}>
				<p className={styles.userName} ref={userNameRef} tabIndex={-1}>
					{userName}
				</p>
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
