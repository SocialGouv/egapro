"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { getDsfrModal } from "~/modules/shared";
import styles from "./UserAccountMenu.module.scss";

interface UserAccountMenuProps {
	userName: string;
	userEmail: string;
	userPhone?: string;
	isAdmin?: boolean;
}

/** Dropdown menu in the header for authenticated users. */
export function UserAccountMenu({
	userName,
	userEmail,
	userPhone,
	isAdmin,
}: UserAccountMenuProps) {
	const [isOpen, setIsOpen] = useState(false);
	const wrapperRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const menuRef = useRef<HTMLDivElement>(null);

	const close = useCallback(() => {
		setIsOpen(false);
		buttonRef.current?.focus();
	}, []);

	const openProfileModal = useCallback(() => {
		close();
		const modal = document.getElementById("profile-modal");
		if (modal) getDsfrModal(modal)?.disclose();
	}, [close]);

	const getMenuItems = useCallback(
		() =>
			Array.from(
				menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ??
					[],
			),
		[],
	);

	useEffect(() => {
		if (!isOpen) return;

		// Focus the first menu item when the dropdown opens
		getMenuItems()[0]?.focus();

		function handleClickOutside(event: MouseEvent) {
			if (
				wrapperRef.current &&
				!wrapperRef.current.contains(event.target as Node)
			) {
				close();
			}
		}

		function handleKeyDown(event: KeyboardEvent) {
			switch (event.key) {
				case "Escape":
					close();
					break;
				case "Tab":
					// APG menu pattern: Tab dismisses the menu. Focus is handed back
					// to the toggle button (via close) instead of letting the default
					// move happen inside a menu that is about to unmount.
					event.preventDefault();
					close();
					break;
				case "ArrowDown": {
					event.preventDefault();
					const items = getMenuItems();
					const idx = items.indexOf(document.activeElement as HTMLElement);
					items[(idx + 1) % items.length]?.focus();
					break;
				}
				case "ArrowUp": {
					event.preventDefault();
					const items = getMenuItems();
					const idx = items.indexOf(document.activeElement as HTMLElement);
					items[(idx - 1 + items.length) % items.length]?.focus();
					break;
				}
				case "Home":
					event.preventDefault();
					getMenuItems()[0]?.focus();
					break;
				case "End": {
					event.preventDefault();
					const items = getMenuItems();
					items[items.length - 1]?.focus();
					break;
				}
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen, close, getMenuItems]);

	return (
		<div className={styles.wrapper} ref={wrapperRef}>
			<button
				aria-expanded={isOpen}
				aria-haspopup="menu"
				className="fr-btn fr-btn--tertiary fr-icon-account-circle-line fr-btn--icon-left"
				id="user-account-menu-button"
				onClick={() => setIsOpen((prev) => !prev)}
				ref={buttonRef}
				type="button"
			>
				Mon espace
			</button>

			{isOpen && (
				<div className={styles.dropdown} ref={menuRef}>
					{/* The user info block sits outside the role="menu" element: a menu
					    may only own menuitem/group/separator children, and static text
					    would be skipped by screen readers in menu navigation mode. */}
					<div className={styles.userInfo}>
						<p className={styles.userName}>{userName}</p>
						<p className={styles.userEmail}>{userEmail}</p>
						{userPhone && <p className={styles.userEmail}>{userPhone}</p>}
					</div>

					{/* The two inner divs stay role-less: generic containers are
					    ownership-transparent, so the menuitems remain owned by the
					    menu (verified against axe aria-required-children). */}
					<div
						aria-labelledby="user-account-menu-button"
						className={styles.menu}
						role="menu"
					>
						<div className={styles.links}>
							{isAdmin && (
								<Link
									className={styles.menuLink}
									href="/admin"
									onClick={close}
									role="menuitem"
									tabIndex={-1}
								>
									Administration
								</Link>
							)}
							<Link
								className={styles.menuLink}
								href="/mon-espace/mes-entreprises"
								onClick={close}
								role="menuitem"
								tabIndex={-1}
							>
								Mes entreprises
							</Link>
							<button
								className={styles.menuLink}
								onClick={openProfileModal}
								role="menuitem"
								tabIndex={-1}
								type="button"
							>
								Voir mon profil
							</button>
						</div>

						<div className={styles.logout}>
							{/* Native <a> required: this route redirects to an external IdP (ProConnect),
							    so we need a full browser navigation, not a client-side RSC fetch. */}
							<a
								className={styles.logoutLink}
								href="/api/auth/logout"
								role="menuitem"
								tabIndex={-1}
							>
								<span
									aria-hidden="true"
									className="fr-icon-logout-box-r-line"
								/>
								Se déconnecter
							</a>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
