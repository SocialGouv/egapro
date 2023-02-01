import { AppState, CategorieSocioPro, GroupeEffectif, GroupeIndicateurDeux } from "../globals"

import {
  calculEcartsPonderesParGroupe,
  calculTotalEcartPondere,
  calculTotalEffectifs,
  rowEffectifsParCategorieSocioPro,
  EffectifGroup,
  calculEffectifsIndicateurCalculable,
} from "./calculsEgaPro"
import calculIndicateurUn from "./calculsEgaProIndicateurUn"
import { roundDecimal } from "./number"

const baremEcartAugmentation = [20, 20, 20, 10, 10, 10, 5, 5, 5, 5, 5, 0]

//////////////////
// COMMON ////////
//////////////////

export {
  calculTotalEcartPondere, // TEV
  calculEffectifsIndicateurCalculable, // IC
}

//////////////////
// INDICATEUR 2 //
//////////////////

// VG
export const calculValiditeGroupe = (nombreSalariesFemmes: number, nombreSalariesHommes: number): boolean =>
  nombreSalariesFemmes >= 10 && nombreSalariesHommes >= 10

// ETA
export const calculEcartTauxAugmentation = (
  tauxAugmentationFemmes: number | undefined,
  tauxAugmentationHommes: number | undefined,
): number | undefined =>
  tauxAugmentationFemmes !== undefined &&
  tauxAugmentationHommes !== undefined &&
  tauxAugmentationFemmes >= 0 &&
  tauxAugmentationHommes >= 0
    ? roundDecimal(tauxAugmentationHommes - tauxAugmentationFemmes, 6)
    : undefined

export interface effectifEtEcartAugmentGroup extends EffectifGroup {
  categorieSocioPro: CategorieSocioPro
  tauxAugmentationFemmes: number | undefined
  tauxAugmentationHommes: number | undefined
  ecartTauxAugmentation: number | undefined
}

// Ajout de l'écart d'augmentation dans les données par CSP
export const calculEcartTauxAugmentationParCSP = (tauxAugmentation: Array<GroupeIndicateurDeux>) =>
  tauxAugmentation.map((categorie) => {
    return {
      ...categorie,
      ecartTauxAugmentation: calculEcartTauxAugmentation(
        categorie.tauxAugmentationFemmes,
        categorie.tauxAugmentationHommes,
      ),
    }
  })

export const calculEffectifsEtEcartAugmentParCategorieSocioPro = (
  dataEffectif: Array<GroupeEffectif>,
  dataIndicateurDeux: Array<GroupeIndicateurDeux>,
): Array<effectifEtEcartAugmentGroup> => {
  return dataEffectif.map(({ categorieSocioPro, tranchesAges }: GroupeEffectif) => {
    const effectifs = rowEffectifsParCategorieSocioPro(tranchesAges, calculValiditeGroupe)

    const dataAugment = dataIndicateurDeux.find(({ categorieSocioPro: csp }) => csp === categorieSocioPro)

    const tauxAugmentationFemmes = dataAugment && dataAugment.tauxAugmentationFemmes
    const tauxAugmentationHommes = dataAugment && dataAugment.tauxAugmentationHommes

    // ETA
    const ecartTauxAugmentation = calculEcartTauxAugmentation(tauxAugmentationFemmes, tauxAugmentationHommes)

    return {
      ...effectifs,
      categorieSocioPro,
      tauxAugmentationFemmes,
      tauxAugmentationHommes,
      ecartTauxAugmentation,
    }
  })
}

export const calculTotalEffectifsEtTauxAugmentation = (
  groupEffectifEtEcartAugment: Array<effectifEtEcartAugmentGroup>,
) => {
  const { totalNombreSalariesFemmes, totalNombreSalariesHommes, totalNombreSalaries, totalEffectifsValides } =
    calculTotalEffectifs(groupEffectifEtEcartAugment)

  const { sommeProduitTauxAugmentationFemmes, sommeProduitTauxAugmentationHommes } = groupEffectifEtEcartAugment.reduce(
    (
      { sommeProduitTauxAugmentationFemmes, sommeProduitTauxAugmentationHommes },
      { nombreSalariesFemmes, nombreSalariesHommes, tauxAugmentationFemmes, tauxAugmentationHommes },
    ) => {
      return {
        sommeProduitTauxAugmentationFemmes:
          sommeProduitTauxAugmentationFemmes + (tauxAugmentationFemmes || 0) * nombreSalariesFemmes,
        sommeProduitTauxAugmentationHommes:
          sommeProduitTauxAugmentationHommes + (tauxAugmentationHommes || 0) * nombreSalariesHommes,
      }
    },
    {
      sommeProduitTauxAugmentationFemmes: 0,
      sommeProduitTauxAugmentationHommes: 0,
    },
  )

  // TTAF
  const totalTauxAugmentationFemmes = sommeProduitTauxAugmentationFemmes / totalNombreSalariesFemmes

  // TTAH
  const totalTauxAugmentationHommes = sommeProduitTauxAugmentationHommes / totalNombreSalariesHommes

  return {
    totalNombreSalaries,
    totalEffectifsValides,
    totalTauxAugmentationFemmes,
    totalTauxAugmentationHommes,
  }
}

export const calculEcartsPonderesParCategorieSocioPro = calculEcartsPonderesParGroupe(
  ({ ecartTauxAugmentation }) => ecartTauxAugmentation,
)

// IC
export const calculIndicateurCalculable = (
  presenceAugmentation: boolean,
  totalNombreSalaries: number,
  totalEffectifsValides: number,
  totalTauxAugmentationFemmes: number,
  totalTauxAugmentationHommes: number,
): boolean =>
  presenceAugmentation &&
  calculEffectifsIndicateurCalculable(totalNombreSalaries, totalEffectifsValides) &&
  (totalTauxAugmentationFemmes > 0 || totalTauxAugmentationHommes > 0)

// IEA
export const calculIndicateurEcartAugmentation = (
  indicateurCalculable: boolean,
  totalEcartPondere: number | undefined,
): number | undefined =>
  indicateurCalculable && totalEcartPondere !== undefined ? roundDecimal(100 * totalEcartPondere, 6) : undefined

export const calculIndicateurSexeSurRepresente = (
  indicateurEcartAugmentation: number | undefined,
): "hommes" | "femmes" | undefined => {
  if (indicateurEcartAugmentation === undefined || indicateurEcartAugmentation === 0) {
    return undefined
  }
  return Math.sign(indicateurEcartAugmentation) < 0 ? "femmes" : "hommes"
}

export const calculIndicateurEcartAugmentationAbsolute = (
  indicateurEcartAugmentation: number | undefined,
): number | undefined => (indicateurEcartAugmentation !== undefined ? Math.abs(indicateurEcartAugmentation) : undefined)

// NOTE
export const calculNote = (
  indicateurEcartAugmentation: number | undefined,
  noteIndicateurUn: number | undefined,
  indicateurUnSexeSurRepresente: "hommes" | "femmes" | undefined,
  indicateurDeuxSexeSurRepresente: "hommes" | "femmes" | undefined,
): { note: number | undefined; correctionMeasure: boolean } => {
  if (
    noteIndicateurUn !== undefined &&
    noteIndicateurUn < 40 &&
    indicateurUnSexeSurRepresente &&
    indicateurDeuxSexeSurRepresente &&
    indicateurUnSexeSurRepresente !== indicateurDeuxSexeSurRepresente
  ) {
    return { note: baremEcartAugmentation[0], correctionMeasure: true }
  }
  const note =
    indicateurEcartAugmentation !== undefined
      ? baremEcartAugmentation[
          Math.min(
            baremEcartAugmentation.length - 1,
            Math.ceil(Math.max(0, roundDecimal(indicateurEcartAugmentation, 1))),
          )
        ]
      : undefined
  return { note, correctionMeasure: false }
}

/////////
// ALL //
/////////

export default function calculerIndicateurDeux(state: AppState) {
  const effectifEtEcartAugmentParGroupe = calculEffectifsEtEcartAugmentParCategorieSocioPro(
    state.effectif.nombreSalaries,
    state.indicateurDeux.tauxAugmentation,
  )

  const { totalNombreSalaries, totalEffectifsValides, totalTauxAugmentationFemmes, totalTauxAugmentationHommes } =
    calculTotalEffectifsEtTauxAugmentation(effectifEtEcartAugmentParGroupe)

  const ecartsPonderesByRow = calculEcartsPonderesParCategorieSocioPro(
    effectifEtEcartAugmentParGroupe,
    totalEffectifsValides,
  )

  // TEP
  const totalEcartPondere = calculTotalEcartPondere(ecartsPonderesByRow)

  // IC
  const effectifsIndicateurCalculable = calculEffectifsIndicateurCalculable(totalNombreSalaries, totalEffectifsValides)

  // IC
  const indicateurCalculable = calculIndicateurCalculable(
    state.indicateurDeux.presenceAugmentation,
    totalNombreSalaries,
    totalEffectifsValides,
    totalTauxAugmentationFemmes,
    totalTauxAugmentationHommes,
  )

  // IEA
  const indicateurEcartAugmentation = calculIndicateurEcartAugmentation(indicateurCalculable, totalEcartPondere)

  const indicateurEcartAugmentationAbsolute = calculIndicateurEcartAugmentationAbsolute(indicateurEcartAugmentation)

  const indicateurDeuxSexeSurRepresente = calculIndicateurSexeSurRepresente(indicateurEcartAugmentation)

  // Mesures correction indicateur 1
  const { indicateurSexeSurRepresente: indicateurUnSexeSurRepresente, noteIndicateurUn } = calculIndicateurUn(state)

  // NOTE
  const { note: noteIndicateurDeux, correctionMeasure } = calculNote(
    indicateurEcartAugmentationAbsolute,
    noteIndicateurUn,
    indicateurUnSexeSurRepresente,
    indicateurDeuxSexeSurRepresente,
  )

  return {
    effectifsIndicateurCalculable,
    effectifEtEcartAugmentParGroupe,
    indicateurCalculable,
    indicateurEcartAugmentation: indicateurEcartAugmentationAbsolute,
    indicateurSexeSurRepresente: indicateurDeuxSexeSurRepresente,
    noteIndicateurDeux,
    correctionMeasure,
  }
}
