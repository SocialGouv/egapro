import { AppState, EffectifsPourCSP, SexeType, TauxAugmentationPourCSP } from "../globals"

import {
  calculEcartsPonderesParGroupe,
  effectifEstCalculable,
  calculerTotalEcartPondere,
  calculerTotalEffectifs,
  EffectifGroup,
  calculerEffectifsParCSP,
} from "./calculsEgaPro"
import calculerIndicateurUn from "./calculsEgaProIndicateurUn"
import { roundDecimal } from "./number"

/*
 * Indicateur 2: écart de taux d’augmentation (plus de 250 salariés)
 */

const baremeEcartAugmentation = [20, 20, 20, 10, 10, 10, 5, 5, 5, 5, 5, 0]

// ETA
export const calculerEcartTauxAugmentation = (
  tauxAugmentationFemmes?: number,
  tauxAugmentationHommes?: number,
): number | undefined =>
  tauxAugmentationFemmes !== undefined &&
  tauxAugmentationHommes !== undefined &&
  tauxAugmentationFemmes >= 0 &&
  tauxAugmentationHommes >= 0
    ? roundDecimal(tauxAugmentationHommes - tauxAugmentationFemmes, 6)
    : undefined

type EffectifsEtTauxAugmentationPourCSP = EffectifGroup & TauxAugmentationPourCSP

// Ajout de l'écart d'augmentation dans les données par CSP
export const calculerEcartTauxAugmentationParCSP = (tauxAugmentation: TauxAugmentationPourCSP[]) =>
  tauxAugmentation.map((categorie) => {
    return {
      ...categorie,
      ecartTauxAugmentation: calculerEcartTauxAugmentation(
        categorie.tauxAugmentationFemmes,
        categorie.tauxAugmentationHommes,
      ),
    }
  })

export const calculerEffectifsEtEcartAugmentationParCSP = (
  effectifs: EffectifsPourCSP[],
  tauxAugmentationParCSP: TauxAugmentationPourCSP[],
): EffectifsEtTauxAugmentationPourCSP[] => {
  return effectifs.map((categorie: EffectifsPourCSP) => {
    const { categorieSocioPro } = categorie

    const effectifs = calculerEffectifsParCSP(categorie)

    const tauxAugmentation = tauxAugmentationParCSP.find(
      ({ categorieSocioPro }) => categorieSocioPro === categorie.categorieSocioPro,
    )

    const tauxAugmentationFemmes = tauxAugmentation?.tauxAugmentationFemmes
    const tauxAugmentationHommes = tauxAugmentation?.tauxAugmentationHommes

    return {
      categorieSocioPro,
      ...effectifs,
      tauxAugmentationFemmes,
      tauxAugmentationHommes,
      // ETA
      ecartTauxAugmentation: calculerEcartTauxAugmentation(tauxAugmentationFemmes, tauxAugmentationHommes),
    }
  })
}

export const calculerTotalEffectifsEtTauxAugmentation = (
  groupEffectifEtEcartAugment: EffectifsEtTauxAugmentationPourCSP[],
) => {
  const { totalNombreSalariesFemmes, totalNombreSalariesHommes, totalNombreSalaries, totalEffectifsValides } =
    calculerTotalEffectifs(groupEffectifEtEcartAugment)

  // On parcourt la liste des CSP et on fait la multiplication des salariés par leur pourcentage d'augmentation.
  // Plus tard, on divisera par le nombre total de salarié pour avoir la moyenne des augmentations.
  const { nbFemmesAugmentees, nbHommesAugmentes } = groupEffectifEtEcartAugment.reduce(
    (acc, { nombreSalariesFemmes, nombreSalariesHommes, tauxAugmentationFemmes = 0, tauxAugmentationHommes = 0 }) => {
      return {
        nbFemmesAugmentees: acc.nbFemmesAugmentees + tauxAugmentationFemmes * nombreSalariesFemmes,
        nbHommesAugmentes: acc.nbHommesAugmentes + tauxAugmentationHommes * nombreSalariesHommes,
      }
    },
    {
      nbFemmesAugmentees: 0,
      nbHommesAugmentes: 0,
    },
  )

  // Moyennes des augmentations
  // TTAF
  const totalTauxAugmentationFemmes = nbFemmesAugmentees / totalNombreSalariesFemmes

  // TTAH
  const totalTauxAugmentationHommes = nbHommesAugmentes / totalNombreSalariesHommes

  return {
    totalNombreSalaries,
    totalEffectifsValides,
    // TODO: devrait s'appeler moyenneFemmesAugmentees
    totalTauxAugmentationFemmes,
    // TODO: devrait s'appeler moyenneHommesAugmentees
    totalTauxAugmentationHommes,
  }
}

export const calculerEcartsPonderesParCSP = calculEcartsPonderesParGroupe(
  ({ ecartTauxAugmentation }) => ecartTauxAugmentation,
)

// IC
export const estCalculable = (
  presenceAugmentation: boolean,
  totalNombreSalaries: number,
  totalEffectifsValides: number,
  totalTauxAugmentationFemmes: number,
  totalTauxAugmentationHommes: number,
): boolean =>
  presenceAugmentation &&
  effectifEstCalculable(totalNombreSalaries, totalEffectifsValides) &&
  (totalTauxAugmentationFemmes > 0 || totalTauxAugmentationHommes > 0)

// IEA
export const ecartAugmentation = (indicateurCalculable: boolean, totalEcartPondere?: number): number | undefined =>
  indicateurCalculable && totalEcartPondere !== undefined ? roundDecimal(100 * totalEcartPondere, 6) : undefined

export const ecartAugmentationAbsolu = (indicateurEcartAugmentation?: number): number | undefined =>
  indicateurEcartAugmentation !== undefined ? Math.abs(indicateurEcartAugmentation) : undefined

export const sexeSurRepresente = (indicateurEcartAugmentation?: number): SexeType | undefined => {
  if (indicateurEcartAugmentation === undefined || indicateurEcartAugmentation === 0) {
    return undefined
  }
  return Math.sign(indicateurEcartAugmentation) < 0 ? "femmes" : "hommes"
}

// NOTE
export const calculerNote = (
  indicateurEcartAugmentation?: number,
  noteIndicateurUn?: number,
  indicateurUnSexeSurRepresente?: SexeType,
  indicateurDeuxSexeSurRepresente?: SexeType,
): { note: number | undefined; mesureCorrection: boolean } => {
  if (
    noteIndicateurUn !== undefined &&
    noteIndicateurUn < 40 &&
    indicateurUnSexeSurRepresente &&
    indicateurDeuxSexeSurRepresente &&
    indicateurUnSexeSurRepresente !== indicateurDeuxSexeSurRepresente
  ) {
    // Si l’écart de taux d'augmentation joue en faveur du sexe le moins bien rémunéré (indicateur 1), on considère qu'un rattrapage est en cours.
    // La note maximale sera attribuée à l’entreprise pour cet indicateur.
    return { note: baremeEcartAugmentation[0], mesureCorrection: true }
  }
  const note =
    indicateurEcartAugmentation !== undefined
      ? baremeEcartAugmentation[
          Math.min(
            baremeEcartAugmentation.length - 1,
            Math.ceil(Math.max(0, roundDecimal(indicateurEcartAugmentation, 1))),
          )
        ]
      : undefined
  return { note, mesureCorrection: false }
}

/////////
// ALL //
/////////

export default function calculerIndicateurDeux(state: AppState) {
  const effectifEtEcartAugmentParGroupe = calculerEffectifsEtEcartAugmentationParCSP(
    state.effectif.nombreSalaries,
    state.indicateurDeux.tauxAugmentation,
  )

  const { totalNombreSalaries, totalEffectifsValides, totalTauxAugmentationFemmes, totalTauxAugmentationHommes } =
    calculerTotalEffectifsEtTauxAugmentation(effectifEtEcartAugmentParGroupe)

  const ecartsPonderesByRow = calculerEcartsPonderesParCSP(effectifEtEcartAugmentParGroupe, totalEffectifsValides)

  // TEP
  const totalEcartPondere = calculerTotalEcartPondere(ecartsPonderesByRow)

  // IC
  const effectifsIndicateurCalculable = effectifEstCalculable(totalNombreSalaries, totalEffectifsValides)

  // IC
  // Attention: rend false si effectifIndicateurCalculable est false.
  const indicateurCalculable = estCalculable(
    state.indicateurDeux.presenceAugmentation,
    totalNombreSalaries,
    totalEffectifsValides,
    totalTauxAugmentationFemmes,
    totalTauxAugmentationHommes,
  )

  // IEA
  const indicateurEcartAugmentation = ecartAugmentation(indicateurCalculable, totalEcartPondere)

  const indicateurEcartAugmentationAbsolute = ecartAugmentationAbsolu(indicateurEcartAugmentation)

  const indicateurDeuxSexeSurRepresente = sexeSurRepresente(indicateurEcartAugmentation)

  // Mesures correction indicateur 1
  const { indicateurSexeSurRepresente: indicateurUnSexeSurRepresente, noteIndicateurUn } = calculerIndicateurUn(state)

  // NOTE
  const { note: noteIndicateurDeux, mesureCorrection: correctionMeasure } = calculerNote(
    indicateurEcartAugmentationAbsolute,
    noteIndicateurUn,
    indicateurUnSexeSurRepresente,
    indicateurDeuxSexeSurRepresente,
  )

  return {
    effectifsIndicateurCalculable, // Pourquoi rendre cette information ici? C'est une information sur les effectifs et pas liée spécifiquement à l'indicateur 2.
    indicateurCalculable,
    effectifEtEcartAugmentParGroupe,
    indicateurEcartAugmentation: indicateurEcartAugmentationAbsolute,
    indicateurSexeSurRepresente: indicateurDeuxSexeSurRepresente,
    noteIndicateurDeux,
    correctionMeasure,
  }
}
