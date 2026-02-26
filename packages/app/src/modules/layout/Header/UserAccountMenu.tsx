"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import styles from "./UserAccountMenu.module.scss";

interface UserAccountMenuProps {
	userName: string;
	userEmail: string;
	userPhone?: string;
}

/** Dropdown menu in the header for authenticated users. */
export function UserAccountMenu({
	userName,
	userEmail,
	userPhone,
}: UserAccountMenuProps) {
	const [isOpen, setIsOpen] = useState(false);
	const wrapperRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!isOpen) return;

		function handleClickOutside(event: MouseEvent) {
			if (
				wrapperRef.current &&
				!wrapperRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		}

		function handleEscape(event: KeyboardEvent) {
			if (event.key === "Escape") {
				setIsOpen(false);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", handleEscape);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleEscape);
		};
	}, [isOpen]);

	return (
		<div className={styles.wrapper} ref={wrapperRef}>
			<button
				aria-expanded={isOpen}
				aria-haspopup="menu"
				className="fr-btn fr-btn--tertiary-no-outline fr-icon-account-circle-line fr-btn--icon-left"
				onClick={() => setIsOpen((prev) => !prev)}
				type="button"
			>
				Mon espace
			</button>

			{isOpen && (
				<div className={styles.dropdown} role="menu">
					<div className={styles.userInfo}>
						<p className={styles.userName}>{userName}</p>
						<p className={styles.userEmail}>{userEmail}</p>
						{userPhone && <p className={styles.userEmail}>{userPhone}</p>}
					</div>

					<div className={styles.links}>
						<Link
							className={styles.menuLink}
							href="#"
							onClick={() => setIsOpen(false)}
							role="menuitem"
						>
							Mes entreprises
						</Link>
						<Link
							className={styles.menuLink}
							href="#"
							onClick={() => setIsOpen(false)}
							role="menuitem"
						>
							Voir mon profil
						</Link>
					</div>

					<div className={styles.logout}>
						<Link
							className={styles.logoutLink}
							href="/api/auth/signout"
							role="menuitem"
						>
							<span aria-hidden="true" className="fr-icon-logout-box-r-line" />
							Se déconnecter
						</Link>
					</div>
				</div>
			)}
		</div>
	);
}
