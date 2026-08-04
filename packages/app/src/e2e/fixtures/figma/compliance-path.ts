import type { FidelitySpec } from "~/e2e/helpers/figma-fidelity";

// Selectors are scoped per card on purpose: an index-based selector silently
// rebinds to the next card when an optional element (the "En savoir plus" link,
// the CSE bullet list) is absent, and then measures a gap across two cards.
const card = (n: number) => `main fieldset.fr-fieldset > div:nth-of-type(${n})`;
const cardRoot = (n: number) => `${card(n)} > div`;
const radioRow = (n: number) => `${cardRoot(n)} > div:nth-of-type(1)`;
const cardBody = (n: number) => `${cardRoot(n)} > div:nth-of-type(2)`;

// EL-d02af263 — every Recap card carries the same frame.
const CARD_FRAME = {
	border: { width: 1, color: "#DDDDDD" as const, radius: 4 },
	padding: [16, 16, 16, 16] as [number, number, number, number],
};

// 1.Titres/H6 - XXS/Desktop in $artwork-major-blue-france.
const RADIO_LABEL_TYPE = {
	font: { size: 20, weight: 700, lineHeight: 28 },
	color: "#000091" as const,
};

// Divergences assumées, relevées sur le node et volontairement non assertées :
// - largeur de colonne : le Figma fixe 790px, la grille DSFR (`fr-col-lg-8`) en
//   dérive 800px au-delà de 1248px de viewport — la grille fait autorité.
// - apostrophes : le node utilise U+2019, l'app rend `&apos;` (U+0027) partout.
//   Convention applicative, pas un écart propre à cet écran.
// - libellés des deux titres de section : le Figma écrit « et non fondée sur le
//   sexes » (fautif) ; l'app rend « et non sexistes ».
// - retrait droit interne de 28px de « Indicator Value » (EL-50e4539c) : hors
//   échelle DSFR (28 n'est pas un multiple de 4), traité comme approximation.
// - « Enregistré » (SavedIndicator) : ne s'affiche qu'avec un brouillon, donc
//   absent de l'état E2E qui rejoue le contrat.
export const compliancePathFidelity: FidelitySpec = {
	screen: "declaration-remuneration/parcours-conformite",
	figma: {
		file: "axsrSDEVqsrFvHdWrZJIkQ",
		node: "9908-275757",
		frame: "D/Choix du parcours de mise en conformité - Avec CSE",
		capturedAt: "2026-08-04",
	},

	elements: {
		// Anchored on the row, not on the h1: the row is `align-items: center`, so
		// a taller status badge would re-centre the heading and drift the gap.
		titleRow: { selector: "main form > fieldset > div:has(h1)" },
		title: {
			selector: "main form h1",
			font: { size: 24, weight: 700, lineHeight: 32 },
			color: "#161616",
		},

		banner: {
			selector: "main .fr-background-alt--blue-france",
			padding: [32, 32, 32, 32],
		},
		bannerTitle: {
			selector: "main .fr-background-alt--blue-france p.fr-text--lg",
			font: { size: 18, weight: 700, lineHeight: 28 },
			color: "#161616",
		},
		// Structural rather than `.fr-border-default--grey`: naming the utility in
		// the selector would make the border assertion true by construction.
		// Figma "Lien / Lien de téléchargement" : le lien puis, 4px dessous, la
		// mention de format — frère de l'ancre, pas enfant.
		downloadLink: {
			selector: "main a.fr-link--icon-right",
			font: { size: 16, weight: 400, lineHeight: 24 },
			color: "#000091",
		},
		downloadMention: {
			selector: 'main [class*="download"] > p:last-child',
			font: { size: 12, weight: 400, lineHeight: 20 },
			color: "#666666",
		},
		receiptCard: {
			selector:
				"main .fr-background-alt--blue-france > div:nth-of-type(2) > div",
			backgroundColor: "#FFFFFF",
			border: { width: 1, color: "#DDDDDD" },
			padding: [16, 16, 16, 16],
		},
		// Size deliberately unasserted: the node contradicts itself — the instance
		// is the MD tertiary component at height 40, but its text layer is 14/20
		// bold, i.e. the SM ramp. The app ships `fr-btn--sm` (32px), and
		// ResendReceiptButton is shared with the two CSE-opinion screens, so
		// picking a side is a product call, not a fidelity fix.
		resendButton: {
			selector: "main .fr-background-alt--blue-france button",
			color: "#000091",
		},

		subtitle: {
			selector: "main form h2",
			font: { size: 24, weight: 700, lineHeight: 32 },
			color: "#161616",
		},
		// 2.Corps de texte/MD - Texte standard - Medium
		instructions: {
			selector: "main p:has(+ .fr-highlight)",
			font: { size: 16, weight: 500, lineHeight: 24 },
			color: "#161616",
		},
		// Figma "Mise en exergue": 32px inset, a 4px rule, then a 32px gutter. DSFR
		// paints the rule as a background gradient inside the padding, so 4 + 32
		// collapse into padding-left 36 and the rule is only reachable through
		// `background-image`.
		deadlineCallout: {
			selector: "main .fr-highlight",
			margin: [null, null, null, 32],
			padding: [null, null, null, 36],
			backgroundImageContains: "rgb(106, 106, 244)",
		},
		deadlineLabel: {
			selector: "main .fr-highlight p:first-of-type",
			font: { size: 16, weight: 400, lineHeight: 24 },
			color: "#3A3A3A",
		},
		// 2.Corps de texte/XL - Chapô - Bold
		deadlineDate: {
			selector: "main .fr-highlight p:last-of-type",
			font: { size: 20, weight: 700, lineHeight: 32 },
			color: "#3A3A3A",
		},

		justifyHeading: {
			selector: "main form h3",
			index: 0,
			font: { size: 20, weight: 700, lineHeight: 28 },
			color: "#161616",
		},
		// The <p> wrapper, not the inline <a>: an inline box is sized by font
		// metrics, so a webfont that has not applied yet shifts the measurement.
		objectiveLinkRow: { selector: "main form h3 + p" },
		objectiveLink: {
			selector: "main form h3 + p a",
			font: { size: 16, weight: 400, lineHeight: 24 },
			color: "#000091",
		},

		justifyCard: { selector: cardRoot(1), ...CARD_FRAME },
		justifyRadioRow: { selector: radioRow(1) },
		justifyRadioLabel: {
			selector: `${radioRow(1)} label`,
			...RADIO_LABEL_TYPE,
		},
		justifyBody: { selector: cardBody(1), padding: [null, null, null, 32] },
		justifyIntro: { selector: `${cardBody(1)} > p:nth-of-type(1)` },
		justifyList: { selector: `${cardBody(1)} > ul` },
		justifyDeadline: {
			selector: `${cardBody(1)} > p:nth-of-type(2)`,
			font: { size: 14, weight: 400, lineHeight: 24 },
		},

		secondHeading: {
			selector: "main form h3",
			index: 1,
			font: { size: 20, weight: 700, lineHeight: 28 },
			color: "#161616",
		},

		correctiveCard: { selector: cardRoot(2), ...CARD_FRAME },
		correctiveRadioLabel: {
			selector: `${radioRow(2)} label`,
			...RADIO_LABEL_TYPE,
		},
		correctiveBody: { selector: cardBody(2), padding: [null, null, null, 32] },
		correctiveDeadline: {
			selector: `${cardBody(2)} > p:nth-of-type(3)`,
			font: { size: 14, weight: 400, lineHeight: 24 },
		},
		// 2.Corps de texte/MD - Texte standard - Medium, artwork-major-blue-france
		correctiveLearnMore: {
			selector: `${cardBody(2)} > a`,
			font: { size: 16, weight: 500, lineHeight: 24 },
			color: "#000091",
		},

		jointCard: { selector: cardRoot(3), ...CARD_FRAME },
		jointRadioLabel: { selector: `${radioRow(3)} label`, ...RADIO_LABEL_TYPE },
		jointBody: { selector: cardBody(3), padding: [null, null, null, 32] },
		jointDeadline: {
			selector: `${cardBody(3)} > p:nth-of-type(2)`,
			font: { size: 14, weight: 400, lineHeight: 24 },
		},
		jointLearnMore: {
			selector: `${cardBody(3)} > a`,
			font: { size: 16, weight: 500, lineHeight: 24 },
			color: "#000091",
		},

		formActions: { selector: "main form > fieldset > *:last-child" },
	},

	// Figma "Content": 32px between every top-level block; 24px inside a section;
	// 16px inside a card body; 8px between a heading and its lead-in link.
	gaps: [
		{ from: "titleRow", to: "banner", expected: 32 },
		{ from: "banner", to: "subtitle", expected: 32 },
		{ from: "subtitle", to: "instructions", expected: 32 },
		{ from: "downloadLink", to: "downloadMention", expected: 4 },
		{ from: "instructions", to: "deadlineCallout", expected: 16 },
		{ from: "deadlineLabel", to: "deadlineDate", expected: 8 },
		{ from: "deadlineCallout", to: "justifyHeading", expected: 32 },
		{ from: "justifyHeading", to: "objectiveLinkRow", expected: 8 },
		{ from: "objectiveLinkRow", to: "justifyCard", expected: 24 },
		{ from: "justifyCard", to: "secondHeading", expected: 32 },
		{ from: "secondHeading", to: "correctiveCard", expected: 24 },
		{ from: "correctiveCard", to: "jointCard", expected: 24 },
		{ from: "jointCard", to: "formActions", expected: 32 },

		{ from: "justifyRadioRow", to: "justifyBody", expected: 16 },
		{ from: "justifyIntro", to: "justifyList", expected: 16 },
		{ from: "justifyList", to: "justifyDeadline", expected: 16 },
		{ from: "correctiveDeadline", to: "correctiveLearnMore", expected: 16 },
		{ from: "jointDeadline", to: "jointLearnMore", expected: 16 },
	],

	alignments: [
		{
			edge: "left",
			of: [
				"titleRow",
				"banner",
				"subtitle",
				"instructions",
				"justifyHeading",
				"objectiveLinkRow",
				"justifyCard",
				"secondHeading",
				"correctiveCard",
				"jointCard",
				"formActions",
			],
		},
		{
			edge: "right",
			of: [
				"banner",
				"justifyCard",
				"correctiveCard",
				"jointCard",
				"formActions",
			],
		},
		// The three card bodies share the radio-label indent (Figma: card padding
		// 16 + radio 24 + gap 8).
		{
			edge: "left",
			of: ["justifyRadioLabel", "justifyBody", "correctiveBody", "jointBody"],
		},
	],

	// Only the strings this frame introduces; the radio titles are already
	// asserted verbatim by the surrounding journey.
	copy: [
		"Parcours de mise en conformité pour l'indicateur par catégorie",
		"Date limite pour choisir un parcours de mise en conformité",
		"Votre déclaration a été transmise",
		"En savoir plus sur actions correctives et seconde déclaration",
		"En savoir plus sur l'évaluation conjointe des rémunérations",
	],
};
