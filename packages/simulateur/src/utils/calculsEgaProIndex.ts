import { TrancheEffectifs } from "../globals"

///////////
// Index //
///////////

export const MAX_NOTES_INDICATEURS = {
  indicateurUn: 40, // Indicateur écart de rémunération
  indicateurDeux: 20, // Indicateur écart de taux d'augmentation individuelle hors promotion
  indicateurTrois: 15, // Indicateur écart de taux de promotion
  indicateurDeuxTrois: 35, // Indicateur écart de taux d'augmentation
  indicateurQuatre: 15, // Indicateur pourcentage de salariées augmentées dans l'année suivant leur retour de congé maternité
  indicateurCinq: 10, // Indicateur nombre de salariés du sexe sous-représenté parmi les 10 plus hautes rémunérations
}

export const calculerNoteIndex = (
  trancheEffectifs: TrancheEffectifs,
  noteIndicateurUn: number | undefined,
  noteIndicateurDeux: number | undefined,
  noteIndicateurTrois: number | undefined,
  noteIndicateurDeuxTrois: number | undefined,
  noteIndicateurQuatre: number | undefined,
  noteIndicateurCinq: number | undefined,
): {
  noteIndex: number | undefined
  totalPoint: number
  totalPointCalculable: number
} => {
  const noteIndicateurUnPointCalculable = noteIndicateurUn !== undefined ? 40 : 0
  const noteIndicateurDeuxPointCalculable = noteIndicateurDeux !== undefined ? 20 : 0
  const noteIndicateurTroisPointCalculable = noteIndicateurTrois !== undefined ? 15 : 0
  const noteIndicateurDeuxTroisPointCalculable = noteIndicateurDeuxTrois !== undefined ? 35 : 0
  const noteIndicateurQuatrePointCalculable = noteIndicateurQuatre !== undefined ? 15 : 0
  const noteIndicateurCinqPointCalculable = noteIndicateurCinq !== undefined ? 10 : 0

  const totalPoint =
    (noteIndicateurUn || 0) +
    (trancheEffectifs !== "50 à 250"
      ? (noteIndicateurDeux || 0) + (noteIndicateurTrois || 0)
      : noteIndicateurDeuxTrois || 0) +
    (noteIndicateurQuatre || 0) +
    (noteIndicateurCinq || 0)

  const totalPointCalculable =
    noteIndicateurUnPointCalculable +
    (trancheEffectifs !== "50 à 250"
      ? noteIndicateurDeuxPointCalculable + noteIndicateurTroisPointCalculable
      : noteIndicateurDeuxTroisPointCalculable) +
    noteIndicateurQuatrePointCalculable +
    noteIndicateurCinqPointCalculable

  if (totalPointCalculable < 75) {
    return {
      noteIndex: undefined,
      totalPoint,
      totalPointCalculable,
    }
  }

  const noteIndex = Math.round((totalPoint * 100) / totalPointCalculable)

  return {
    noteIndex,
    totalPoint,
    totalPointCalculable,
  }
}
