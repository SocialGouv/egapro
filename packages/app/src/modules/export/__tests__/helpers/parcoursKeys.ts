// Shared by the payload test (fetchDeclarations) and the schema test (openapi):
// one list, so the OpenAPI document and the assembled declaration cannot drift.
export const PARCOURS_KEYS = [
	"Annee",
	"Effectif",
	"Tranche_effectif",
	"Regime_obligations",
	"Statut",
	"Annulee",
	"Parcours_de_conformite_requis",
	"Parcours_de_conformite_revision_requis",
	"Avis_CSE_requis",
	"Indicateur_G_requis",
	"Prochaines_etapes_possibles",
] as const;

// The keys #4326 moved out of the root and into Parcours. Tranche_effectif,
// Regime_obligations and Annulee are new and never lived at the root.
export const RELOCATED_ROOT_KEYS = [
	"Annee",
	"Effectif",
	"Statut",
	"Parcours_de_conformite_requis",
	"Parcours_de_conformite_revision_requis",
	"Avis_CSE_requis",
	"Indicateur_G_requis",
] as const;

// Left the root and was NOT relocated: dropped from the payload altogether.
// Prochaines_etapes_possibles is already resolved server-side against the
// pinned ruleset, so no consumer has a version to look up. Asserted absent
// from both the root and Parcours, so neither can quietly reintroduce it.
export const DROPPED_ROOT_KEYS = ["Version_regles"] as const;
