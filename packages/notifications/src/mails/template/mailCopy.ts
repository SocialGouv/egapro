// Shared regulatory copy reused across several mail builders. Kept as a single
// source of truth so identical wording cannot drift apart between mails.

// The two "portant sur" bullet points (CSE opinion receipt + joint evaluation).
// Rendered as a bold or a regular list depending on the mail, but the wording
// is always the same.
export const COMPLIANCE_CRITERIA_ITEMS = [
	"l'exactitude des données et des méthodes de calcul utilisées ;",
	"la justification éventuelle des écarts de rémunération supérieurs ou égaux à 5 %, au regard de critères objectifs et non sexistes, pour l'indicateur de rémunération par catégorie de salariés.",
] as const;
