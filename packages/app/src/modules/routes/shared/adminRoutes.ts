import { route } from "./routeContract";

export const ADMIN = route("/admin");
export const ADMIN_DECLARATIONS = route("/admin/declarations");
export const ADMIN_IMPERSONATE = route("/admin/impersonate");
export const ADMIN_REFERENTS = route("/admin/liste-referents");
export const ADMIN_STATS = route("/admin/stats");
export const ADMIN_SETTINGS = route("/admin/parametres");

// Redirected to `/admin/stats` by `next.config.js`: reachable without having a
// `page.tsx` of their own.
export const ADMIN_STATS_CAMPAIGN = route("/admin/stats/campagne");
export const ADMIN_STATS_PLATFORM = route("/admin/stats/plateforme");

export function adminDeclarationHref(declarationId: string) {
	return route(`/admin/declarations/${declarationId}` as const);
}

// The side menu, in display order. One inventory, so a page added under
// `src/app/admin/` is either reachable from it or deliberately not.
export const ADMIN_NAV_LINKS = [
	{ href: ADMIN, label: "Accueil" },
	{ href: ADMIN_DECLARATIONS, label: "Déclarations" },
	{ href: ADMIN_IMPERSONATE, label: "Mimoquer un Siren" },
	{ href: ADMIN_REFERENTS, label: "Référents" },
	{ href: ADMIN_STATS, label: "Statistiques" },
	{ href: ADMIN_SETTINGS, label: "Paramètres" },
] as const;
