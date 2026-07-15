"use client";

import { usePathname } from "next/navigation";

import { Footer } from "./Footer";
import { ResourceBanner } from "./ResourceBanner";

/**
 * Backoffice routes render no public chrome — hence no footer landmark.
 * Matches the `/admin` segment boundary so hypothetical sibling routes like
 * `/administrator` or `/admin-tools` keep the public chrome. Shared with
 * `SkipLinks`, which hides the "Pied de page" skip link on those routes
 * (RGAA 12.7: a skip link must not point to a missing anchor).
 */
export function isAdminRoute(pathname: string | null): boolean {
	return pathname === "/admin" || Boolean(pathname?.startsWith("/admin/"));
}

/**
 * Renders the public help banner + footer on every route except the backoffice.
 * Admin pages (`/admin/**`) get a stripped-down chrome so the sidebar + admin
 * content fill the viewport without competing with public navigation.
 * The login page keeps the footer but hides the help banner per Figma spec.
 */
export function PublicChrome() {
	const pathname = usePathname();
	if (isAdminRoute(pathname)) {
		return null;
	}
	const showResourceBanner = pathname !== "/login";
	return (
		<>
			{showResourceBanner && <ResourceBanner />}
			<Footer />
		</>
	);
}
