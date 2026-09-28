import type { PublicRepresentationDTO } from "~/modules/public-api";

type Reason = NonNullable<
	| PublicRepresentationDTO["notComputableReasonExecutives"]
	| PublicRepresentationDTO["notComputableReasonMembers"]
>;

/**
 * Why a representation gap could not be computed, in the declarant's own terms.
 * Keyed by the database enum so a new reason surfaces as a type error rather
 * than as an empty card.
 */
const REASON_SENTENCES: Record<Reason, string> = {
	aucun_cadre_dirigeant:
		"L’entreprise ne compte aucun cadre dirigeant sur la période de référence.",
	un_seul_cadre_dirigeant:
		"L’entreprise compte un seul cadre dirigeant sur la période de référence.",
	aucune_instance_dirigeante:
		"L’entreprise ne compte aucune instance dirigeante sur la période de référence.",
};

export function NotComputableState({ reason }: { reason: Reason }) {
	return (
		<>
			<p className="fr-text--sm fr-mb-2w">{REASON_SENTENCES[reason]}</p>
			<p className="fr-badge">Écart non calculable</p>
		</>
	);
}
