/**
 * Returns true for the `/admin` root and every nested `/admin/**` route.
 * Matches the `/admin` segment boundary so hypothetical sibling routes like
 * `/administrator` or `/admin-tools` keep the public chrome.
 *
 * Shared by `PublicChrome` (which renders no footer on those routes) and
 * `SkipLinks` (which hides the "Pied de page" skip link there so it never
 * points to a missing anchor — RGAA 12.7).
 */
export function isAdminRoute(pathname: string | null): boolean {
	return (
		pathname !== null &&
		(pathname === "/admin" || pathname.startsWith("/admin/"))
	);
}
