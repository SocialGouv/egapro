import { AppState, EffectifsCategorie, GroupeIndicateurTrois, SexeType } from "../globals"

import {
  calculEcartsPonderesParGroupe,
  effectifEstCalculable,
  calculerTotalEcartPondere,
  calculerTotalEffectifs,
  EffectifGroup,
  rowEffectifsParCategorieSocioPro,
} from "./calculsEgaPro"

import {
  calculerEcartTauxAugmentation,
  estCalculable,
  ecartAugmentation,
  ecartAugmentationAbsolu,
  sexeSurRepresente,
  estValideGroupe,
} from "../utils/calculsEgaProIndicateurDeux"
import calculerIndicateurUn from "./calculsEgaProIndicateurUn"
import { roundDecimal } from "./number"

const baremEcartPromotion = [15, 15, 15, 10, 10, 10, 5, 5, 5, 5, 5, 0]

//////////////////
// COMMON ////////
//////////////////

export {
  estValideGroupe as calculValiditeGroupe,
  calculerTotalEcartPondere as calculTotalEcartPondere,
  effectifEstCalculable as calculEffectifsIndicateurCalculable,
  estCalculable as calculIndicateurCalculable, // IC
}

//////////////////
// INDICATEUR 3 //
//////////////////

// ETP
export const calculEcartTauxPromotion = calculerEcartTauxAugmentation

export type EffectifEtEcartPromoGroup = EffectifGroup & GroupeIndicateurTrois

// Ajout de l'écart de promotion dans les données par CSP
export const calculEcartTauxPromotionParCSP = (tauxPromotion: Array<GroupeIndicateurTrois>) =>
  tauxPromotion.map((categorie) => {
    return {
      ...categorie,
      ecartTauxPromotion: calculEcartTauxPromotion(categorie.tauxPromotionFemmes, categorie.tauxPromotionHommes),
    }
  })

export const calculEffectifsEtEcartPromoParCategorieSocioPro = (
  dataEffectif: Array<EffectifsCategorie>,
  dataIndicateurTrois: Array<GroupeIndicateurTrois>,
): Array<EffectifEtEcartPromoGroup> => {
  return dataEffectif.map((categorie: EffectifsCategorie) => {
    const { categorieSocioPro } = categorie

    const effectifs = rowEffectifsParCategorieSocioPro(categorie, estValideGroupe)

    const dataPromo = dataIndicateurTrois.find(
      ({ categorieSocioPro }) => categorieSocioPro === categorie.categorieSocioPro,
    )

    const tauxPromotionFemmes = dataPromo?.tauxPromotionFemmes
    const tauxPromotionHommes = dataPromo?.tauxPromotionHommes

    // ETA
    const ecartTauxPromotion = calculEcartTauxPromotion(tauxPromotionFemmes, tauxPromotionHommes)

    return {
      ...effectifs,
      categorieSocioPro,
      tauxPromotionFemmes,
      tauxPromotionHommes,
      ecartTauxPromotion,
    }
  })
}

export const calculTotalEffectifsEtTauxPromotion = (groupEffectifEtEcartAugment: Array<EffectifEtEcartPromoGroup>) => {
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

export const calculEcartsPonderesParCategorieSocioPro = calculEcartsPonderesParGroupe(
  ({ ecartTauxPromotion }) => ecartTauxPromotion,
)

// IEP
export const calculIndicateurEcartPromotion = ecartAugmentation

export const calculIndicateurEcartPromotionAbsolute = ecartAugmentationAbsolu

// NOTE
export const calculNote = (
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
  const effectifEtEcartPromoParGroupe = calculEffectifsEtEcartPromoParCategorieSocioPro(
    state.effectif.nombreSalaries,
    state.indicateurTrois.tauxPromotion,
  )

  const { totalNombreSalaries, totalEffectifsValides, totalTauxPromotionFemmes, totalTauxPromotionHommes } =
    calculTotalEffectifsEtTauxPromotion(effectifEtEcartPromoParGroupe)

  const ecartsPonderesByRow = calculEcartsPonderesParCategorieSocioPro(
    effectifEtEcartPromoParGroupe,
    totalEffectifsValides,
  )

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
  const indicateurEcartPromotion = calculIndicateurEcartPromotion(indicateurCalculable, totalEcartPondere)

  const indicateurEcartPromotionAbsolute = calculIndicateurEcartPromotionAbsolute(indicateurEcartPromotion)

  const indicateurTroisSexeSurRepresente = sexeSurRepresente(indicateurEcartPromotion)

  // Mesures correction indicateur 1
  const { indicateurSexeSurRepresente: indicateurUnSexeSurRepresente, noteIndicateurUn } = calculerIndicateurUn(state)

  // NOTE
  const { note: noteIndicateurTrois, correctionMeasure } = calculNote(
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
