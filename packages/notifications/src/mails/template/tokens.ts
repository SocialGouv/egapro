// DSFR design tokens for transactional emails.
//
// Extracted from the Figma source of truth
// (https://www.figma.com/design/axsrSDEVqsrFvHdWrZJIkQ/-Refonte--Egapro?node-id=9564-114784).
//
// Email clients do not load the DSFR CSS, so every token below is **inlined**
// directly into HTML via React Email's `style` props. Keep values literal
// (hex / px / numeric line-height) — never reference CSS custom properties
// or Tailwind classes, they will not resolve in Outlook / Gmail.

export const COLORS = {
	blueFrance: "#000091",
	blueFranceActive: "#1212ff",
	mariannRed: "#E0000F",
	mariannBlue: "#00008F",
	textTitle: "#161616",
	textDefault: "#161616",
	textGrey: "#3A3A3A",
	textMention: "#666666",
	border: "#DDDDDD",
	bgWhite: "#FFFFFF",
	bgAltBlueFrance: "#F5F5FE",
	bgAltGrey: "#F6F6F6",
	topBar: "#D8D8D8",
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
	},
	lineHeight: {
		xs: "20px",
		sm: "24px",
		body: "24px",
		bodyMd: "28px",
		h5: "28px",
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

export const LAYOUT = {
	contentWidth: 600,
	innerPaddingX: 52,
	innerPaddingY: 32,
	headerPaddingX: 64,
	headerPaddingY: 24,
} as const;

export const RADIUS = {
	none: 0,
	sm: 4,
} as const;

export const BORDER = {
	thin: `1px solid ${COLORS.border}`,
} as const;

// Bloc-marque DSFR: 3 horizontal lines for the ministry name and 3 for the
// devise. Email clients render each line as a separate <div> for layout
// stability across Outlook / Gmail / Apple Mail.
export const BRAND = {
	ministryLines: ["Ministère", "du travail", "et des solidarités"] as const,
	deviseLines: ["Liberté", "Égalité", "Fraternité"] as const,
	directionName: "Direction Générale du Travail",
	serviceTitle: "Egapro",
	serviceBaseline: "Indicateurs d'égalité professionnelle femmes-hommes",
	signerName: "Le ministère chargé du travail",
} as const;
