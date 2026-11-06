import {
	ADMIN,
	CSE_OPINION,
	DECLARATION_REMUNERATION,
	DECLARATION_REPRESENTATION,
	MY_SPACE,
} from "~/modules/routes";

// Segment-boundary match: a sibling route merely starting with the same characters (e.g. `/administrator` for root `/admin`) must not match.
function isUnderRoute(pathname: string | null, root: string): boolean {
	return (
		pathname !== null && (pathname === root || pathname.startsWith(`${root}/`))
	);
}

/**
 * Returns true for the `/admin` root and every nested `/admin/**` route.
 *
 * Shared by `PublicChrome` (which renders no footer on those routes) and
 * `SkipLinks` (which hides the "Pied de page" skip link there so it never
 * points to a missing anchor — RGAA 12.7).
 */
export function isAdminRoute(pathname: string | null): boolean {
	return isUnderRoute(pathname, ADMIN);
}

// Path-based, not session-based: these journeys already redirect anonymous visitors to login, and gating on session would also hide the menu on help/FAQ/legal pages reached from within them.
export function isDemarcheRoute(pathname: string | null): boolean {
	return (
		isUnderRoute(pathname, MY_SPACE) ||
		isUnderRoute(pathname, DECLARATION_REMUNERATION) ||
		isUnderRoute(pathname, DECLARATION_REPRESENTATION) ||
		isUnderRoute(pathname, CSE_OPINION)
	);
}
