import type { Route } from "next";
import { LOGIN, MY_SPACE } from "./accountRoutes";
import { ADMIN } from "./adminRoutes";
import { CSE_OPINION } from "./complianceRoutes";
import { DECLARATION_REMUNERATION } from "./declarationRoutes";
import { route, unroutedPath } from "./routeContract";

export const HOME = route("/");
export const HELP = route("/aide");
export const CONTACT = route("/aide/nous-contacter");
export const FAQ = route("/faq");
export const REFERENTS = route("/referents");
export const OBSERVATORY_SEARCH = route("/index-egapro/recherche");
export const SITE_MAP = route("/plan-du-site");
export const LEGAL_NOTICE = route("/mentions-legales");
export const PRIVACY = route("/donnees-personnelles");
export const COOKIES = route("/gestion-des-cookies");
export const ACCESSIBILITY = route("/declaration-accessibilite");
export const MAINTENANCE = route("/maintenance");

// Internal harness, never linked from the site chrome.
export const TEST_ERROR = route("/test-error");

export function referentHref(id: string) {
	return route(`/referents/${id}` as const);
}

export function observatoryCompanyHref(siren: string) {
	return route(`/index-egapro/entreprise/${siren}` as const);
}

type PublicPageGroup = "main" | "legal";

type ChangeFrequency =
	| "always"
	| "hourly"
	| "daily"
	| "weekly"
	| "monthly"
	| "yearly"
	| "never";

export type PublicPage = {
	path: Route<string>;
	// Wording shown on `/plan-du-site`.
	label: string;
	group: PublicPageGroup;
	// `/login` belongs on the site map for humans but is disallowed to crawlers,
	// so both surfaces read this one inventory and filter it rather than keeping
	// two lists that disagree.
	indexable: boolean;
	changeFrequency: ChangeFrequency;
	priority: number;
};

// Every page a visitor can reach without signing in. Authenticated areas, the
// declaration funnels and the internal harness are excluded on purpose.
// `/stats` is absent because #4342 deleted that page — listing it would publish
// a 404 into `sitemap.xml`.
export const PUBLIC_PAGES: readonly PublicPage[] = [
	{
		path: HOME,
		label: "Accueil",
		group: "main",
		indexable: true,
		changeFrequency: "monthly",
		priority: 1,
	},
	{
		path: HELP,
		label: "Aide et ressources",
		group: "main",
		indexable: true,
		changeFrequency: "monthly",
		priority: 0.8,
	},
	{
		path: CONTACT,
		label: "Nous contacter",
		group: "main",
		indexable: true,
		changeFrequency: "yearly",
		priority: 0.5,
	},
	{
		path: FAQ,
		label: "Questions fréquentes (FAQ)",
		group: "main",
		indexable: true,
		changeFrequency: "monthly",
		priority: 0.8,
	},
	{
		path: REFERENTS,
		label: "Référents égalité professionnelle",
		group: "main",
		indexable: true,
		changeFrequency: "monthly",
		priority: 0.7,
	},
	{
		path: OBSERVATORY_SEARCH,
		label: "Rechercher une entreprise",
		group: "main",
		indexable: true,
		changeFrequency: "daily",
		priority: 0.9,
	},
	{
		path: LOGIN,
		label: "Connexion",
		group: "main",
		indexable: false,
		changeFrequency: "yearly",
		priority: 0.3,
	},
	{
		path: LEGAL_NOTICE,
		label: "Mentions légales",
		group: "legal",
		indexable: true,
		changeFrequency: "yearly",
		priority: 0.3,
	},
	{
		path: PRIVACY,
		label: "Données personnelles",
		group: "legal",
		indexable: true,
		changeFrequency: "yearly",
		priority: 0.3,
	},
	{
		path: COOKIES,
		label: "Gestion des cookies",
		group: "legal",
		indexable: true,
		changeFrequency: "yearly",
		priority: 0.3,
	},
	{
		path: ACCESSIBILITY,
		label: "Déclaration d'accessibilité",
		group: "legal",
		indexable: true,
		changeFrequency: "yearly",
		priority: 0.3,
	},
	{
		path: SITE_MAP,
		label: "Plan du site",
		group: "legal",
		indexable: true,
		changeFrequency: "yearly",
		priority: 0.3,
	},
];

export function getPublicPages(group: PublicPageGroup): readonly PublicPage[] {
	return PUBLIC_PAGES.filter((page) => page.group === group);
}

export function getIndexablePublicPages(): readonly PublicPage[] {
	return PUBLIC_PAGES.filter((page) => page.indexable);
}

// `Disallow` rules of `robots.txt`. Prefixes covering whole subtrees, so they
// are paths rather than routes.
export const CRAWLER_DISALLOWED_PREFIXES = [
	unroutedPath("/api/"),
	`${ADMIN}/`,
	`${MY_SPACE}/`,
	`${DECLARATION_REMUNERATION}/`,
	`${CSE_OPINION}/`,
	LOGIN,
	MAINTENANCE,
	unroutedPath("/test-"),
] as const;
