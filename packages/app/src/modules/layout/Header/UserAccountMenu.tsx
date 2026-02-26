"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

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
	const buttonRef = useRef<HTMLButtonElement>(null);
	const firstItemRef = useRef<HTMLButtonElement>(null);

	const close = useCallback(() => {
		setIsOpen(false);
		buttonRef.current?.focus();
	}, []);

	useEffect(() => {
		if (!isOpen) return;

		// Focus the first menu item when the dropdown opens
		firstItemRef.current?.focus();

		function handleClickOutside(event: MouseEvent) {
			if (
				wrapperRef.current &&
				!wrapperRef.current.contains(event.target as Node)
			) {
				close();
			}
		}

		function handleEscape(event: KeyboardEvent) {
			if (event.key === "Escape") {
				close();
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", handleEscape);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleEscape);
		};
	}, [isOpen, close]);

	return (
		<div className={styles.wrapper} ref={wrapperRef}>
			<button
				aria-expanded={isOpen}
				aria-haspopup="menu"
				className="fr-btn fr-btn--tertiary-no-outline fr-icon-account-circle-line fr-btn--icon-left"
				onClick={() => setIsOpen((prev) => !prev)}
				ref={buttonRef}
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
						<button
							className={styles.menuLink}
							onClick={close}
							ref={firstItemRef}
							role="menuitem"
							type="button"
						>
							Mes entreprises
						</button>
						<button
							className={styles.menuLink}
							onClick={close}
							role="menuitem"
							type="button"
						>
							Voir mon profil
						</button>
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
