// Email clients do not load the DSFR CSS bundle, so every token below is
// inlined directly into HTML via React Email `style` props. Keep values literal
// (hex / px / numeric line-height) — CSS custom properties and Tailwind classes
// do not resolve in Outlook / Gmail.

export const COLORS = {
	blueFrance: "#000091",
	blueFranceActive: "#1212ff",
	textTitle: "#161616",
	textDefault: "#161616",
	textGrey: "#3A3A3A",
	textMention: "#666666",
	footerGrey: "#6b6b6b",
	border: "#DDDDDD",
	frameBorder: "#e5e5e5",
	bgWhite: "#FFFFFF",
	bgAltBlueFrance: "#F5F5FE",
	bgIllustration: "#ECECFE",
	successText: "#18753c",
} as const;

export const FONT = {
	family: "Marianne, Arial, Helvetica, sans-serif",
	monoFamily: "Menlo, Consolas, Courier New, monospace",
	weight: {
		regular: 400,
		medium: 500,
		bold: 700,
	},
	size: {
		xs: 12,
		sm: 14,
		body: 16,
		bodyMd: 18,
		h5: 22,
		title: 24,
	},
	lineHeight: {
		xs: "20px",
		sm: "24px",
		body: "24px",
		bodyMd: "28px",
		h5: "28px",
		cta: "21px",
		title: "32px",
	},
} as const;

export const SPACING = {
	xs: 4,
	sm: 8,
	md: 16,
	lg: 24,
	xl: 32,
	xxl: 52,
	max: 64,
} as const;

// DSFR frame: each module re-opens a 620 (gradient) → 600 (side-bordered) → 496
// (inner) nested-table structure. Widths are fixed px (no responsive in mail).
export const LAYOUT = {
	frameOuterWidth: 620,
	frameWidth: 600,
	frameInnerWidth: 496,
	frameGradient:
		"linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(234,234,234,1) 5%, rgba(234,234,234,1) 95%, rgba(255,255,255,1) 100%)",
	marianneLogoWidth: 76,
	illustrationTitleWidth: 331,
	illustrationImageWidth: 160,
} as const;

export const RADIUS = {
	none: 0,
	sm: 4,
} as const;

export const BORDER = {
	thin: `1px solid ${COLORS.border}`,
} as const;

// DSFR button geometry: a fixed 32px-tall cell with 16px horizontal padding.
export const BUTTON = {
	height: 32,
	paddingX: 16,
} as const;

export const BRAND = {
	marianneAlt: "République française",
	ministryLines: ["Ministère", "du travail", "et des solidarités"],
	deviseLines: ["Liberté", "Égalité", "Fraternité"],
	directionLines: ["Direction Générale", "du Travail"],
	serviceTitle: "Egapro",
	illustrationAlt: "Index de l'égalité professionnelle femmes-hommes",
	signerName: "Le ministère chargé du travail",
} as const;
