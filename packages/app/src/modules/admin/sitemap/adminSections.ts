import {
	ADMIN,
	ADMIN_DECLARATIONS,
	ADMIN_IMPERSONATE,
	ADMIN_NAV_LINKS,
	ADMIN_REFERENTS,
	ADMIN_SETTINGS,
	ADMIN_STATS,
} from "~/modules/routes";

type AdminSectionHref = (typeof ADMIN_NAV_LINKS)[number]["href"];

export type AdminSection = {
	href: AdminSectionHref;
	label: string;
	description: string;
};

// Keyed by the side-menu inventory: a section added there without a
// description here fails to compile instead of vanishing from the plan.
const ADMIN_SECTION_DESCRIPTIONS: Record<AdminSectionHref, string> = {
	[ADMIN]: "Accueil du back-office et compte administrateur connecté.",
	[ADMIN_DECLARATIONS]:
		"Rechercher les déclarations, puis ouvrir le détail de chacune.",
	[ADMIN_IMPERSONATE]:
		"Accéder au tableau de bord et aux déclarations d’une entreprise à partir de son Siren.",
	[ADMIN_REFERENTS]: "Consulter, ajouter et importer les référents Egapro.",
	[ADMIN_STATS]:
		"Suivre la campagne, la complétion des parcours et l’usage de la plateforme.",
	[ADMIN_SETTINGS]:
		"Éditer les variables globales qui encadrent les campagnes de déclaration.",
};

export const ADMIN_SECTIONS: readonly AdminSection[] = ADMIN_NAV_LINKS.map(
	({ href, label }) => ({
		href,
		label,
		description: ADMIN_SECTION_DESCRIPTIONS[href],
	}),
);
