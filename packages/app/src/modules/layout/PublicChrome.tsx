"use client";

import { usePathname } from "next/navigation";

import { Footer } from "./Footer";
import { ResourceBanner } from "./ResourceBanner";
import { isAdminRoute } from "./shared/routeUtils";

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
