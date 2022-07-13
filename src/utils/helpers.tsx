import { regionCode, departementCode } from "../components/RegionsDepartements"

import {
  TranchesAges,
  CategorieSocioPro,
  AppState,
  DeclarationIndicateurUnData,
  DeclarationIndicateurDeuxData,
  DeclarationIndicateurTroisData,
  DeclarationIndicateurDeuxTroisData,
  DeclarationIndicateurQuatreData,
  DeclarationIndicateurCinqData,
  TrancheEffectifsAPI,
  TrancheEffectifs,
} from "../globals"
import { toISOString } from "./date"
import { asPercentage } from "./number"

import calculIndicateurUn from "../utils/calculsEgaProIndicateurUn"
import calculIndicateurDeux from "../utils/calculsEgaProIndicateurDeux"
import calculIndicateurTrois from "../utils/calculsEgaProIndicateurTrois"
import calculIndicateurDeuxTrois from "../utils/calculsEgaProIndicateurDeuxTrois"
import calculIndicateurQuatre from "../utils/calculsEgaProIndicateurQuatre"
import calculIndicateurCinq from "../utils/calculsEgaProIndicateurCinq"
import { calculNoteIndex } from "../utils/calculsEgaProIndex"
import totalNombreSalaries from "../utils/totalNombreSalaries"

import type { DeclarationForAPI } from "../hooks/useDeclaration"
import { ObjectifsMesuresFormSchema } from "../views/private/ObjectifsMesuresPage"

export function displayNameTranchesAges(trancheAge: TranchesAges): string {
  switch (trancheAge) {
    case TranchesAges.MoinsDe30ans:
      return "moins de 30 ans"
    case TranchesAges.De30a39ans:
      return "30 à 39 ans"
    case TranchesAges.De40a49ans:
      return "40 à 49 ans"
    case TranchesAges.PlusDe50ans:
      return "50 ans et plus"
    default:
      return "ERROR"
  }
}

export function displayNameCategorieSocioPro(categorieSocioPro: CategorieSocioPro): string {
  switch (categorieSocioPro) {
    case CategorieSocioPro.Ouvriers:
      return "ouvriers"
    case CategorieSocioPro.Employes:
      return "employés"
    case CategorieSocioPro.Techniciens:
      return "techniciens et agents de maîtrise"
    case CategorieSocioPro.Cadres:
      return "ingénieurs et cadres"
    default:
      return "ERROR"
  }
}

export function displayFractionPercent(num: number, digits = 2): string {
  return displayPercent(num * 100, digits)
}

export function displayFractionPercentWithEmptyData(num?: number, digits = 2): string {
  return num ? displayFractionPercent(num, digits) : "0%"
}

export function displayPercent(num: number, digits = 1): string {
  return num.toLocaleString("fr-FR", { maximumFractionDigits: digits }) + "%"
}

export function displayInt(num: number): string {
  return num.toLocaleString("fr-FR")
}

export function displaySexeSurRepresente(indicateurSexeSurRepresente: "hommes" | "femmes" | undefined): string {
  return indicateurSexeSurRepresente !== undefined
    ? `écart favorable aux ${indicateurSexeSurRepresente}`
    : "les femmes et les hommes sont à égalité"
}

export const messageEcartNombreEquivalentSalaries = (
  indicateurSexeSurRepresente: "hommes" | "femmes" | undefined,
  plusPetitNombreSalaries: "hommes" | "femmes" | undefined,
): string => {
  if (indicateurSexeSurRepresente === "hommes" && plusPetitNombreSalaries === "femmes") {
    return "* si ce nombre de femmes supplémentaires avait bénéficié d'une augmentation, les taux d'augmentation seraient égaux entre hommes et femmes."
  } else if (indicateurSexeSurRepresente === "hommes" && plusPetitNombreSalaries === "hommes") {
    return "* si ce nombre d'hommes n'avait pas reçu d'augmentation parmi les bénéficiaires, les taux d'augmentation seraient égaux entre hommes et femmes."
  } else if (indicateurSexeSurRepresente === "hommes" && plusPetitNombreSalaries === undefined) {
    return "* si ce nombre de femmes supplémentaires avait bénéficié d'une augmentation, les taux d'augmentation seraient égaux entre hommes et femmes."
  } else if (indicateurSexeSurRepresente === "femmes" && plusPetitNombreSalaries === "femmes") {
    return "* si ce nombre de femmes n'avait pas reçu d'augmentation parmi les bénéficiaires, les taux d'augmentation seraient égaux entre hommes et femmes."
  } else if (indicateurSexeSurRepresente === "femmes" && plusPetitNombreSalaries === "hommes") {
    return "* si ce nombre d'hommes supplémentaires avait bénéficié d'une augmentation, les taux d'augmentation seraient égaux entre hommes et femmes."
  } else if (indicateurSexeSurRepresente === "femmes" && plusPetitNombreSalaries === undefined) {
    return "* si ce nombre d'hommes supplémentaires avait bénéficié d'une augmentation, les taux d'augmentation seraient égaux entre hommes et femmes."
  } else {
    return ""
  }
}

export const messageMesureCorrection = (
  sexeSurRepresente: undefined | "femmes" | "hommes",
  ecartDe: string,
  noteMax: string,
) => {
  return sexeSurRepresente === "femmes"
    ? `** L’écart de taux ${ecartDe} est en faveur des femmes tandis que l’écart de rémunération est en faveur des hommes, donc l’écart de taux ${ecartDe} est considéré comme une mesure de correction. La note obtenue est de ${noteMax}.`
    : sexeSurRepresente === "hommes"
    ? `** L’écart de taux ${ecartDe} est en faveur des hommes tandis que l’écart de rémunération est en faveur des femmes, donc l’écart de taux ${ecartDe} est considéré comme une mesure de correction. La note obtenue est de ${noteMax}.`
    : ""
}

export type DeclarationTotale = {
  id?: string // id de la simulation initiale !! N'est pas rendu par l'API pour GET /declaration
  source: string
  déclarant: Declarant
  entreprise: Entreprise
  déclaration: Declaration
  indicateurs?: Indicateurs | undefined
}

export const formatDataForAPI = (id: string, state: AppState): DeclarationTotale => {
  const output = {
    id,
    source: "simulateur",
    déclaration: buildDeclaration(state),
    déclarant: buildDeclarant(state),
    entreprise: buildEntreprise(state),
    ...(state.informations.periodeSuffisante && { indicateurs: buildIndicateurs(state) }),
  }

  return output
}

export type Declaration = {
  date?: string
  brouillon?: boolean
  index?: number | undefined
  mesures_correctives?: string | undefined
  points_calculables?: number | undefined
  points?: number | undefined
  fin_période_référence?: string | undefined
  année_indicateurs: number | undefined
  période_suffisante: boolean | undefined
  publication?: {
    date_publication_mesures?: string | undefined
    date_publication_objectifs?: string | undefined
    modalités_objectifs_mesures?: string | undefined
    modalités?: string | undefined
    url?: string | undefined
    date?: string | undefined
  }
}

// Déclaration
const buildDeclaration = (state: AppState): Declaration => {
  const index = state.declaration.noteIndex
  const { modalitesPublicationObjectifsMesures, datePublicationObjectifs, datePublicationMesures } =
    state.informationsComplementaires

  const declaration: Declaration = {
    année_indicateurs: state.informations.anneeDeclaration,
    période_suffisante: state.informations.periodeSuffisante,
    ...(state.informations.finPeriodeReference && {
      fin_période_référence: toISOString(state.informations.finPeriodeReference),
    }),
    ...(state.informations.periodeSuffisante && { points: state.declaration.totalPoint }),
    ...(state.informations.periodeSuffisante && { points_calculables: state.declaration.totalPointCalculable }),
    ...(index !== undefined && index < 75 && { mesures_correctives: state.declaration.mesuresCorrection }),
    ...(index && { index }),
  }

  if (state.informations.periodeSuffisante) {
    if (index !== undefined || (state.informations.anneeDeclaration && state.informations.anneeDeclaration >= 2020)) {
      declaration.publication = {
        date: toISOString(state.declaration.datePublication),
        ...(state.declaration.publicationSurSiteInternet && { url: state.declaration.lienPublication }),
        ...(!state.declaration.publicationSurSiteInternet && { modalités: state.declaration.modalitesPublication }),
        ...(modalitesPublicationObjectifsMesures && {
          modalités_objectifs_mesures: modalitesPublicationObjectifsMesures,
        }),
        ...(datePublicationObjectifs && { date_publication_objectifs: toISOString(datePublicationObjectifs) }),
        ...(datePublicationMesures && { date_publication_mesures: toISOString(datePublicationMesures) }),
      }
    }
  }
  return declaration
}

type Declarant = {
  prénom: string
  nom: string
  téléphone: string
  email: string
}

// Déclarant
const buildDeclarant = (state: AppState): Declarant => {
  const declarant: Declarant = {
    prénom: state.informationsDeclarant.prenom,
    nom: state.informationsDeclarant.nom,
    téléphone: state.informationsDeclarant.tel,
    email: state.informationsDeclarant.email,
  }
  return declarant
}

type Entreprise = {
  code_naf: string
  effectif: {
    tranche: TrancheEffectifsAPI
    total?: any
  }
  code_pays?: string | undefined
  code_postal?: string | undefined
  raison_sociale: string
  siren: string
  région: string
  département: string
  adresse: string
  commune: string
  ues?:
    | {
        nom: string
        entreprises: Array<{
          raison_sociale: string
          siren: string
        }>
      }
    | undefined
  plan_relance?: boolean | undefined
}

const trancheFromFormToApi = (tranche: TrancheEffectifs): TrancheEffectifsAPI =>
  tranche === "50 à 250" ? "50:250" : tranche === "251 à 999" ? "251:999" : "1000:"

// Entreprise
const buildEntreprise = (state: AppState): Entreprise => {
  const entreprise: Entreprise = {
    raison_sociale: state.informationsEntreprise.nomEntreprise,
    siren: state.informationsEntreprise.siren,
    région: regionCode[state.informationsEntreprise.region],
    département: departementCode[state.informationsEntreprise.departement],
    adresse: state.informationsEntreprise.adresse,
    commune: state.informationsEntreprise.commune,
    ...(state.informationsEntreprise.codePostal && { code_postal: state.informationsEntreprise.codePostal }),
    ...(state.informationsEntreprise.codePays && { code_pays: state.informationsEntreprise.codePays }),
    code_naf: state.informationsEntreprise.codeNaf.split(" ")[0], // Only get the code like "01.22Z"
    effectif: {
      ...(state.informations.periodeSuffisante && { total: state.effectif.nombreSalariesTotal }),
      tranche: trancheFromFormToApi(state.informations.trancheEffectifs),
    },
  }
  if (state.informationsEntreprise.structure !== "Entreprise") {
    entreprise.ues = {
      nom: state.informationsEntreprise.nomUES,
      entreprises: state.informationsEntreprise.entreprisesUES.map(({ nom, siren }) => ({
        raison_sociale: nom,
        siren,
      })),
    }
  }

  if (
    state.informations.periodeSuffisante &&
    state.informations.anneeDeclaration &&
    state.informations.anneeDeclaration >= 2021
  ) {
    entreprise.plan_relance = state.declaration.planRelance
  }

  return entreprise
}

export type Indicateurs = {
  rémunérations: Indicateur1
  congés_maternité: Indicateur4
  hautes_rémunérations: Indicateur5

  augmentations_et_promotions?: Indicateur2et3
  augmentations?: Indicateur2
  promotions?: Indicateur3
}

// Indicateurs
const buildIndicateurs = (state: AppState): Indicateurs => {
  const indicateurs: Indicateurs = {
    rémunérations: buildIndicateur1(state),
    congés_maternité: buildIndicateur4(state),
    hautes_rémunérations: buildIndicateur5(state),
  }
  if (state.informations.trancheEffectifs === "50 à 250") {
    indicateurs.augmentations_et_promotions = buildIndicateur2et3(state)
  } else {
    indicateurs.augmentations = buildIndicateur2(state)
    indicateurs.promotions = buildIndicateur3(state)
  }
  return indicateurs
}

export type IndicateurNonCalculable = { non_calculable: string }

export type Indicateur1Calculable = {
  mode: string
  résultat: number | undefined
  note: number | undefined
  population_favorable?: "hommes" | "femmes" | undefined
  date_consultation_cse?: string | undefined
  catégories?: Array<{
    nom: string
    tranches?: {
      ":29"?: number | undefined
      "30:39"?: number | undefined
      "40:49"?: number | undefined
      "50:"?: number | undefined
    }
  }>
  objectif_de_progression?: string
}

type Indicateur1 = IndicateurNonCalculable | Indicateur1Calculable

// Indicateur 1 relatif à l'écart de rémunération entre les femmes et les hommes
const buildIndicateur1 = (state: AppState): Indicateur1 => {
  const indicateurUn = state.indicateurUn as AppState["indicateurUn"] & DeclarationIndicateurUnData

  if (indicateurUn.motifNonCalculable) {
    return { non_calculable: indicateurUn.motifNonCalculable }
  }
  const indicateur1: Indicateur1Calculable = {
    mode: state.indicateurUn.csp ? "csp" : state.indicateurUn.coef ? "niveau_branche" : "niveau_autre",
    résultat: indicateurUn.resultatFinal,
    note: indicateurUn.noteFinale,
    ...(indicateurUn.sexeSurRepresente && { population_favorable: indicateurUn.sexeSurRepresente }),
  }

  if (indicateur1.mode !== "csp") {
    indicateur1.date_consultation_cse = toISOString(state.declaration.dateConsultationCSE)
    indicateur1.catégories = indicateurUn.coefficient.map((coef) => ({
      nom: coef.name,
      tranches: {
        ":29": asPercentage(coef.tranchesAges[0].ecartTauxRemuneration),
        "30:39": asPercentage(coef.tranchesAges[1].ecartTauxRemuneration),
        "40:49": asPercentage(coef.tranchesAges[2].ecartTauxRemuneration),
        "50:": asPercentage(coef.tranchesAges[3].ecartTauxRemuneration),
      },
    }))
  } else {
    const csp = ["ouv", "emp", "tam", "ic"]
    indicateur1.catégories = indicateurUn.remunerationAnnuelle.map((coef, index) => ({
      nom: csp[index],
      tranches: {
        ":29": asPercentage(coef.tranchesAges[0].ecartTauxRemuneration),
        "30:39": asPercentage(coef.tranchesAges[1].ecartTauxRemuneration),
        "40:49": asPercentage(coef.tranchesAges[2].ecartTauxRemuneration),
        "50:": asPercentage(coef.tranchesAges[3].ecartTauxRemuneration),
      },
    }))
  }

  if (state.informationsComplementaires.objectifIndicateurUn) {
    indicateur1.objectif_de_progression = state.informationsComplementaires.objectifIndicateurUn
  }

  return indicateur1
}

export type Indicateur2Calculable = {
  résultat: number | undefined
  note: number | undefined
  catégories: (number | undefined)[]
  population_favorable?: "hommes" | "femmes"
  objectif_de_progression?: string
}

type Indicateur2 = IndicateurNonCalculable | Indicateur2Calculable

// Indicateur 2 relatif à l'écart de taux d'augmentations individuelles(hors promotion) entre les femmes et les homme
const buildIndicateur2 = (state: AppState): Indicateur2 => {
  const indicateurDeux = state.indicateurDeux as AppState["indicateurDeux"] & DeclarationIndicateurDeuxData

  if (indicateurDeux.motifNonCalculable) {
    return { non_calculable: indicateurDeux.motifNonCalculable }
  }
  const indicateur2: Indicateur2Calculable = {
    résultat: indicateurDeux.resultatFinal,
    note: indicateurDeux.noteFinale,
    catégories: indicateurDeux.tauxAugmentation.map((cat) => asPercentage(cat.ecartTauxAugmentation)),
    ...(indicateurDeux.sexeSurRepresente && { population_favorable: indicateurDeux.sexeSurRepresente }),
  }

  if (state.informationsComplementaires.objectifIndicateurDeux) {
    indicateur2.objectif_de_progression = state.informationsComplementaires.objectifIndicateurDeux
  }

  return indicateur2
}

export type Indicateur3Calculable = {
  résultat: number | undefined
  note: number | undefined
  catégories: (number | undefined)[]
  population_favorable?: "hommes" | "femmes"
  objectif_de_progression?: string
}

type Indicateur3 = IndicateurNonCalculable | Indicateur3Calculable

// Indicateur 3 relatif à l'écart de taux de promotions entre les femmes et les hommes
const buildIndicateur3 = (state: AppState): Indicateur3 => {
  const indicateurTrois = state.indicateurTrois as AppState["indicateurTrois"] & DeclarationIndicateurTroisData

  if (indicateurTrois.motifNonCalculable) {
    return { non_calculable: indicateurTrois.motifNonCalculable }
  }
  const indicateur3: Indicateur3Calculable = {
    résultat: indicateurTrois.resultatFinal,
    note: indicateurTrois.noteFinale,
    catégories: indicateurTrois.tauxPromotion.map((cat) => asPercentage(cat.ecartTauxPromotion)),
    ...(indicateurTrois.sexeSurRepresente && { population_favorable: indicateurTrois.sexeSurRepresente }),
  }

  if (state.informationsComplementaires.objectifIndicateurTrois) {
    indicateur3.objectif_de_progression = state.informationsComplementaires.objectifIndicateurTrois
  }

  return indicateur3
}

export type Indicateur2et3Calculable = {
  résultat: number | undefined
  note_en_pourcentage: number | undefined
  résultat_nombre_salariés: number | undefined
  note_nombre_salariés: number | undefined
  note: number | undefined
  population_favorable?: "femmes" | "hommes" | undefined
  objectif_de_progression?: string
}

type Indicateur2et3 = IndicateurNonCalculable | Indicateur2et3Calculable

// Indicateur 2et3 relatif à l'écart de taux d'augmentations individuelles entre les femmes et les homme pour les entreprises de 250 salariés ou moins
const buildIndicateur2et3 = (state: AppState): Indicateur2et3 => {
  const indicateurDeuxTrois = state.indicateurDeuxTrois as AppState["indicateurDeuxTrois"] &
    DeclarationIndicateurDeuxTroisData

  if (indicateurDeuxTrois.motifNonCalculable) {
    return { non_calculable: indicateurDeuxTrois.motifNonCalculable }
  }

  const indicateur2et3: Indicateur2et3Calculable = {
    résultat: indicateurDeuxTrois.resultatFinalEcart,
    note_en_pourcentage: indicateurDeuxTrois.noteEcart,
    résultat_nombre_salariés: indicateurDeuxTrois.resultatFinalNombreSalaries,
    note_nombre_salariés: indicateurDeuxTrois.noteNombreSalaries,
    note: indicateurDeuxTrois.noteFinale,
    ...(indicateurDeuxTrois.sexeSurRepresente && { population_favorable: indicateurDeuxTrois.sexeSurRepresente }),
  }

  if (state.informationsComplementaires.objectifIndicateurDeuxTrois) {
    indicateur2et3.objectif_de_progression = state.informationsComplementaires.objectifIndicateurDeuxTrois
  }

  return indicateur2et3
}

export type Indicateur4Calculable = {
  résultat: number | undefined
  note: number | undefined
  objectif_de_progression?: string
}

type Indicateur4 = IndicateurNonCalculable | Indicateur4Calculable

// Indicateur 4 relatif au pourcentage de salariées ayant bénéficié d'une augmentation dans l'année suivant leur retour de congé de maternité
const buildIndicateur4 = (state: AppState): Indicateur4 => {
  const indicateurQuatre = state.indicateurQuatre as AppState["indicateurQuatre"] & DeclarationIndicateurQuatreData

  if (indicateurQuatre.motifNonCalculable) {
    return { non_calculable: indicateurQuatre.motifNonCalculable.replace("absretcm", "absrcm") }
  }

  const indicateur4: Indicateur4Calculable = {
    résultat: indicateurQuatre.resultatFinal,
    note: indicateurQuatre.noteFinale,
  }

  if (state.informationsComplementaires.objectifIndicateurQuatre) {
    indicateur4.objectif_de_progression = state.informationsComplementaires.objectifIndicateurQuatre
  }

  return indicateur4
}

export type Indicateur5 = {
  population_favorable?: "femmes" | "hommes" | undefined
  résultat: number | undefined
  note: number | undefined
  objectif_de_progression?: string
}

// Indicateur 5 relatif au nombre de salariés du sexe sous- représenté parmi les 10 salariés ayant perçu les plus hautes rémunérations
const buildIndicateur5 = (state: AppState): Indicateur5 => {
  const indicateurCinq = state.indicateurCinq as AppState["indicateurCinq"] & DeclarationIndicateurCinqData

  const indicateur5: Indicateur5 = {
    résultat: indicateurCinq.resultatFinal,
    note: indicateurCinq.noteFinale,
    ...(indicateurCinq.sexeSurRepresente &&
      indicateurCinq.sexeSurRepresente !== "egalite" && { population_favorable: indicateurCinq.sexeSurRepresente }),
  }

  if (state.informationsComplementaires.objectifIndicateurCinq) {
    indicateur5.objectif_de_progression = state.informationsComplementaires.objectifIndicateurCinq
  }

  return indicateur5
}

// Compute and gather all useful data from state, like noteIndex, note of each indicateur, effectifs, etc.
export function computeValuesFromState(state: AppState) {
  const trancheEffectifs = state.informations.trancheEffectifs

  const { totalNombreSalariesHomme, totalNombreSalariesFemme } = totalNombreSalaries(state.effectif.nombreSalaries)

  const periodeSuffisante = state.informations.periodeSuffisante as boolean

  const {
    effectifsIndicateurCalculable: effectifsIndicateurUnCalculable,
    effectifEtEcartRemuParTranche,
    indicateurEcartRemuneration,
    indicateurSexeSurRepresente: indicateurUnSexeSurRepresente,
    noteIndicateurUn,
  } = calculIndicateurUn(state)

  const {
    effectifsIndicateurCalculable: effectifsIndicateurDeuxCalculable,
    indicateurCalculable: indicateurDeuxCalculable,
    effectifEtEcartAugmentParGroupe,
    indicateurEcartAugmentation,
    indicateurSexeSurRepresente: indicateurDeuxSexeSurRepresente,
    correctionMeasure: indicateurDeuxCorrectionMeasure,
    noteIndicateurDeux,
  } = calculIndicateurDeux(state)

  const {
    effectifsIndicateurCalculable: effectifsIndicateurTroisCalculable,
    indicateurCalculable: indicateurTroisCalculable,
    effectifEtEcartPromoParGroupe,
    indicateurEcartPromotion,
    indicateurSexeSurRepresente: indicateurTroisSexeSurRepresente,
    correctionMeasure: indicateurTroisCorrectionMeasure,
    noteIndicateurTrois,
  } = calculIndicateurTrois(state)

  const {
    effectifsIndicateurCalculable: effectifsIndicateurDeuxTroisCalculable,
    indicateurCalculable: indicateurDeuxTroisCalculable,
    indicateurEcartAugmentationPromotion,
    indicateurEcartNombreEquivalentSalaries,
    indicateurSexeSurRepresente: indicateurDeuxTroisSexeSurRepresente,
    noteEcartTaux: noteEcart,
    noteEcartNombreSalaries: noteNombreSalaries,
    correctionMeasure: indicateurDeuxTroisCorrectionMeasure,
    noteIndicateurDeuxTrois,
    tauxAugmentationPromotionHommes,
    tauxAugmentationPromotionFemmes,
    plusPetitNombreSalaries,
  } = calculIndicateurDeuxTrois(state)

  const {
    indicateurCalculable: indicateurQuatreCalculable,
    indicateurEcartNombreSalarieesAugmentees,
    noteIndicateurQuatre,
  } = calculIndicateurQuatre(state)

  const {
    indicateurSexeSousRepresente: indicateurCinqSexeSousRepresente,
    indicateurNombreSalariesSexeSousRepresente,
    noteIndicateurCinq,
  } = calculIndicateurCinq(state)

  const allIndicateurValid =
    (state.indicateurUn.formValidated === "Valid" ||
      // Si l'indicateurUn n'est pas calculable par coefficient, forcer le calcul par CSP
      (!effectifsIndicateurUnCalculable && state.indicateurUn.csp)) &&
    (trancheEffectifs !== "50 à 250"
      ? (state.indicateurDeux.formValidated === "Valid" || !effectifsIndicateurDeuxCalculable) &&
        (state.indicateurTrois.formValidated === "Valid" || !effectifsIndicateurTroisCalculable)
      : state.indicateurDeuxTrois.formValidated === "Valid" || !effectifsIndicateurDeuxTroisCalculable) &&
    state.indicateurQuatre.formValidated === "Valid" &&
    state.indicateurCinq.formValidated === "Valid"

  const { noteIndex, totalPoint, totalPointCalculable } = calculNoteIndex(
    trancheEffectifs,
    noteIndicateurUn,
    noteIndicateurDeux,
    noteIndicateurTrois,
    noteIndicateurDeuxTrois,
    noteIndicateurQuatre,
    noteIndicateurCinq,
  )

  return {
    trancheEffectifs,
    periodeSuffisante,
    allIndicateurValid,
    noteIndex,
    totalPoint,
    totalPointCalculable,
    totalNombreSalariesHomme,
    totalNombreSalariesFemme,

    indicateurUn: {
      effectifsIndicateurUnCalculable,
      effectifEtEcartRemuParTranche,
      indicateurEcartRemuneration,
      indicateurUnSexeSurRepresente,
      noteIndicateurUn,
    },

    indicateurDeux: {
      effectifsIndicateurDeuxCalculable,
      indicateurDeuxCalculable,
      effectifEtEcartAugmentParGroupe,
      indicateurEcartAugmentation,
      indicateurDeuxSexeSurRepresente,
      noteIndicateurDeux,
      indicateurDeuxCorrectionMeasure,
    },

    indicateurTrois: {
      effectifsIndicateurTroisCalculable,
      indicateurTroisCalculable,
      effectifEtEcartPromoParGroupe,
      indicateurEcartPromotion,
      indicateurTroisSexeSurRepresente,
      noteIndicateurTrois,
      indicateurTroisCorrectionMeasure,
    },

    indicateurDeuxTrois: {
      effectifsIndicateurDeuxTroisCalculable,
      indicateurDeuxTroisCalculable,
      indicateurEcartAugmentationPromotion,
      indicateurEcartNombreEquivalentSalaries,
      indicateurDeuxTroisSexeSurRepresente,
      noteIndicateurDeuxTrois,
      indicateurDeuxTroisCorrectionMeasure,
      noteEcart,
      noteNombreSalaries,
      tauxAugmentationPromotionHommes,
      tauxAugmentationPromotionFemmes,
      plusPetitNombreSalaries,
    },

    indicateurQuatre: {
      indicateurQuatreCalculable,
      indicateurEcartNombreSalarieesAugmentees,
      noteIndicateurQuatre,
    },

    indicateurCinq: {
      indicateurCinqSexeSousRepresente,
      indicateurNombreSalariesSexeSousRepresente,
      noteIndicateurCinq,
    },
  }
}

export function updateDeclarationWithObjectifsMesures(
  declaration: DeclarationForAPI,
  data: ObjectifsMesuresFormSchema,
): DeclarationForAPI {
  const rémunérations = !declaration.data.indicateurs
    ? null
    : isNonCalculable(declaration.data.indicateurs?.rémunérations)
    ? null
    : {
        ...declaration.data.indicateurs.rémunérations,
        ...(data.objectifIndicateurUn && { objectif_de_progression: data.objectifIndicateurUn }),
      }

  const augmentations = !declaration.data.indicateurs?.augmentations
    ? null
    : isNonCalculable(declaration.data.indicateurs?.augmentations)
    ? null
    : {
        ...declaration.data.indicateurs.augmentations,
        ...(data.objectifIndicateurDeux && { objectif_de_progression: data.objectifIndicateurDeux }),
      }

  const promotions = !declaration.data.indicateurs?.promotions
    ? null
    : isNonCalculable(declaration.data.indicateurs?.promotions)
    ? null
    : {
        ...declaration.data.indicateurs.promotions,
        ...(data.objectifIndicateurTrois && { objectif_de_progression: data.objectifIndicateurTrois }),
      }

  const augmentations_et_promotions = !declaration.data.indicateurs?.augmentations_et_promotions
    ? null
    : isNonCalculable(declaration.data.indicateurs?.augmentations_et_promotions)
    ? null
    : {
        ...declaration.data.indicateurs.augmentations_et_promotions,
        ...(data.objectifIndicateurDeuxTrois && { objectif_de_progression: data.objectifIndicateurDeuxTrois }),
      }

  const congés_maternité = !declaration.data.indicateurs
    ? null
    : isNonCalculable(declaration.data.indicateurs?.congés_maternité)
    ? null
    : {
        ...declaration.data.indicateurs.congés_maternité,
        ...(data.objectifIndicateurQuatre && { objectif_de_progression: data.objectifIndicateurQuatre }),
      }

  const hautes_rémunérations = !declaration.data.indicateurs
    ? null
    : {
        ...declaration.data.indicateurs.hautes_rémunérations,
        ...(data.objectifIndicateurCinq && { objectif_de_progression: data.objectifIndicateurCinq }),
      }

  const res: DeclarationForAPI = {
    ...declaration,
    data: {
      ...declaration.data,
      déclaration: {
        ...declaration.data.déclaration,
        publication: {
          ...declaration.data.déclaration.publication,
          ...(data.datePublicationMesures && { date_publication_mesures: toISOString(data.datePublicationMesures) }),
          ...(data.datePublicationObjectifs && {
            date_publication_objectifs: toISOString(data.datePublicationObjectifs),
          }),
          ...(data.modalitesPublicationObjectifsMesures && {
            modalités_objectifs_mesures: data.modalitesPublicationObjectifsMesures,
          }),
        },
      },

      ...(declaration.data.indicateurs && {
        indicateurs: {
          ...declaration.data.indicateurs,
          ...(rémunérations && { rémunérations }),
          ...(augmentations && { augmentations }),
          ...(promotions && { promotions }),
          ...(augmentations_et_promotions && { augmentations_et_promotions }),
          ...(congés_maternité && { congés_maternité }),
          ...(hautes_rémunérations && { hautes_rémunérations }),
        },
      }),
    },
  }

  return res
}

function isNonCalculable(indicateur: any): indicateur is IndicateurNonCalculable {
  return indicateur?.non_calculable !== undefined
}
