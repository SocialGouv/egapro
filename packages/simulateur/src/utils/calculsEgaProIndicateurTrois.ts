import { AppState, EffectifsCategorie, GroupeIndicateurTrois, SexeType } from "../globals"

import {
  calculEcartsPonderesParGroupe,
  effectifEstCalculable,
  calculerTotalEcartPondere,
  calculerTotalEffectifs,
  EffectifGroup,
  calculerEffectifsParCSP,
} from "./calculsEgaPro"

import {
  calculerEcartTauxAugmentation,
  estCalculable,
  ecartAugmentation,
  ecartAugmentationAbsolu,
  sexeSurRepresente,
  calculerValiditeGroupe,
} from "../utils/calculsEgaProIndicateurDeux"
import calculerIndicateurUn from "./calculsEgaProIndicateurUn"
import { roundDecimal } from "./number"

const baremEcartPromotion = [15, 15, 15, 10, 10, 10, 5, 5, 5, 5, 5, 0]

//////////////////
// COMMON ////////
//////////////////

export {
  calculerValiditeGroupe,
  calculerTotalEcartPondere,
  effectifEstCalculable,
  estCalculable, // IC
}

//////////////////
// INDICATEUR 3 //
//////////////////

// ETP
export const calculerEcartTauxPromotion = calculerEcartTauxAugmentation

export type EffectifEtEcartPromoGroup = EffectifGroup & GroupeIndicateurTrois

// Ajout de l'écart de promotion dans les données par CSP
export const calculerEcartTauxPromotionParCSP = (tauxPromotion: Array<GroupeIndicateurTrois>) =>
  tauxPromotion.map((categorie) => {
    return {
      ...categorie,
      ecartTauxPromotion: calculerEcartTauxPromotion(categorie.tauxPromotionFemmes, categorie.tauxPromotionHommes),
    }
  })

export const calculerEffectifsEtEcartPromoParCSP = (
  dataEffectif: Array<EffectifsCategorie>,
  dataIndicateurTrois: Array<GroupeIndicateurTrois>,
): Array<EffectifEtEcartPromoGroup> => {
  return dataEffectif.map((categorie: EffectifsCategorie) => {
    const { categorieSocioPro } = categorie

    const effectifs = calculerEffectifsParCSP(categorie, calculerValiditeGroupe)

    const dataPromo = dataIndicateurTrois.find(
      ({ categorieSocioPro }) => categorieSocioPro === categorie.categorieSocioPro,
    )

    const tauxPromotionFemmes = dataPromo?.tauxPromotionFemmes
    const tauxPromotionHommes = dataPromo?.tauxPromotionHommes

    // ETA
    const ecartTauxPromotion = calculerEcartTauxPromotion(tauxPromotionFemmes, tauxPromotionHommes)

    return {
      ...effectifs,
      categorieSocioPro,
      tauxPromotionFemmes,
      tauxPromotionHommes,
      ecartTauxPromotion,
    }
  })
}

export const calculerTotalEffectifsEtTauxPromotion = (groupEffectifEtEcartAugment: EffectifEtEcartPromoGroup[]) => {
  const { totalNombreSalariesFemmes, totalNombreSalariesHommes, totalNombreSalaries, totalEffectifsValides } =
    calculerTotalEffectifs(groupEffectifEtEcartAugment)

  const { sommeProduitTauxPromotionFemmes, sommeProduitTauxPromotionHommes } = groupEffectifEtEcartAugment.reduce(
    (
      { sommeProduitTauxPromotionFemmes, sommeProduitTauxPromotionHommes },
      { nombreSalariesFemmes, nombreSalariesHommes, tauxPromotionFemmes, tauxPromotionHommes },
    ) => {
      return {
        sommeProduitTauxPromotionFemmes:
          sommeProduitTauxPromotionFemmes + (tauxPromotionFemmes || 0) * nombreSalariesFemmes,
        sommeProduitTauxPromotionHommes:
          sommeProduitTauxPromotionHommes + (tauxPromotionHommes || 0) * nombreSalariesHommes,
      }
    },
    {
      sommeProduitTauxPromotionFemmes: 0,
      sommeProduitTauxPromotionHommes: 0,
    },
  )

  // TTPF
  const totalTauxPromotionFemmes = sommeProduitTauxPromotionFemmes / totalNombreSalariesFemmes

  // TTPH
  const totalTauxPromotionHommes = sommeProduitTauxPromotionHommes / totalNombreSalariesHommes

  return {
    totalNombreSalaries,
    totalEffectifsValides,
    totalTauxPromotionFemmes,
    totalTauxPromotionHommes,
  }
}

export const calculerEcartsPonderesParCSP = calculEcartsPonderesParGroupe(
  ({ ecartTauxPromotion }) => ecartTauxPromotion,
)

// IEP
export const calculerEcartPromotion = ecartAugmentation

export const calculerEcartPromotionAbsolu = ecartAugmentationAbsolu

// NOTE
export const calculerNote = (
  indicateurEcartPromotion: number | undefined,
  noteIndicateurUn: number | undefined,
  indicateurUnSexeSurRepresente?: SexeType,
  indicateurDeuxSexeSurRepresente?: SexeType,
): { note: number | undefined; correctionMeasure: boolean } => {
  if (
    noteIndicateurUn !== undefined &&
    noteIndicateurUn < 40 &&
    indicateurUnSexeSurRepresente &&
    indicateurDeuxSexeSurRepresente &&
    indicateurUnSexeSurRepresente !== indicateurDeuxSexeSurRepresente
  ) {
    // Si l’écart de taux de promotion joue en faveur du sexe le moins bien rémunéré (indicateur 1), on considère qu'un rattrapage est en cours.
    // La note maximale sera attribuée à l’entreprise pour cet indicateur.
    return { note: baremEcartPromotion[0], correctionMeasure: true }
  }
  const note =
    indicateurEcartPromotion !== undefined
      ? baremEcartPromotion[
          Math.min(baremEcartPromotion.length - 1, Math.ceil(Math.max(0, roundDecimal(indicateurEcartPromotion, 1))))
        ]
      : undefined
  return { note, correctionMeasure: false }
}

/////////
// ALL //
/////////

export default function calculerIndicateurTrois(state: AppState) {
  const effectifEtEcartPromoParGroupe = calculerEffectifsEtEcartPromoParCSP(
    state.effectif.nombreSalaries,
    state.indicateurTrois.tauxPromotion,
  )

  const { totalNombreSalaries, totalEffectifsValides, totalTauxPromotionFemmes, totalTauxPromotionHommes } =
    calculerTotalEffectifsEtTauxPromotion(effectifEtEcartPromoParGroupe)

  const ecartsPonderesByRow = calculerEcartsPonderesParCSP(effectifEtEcartPromoParGroupe, totalEffectifsValides)

  // TEP
  const totalEcartPondere = calculerTotalEcartPondere(ecartsPonderesByRow)

  // IC
  const effectifsIndicateurCalculable = effectifEstCalculable(totalNombreSalaries, totalEffectifsValides)

  // IC
  const indicateurCalculable = estCalculable(
    state.indicateurTrois.presencePromotion,
    totalNombreSalaries,
    totalEffectifsValides,
    totalTauxPromotionFemmes,
    totalTauxPromotionHommes,
  )

  // IEA
  const indicateurEcartPromotion = calculerEcartPromotion(indicateurCalculable, totalEcartPondere)

  const indicateurEcartPromotionAbsolute = calculerEcartPromotionAbsolu(indicateurEcartPromotion)

  const indicateurTroisSexeSurRepresente = sexeSurRepresente(indicateurEcartPromotion)

  // Mesures correction indicateur 1
  const { indicateurSexeSurRepresente: indicateurUnSexeSurRepresente, noteIndicateurUn } = calculerIndicateurUn(state)

  // NOTE
  const { note: noteIndicateurTrois, correctionMeasure } = calculerNote(
    indicateurEcartPromotionAbsolute,
    noteIndicateurUn,
    indicateurUnSexeSurRepresente,
    indicateurTroisSexeSurRepresente,
  )

  return {
    effectifsIndicateurCalculable,
    effectifEtEcartPromoParGroupe,
    indicateurCalculable,
    indicateurEcartPromotion: indicateurEcartPromotionAbsolute,
    indicateurSexeSurRepresente: indicateurTroisSexeSurRepresente,
    noteIndicateurTrois,
    correctionMeasure,
  }
}
