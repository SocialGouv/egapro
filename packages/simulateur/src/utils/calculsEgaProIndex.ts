import { TrancheEffectifs } from "../globals"

export const MAX_NOTES_INDICATEURS = {
  indicateurUn: 40, // Indicateur écart de rémunération
  indicateurDeux: 20, // Indicateur écart de taux d'augmentation individuelle hors promotion
  indicateurTrois: 15, // Indicateur écart de taux de promotion
  indicateurDeuxTrois: 35, // Indicateur écart de taux d'augmentation
  indicateurQuatre: 15, // Indicateur pourcentage de salariées augmentées dans l'année suivant leur retour de congé maternité
  indicateurCinq: 10, // Indicateur nombre de salariés du sexe sous-représenté parmi les 10 plus hautes rémunérations
}

type CalculerNoteIndexResult = {
  noteIndex: number | undefined
  totalPoint: number
  totalPointCalculable: number
}

export const calculerNoteIndex = (
  trancheEffectifs: TrancheEffectifs,
  noteIndicateurUn: number | undefined,
  noteIndicateurDeux: number | undefined,
  noteIndicateurTrois: number | undefined,
  noteIndicateurDeuxTrois: number | undefined,
  noteIndicateurQuatre: number | undefined,
  noteIndicateurCinq: number | undefined,
): CalculerNoteIndexResult => {
  const indicateurUnPointsCalculables = noteIndicateurUn !== undefined ? MAX_NOTES_INDICATEURS.indicateurUn : 0
  const indicateurDeuxPointsCalculables = noteIndicateurDeux !== undefined ? MAX_NOTES_INDICATEURS.indicateurDeux : 0
  const indicateurTroisPointsCalculables = noteIndicateurTrois !== undefined ? MAX_NOTES_INDICATEURS.indicateurTrois : 0
  const indicateurDeuxTroisPointsCalculables =
    noteIndicateurDeuxTrois !== undefined ? MAX_NOTES_INDICATEURS.indicateurDeuxTrois : 0
  const indicateurQuatrePointsCalculables =
    noteIndicateurQuatre !== undefined ? MAX_NOTES_INDICATEURS.indicateurQuatre : 0
  const indicateurCinqPointsCalculables = noteIndicateurCinq !== undefined ? MAX_NOTES_INDICATEURS.indicateurCinq : 0

  const totalPoint =
    (noteIndicateurUn || 0) +
    (trancheEffectifs !== "50 à 250"
      ? (noteIndicateurDeux || 0) + (noteIndicateurTrois || 0)
      : noteIndicateurDeuxTrois || 0) +
    (noteIndicateurQuatre || 0) +
    (noteIndicateurCinq || 0)

  const totalPointCalculable =
    indicateurUnPointsCalculables +
    (trancheEffectifs !== "50 à 250"
      ? indicateurDeuxPointsCalculables + indicateurTroisPointsCalculables
      : indicateurDeuxTroisPointsCalculables) +
    indicateurQuatrePointsCalculables +
    indicateurCinqPointsCalculables

  return {
    noteIndex: totalPointCalculable < 75 ? undefined : Math.round((totalPoint * 100) / totalPointCalculable),
    totalPoint,
    totalPointCalculable,
  }
}
