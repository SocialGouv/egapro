import { regionCode, departementCode } from "../components/RegionsDepartements"

import { TranchesAges, CategorieSocioPro, AppState } from "../globals"
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

// Helpers for business models

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

export const formatDataForAPI = (id: string, state: AppState) => {
  // Indicateurs
  const output = {
    id,
    source: "simulateur",
    déclaration: buildDeclaration(state),
    déclarant: buildDeclarant(state),
    entreprise: buildEntreprise(state),
    ...(state.informations.periodeSuffisante && { indicateurs: buildIndicateurs(state) }),
  }

  // console.log(JSON.stringify({ output }, null, 2))

  return output
}

const buildDeclaration = (data: AppState): any => {
  const index = data.declaration.noteIndex
  const {
    datePublication,
    lienPublication,
    publicationSurSiteInternet,
    modalitesPublication,
    modalitesPublicationObjectifsMesures,
    datePublicationObjectifs,
    datePublicationMesures,
    mesuresCorrection,
  } = data.informationsComplementaires

  let declaration: any = {
    année_indicateurs: data.informations.anneeDeclaration,
    période_suffisante: data.informations.periodeSuffisante,
    ...(index && { index }),
  }

  if (data.informations.periodeSuffisante) {
    if (index !== undefined || (data.informations.anneeDeclaration && data.informations.anneeDeclaration >= 2020)) {
      const publication = {
        date: toISOString(datePublication),
        ...(publicationSurSiteInternet && { url: lienPublication }),
        ...(!publicationSurSiteInternet && { modalités: modalitesPublication }),
        ...(modalitesPublicationObjectifsMesures && {
          modalités_objectifs_mesures: modalitesPublicationObjectifsMesures,
        }),
        ...(datePublicationObjectifs && { date_publication_mesures: datePublicationObjectifs }),
        ...(datePublicationMesures && { date_publication_objectifs: datePublicationMesures }),
      }

      declaration = {
        ...declaration,
        ...(data.informations.finPeriodeReference && {
          fin_période_référence: toISOString(data.informations.finPeriodeReference),
        }),
        points: data.declaration.totalPoint,
        points_calculables: data.declaration.totalPointCalculable,
        ...(index !== undefined && index < 75 && { mesures_correctives: mesuresCorrection }),
        publication,
      }
    }
  }
  return declaration
}

const buildDeclarant = (data: AppState): any => {
  const declarant: any = {
    prénom: data.informationsDeclarant.prenom,
    nom: data.informationsDeclarant.nom,
    téléphone: data.informationsDeclarant.tel,
    email: data.informationsDeclarant.email,
  }
  return declarant
}

const buildEntreprise = (data: AppState): any => {
  const entreprise: any = {
    raison_sociale: data.informationsEntreprise.nomEntreprise,
    siren: data.informationsEntreprise.siren,
    région: regionCode[data.informationsEntreprise.region],
    département: departementCode[data.informationsEntreprise.departement],
    adresse: data.informationsEntreprise.adresse,
    commune: data.informationsEntreprise.commune,
    ...(data.informationsEntreprise.codePostal && { code_postal: data.informationsEntreprise.codePostal }),
    ...(data.informationsEntreprise.codePays && { code_pays: data.informationsEntreprise.codePays }),
    code_naf: data.informationsEntreprise.codeNaf.split(" ")[0], // Only get the code like "01.22Z"
    effectif: {
      // @ts-ignore
      ...(data.informations.periodeSuffisante && { total: data.effectif.nombreSalariesTotal }),
      tranche:
        data.informations.trancheEffectifs === "50 à 250"
          ? "50:250"
          : data.informations.trancheEffectifs === "251 à 999"
          ? "251:999"
          : "1000:",
    },
  }
  if (data.informationsEntreprise.structure !== "Entreprise") {
    entreprise.ues = {
      nom: data.informationsEntreprise.nomUES,
      entreprises: data.informationsEntreprise.entreprisesUES.map(({ nom, siren }) => ({ raison_sociale: nom, siren })),
    }
  }

  if (
    data.informations.periodeSuffisante &&
    data.informations.anneeDeclaration &&
    data.informations.anneeDeclaration >= 2021
  ) {
    entreprise.plan_relance = data.declaration.planRelance
  }

  return entreprise
}

const buildIndicateurs = (data: AppState): any => {
  const indicateurs: any = {
    rémunérations: buildIndicateur1(data),
    congés_maternité: buildIndicateur4(data),
    hautes_rémunérations: buildIndicateur5(data),
  }
  if (data.informations.trancheEffectifs === "50 à 250") {
    indicateurs.augmentations_et_promotions = buildIndicateur2et3(data)
  } else {
    indicateurs.augmentations = buildIndicateur2(data)
    indicateurs.promotions = buildIndicateur3(data)
  }
  return indicateurs
}

// Indicateur 1 relatif à l'écart de rémunération entre les femmes et les hommes
const buildIndicateur1 = (data: AppState): any => {
  // @ts-ignore
  const motif = data.indicateurUn.motifNonCalculable
  if (motif) {
    return { non_calculable: motif }
  }
  const indicateur1: any = {
    mode: data.indicateurUn.csp ? "csp" : data.indicateurUn.coef ? "niveau_branche" : "niveau_autre",
    // @ts-ignore
    résultat: data.indicateurUn.resultatFinal,
    // @ts-ignore
    note: data.indicateurUn.noteFinale,
  }
  // @ts-ignore
  const sexeSurRepresente = data.indicateurUn.sexeSurRepresente
  if (sexeSurRepresente && sexeSurRepresente !== "egalite") {
    indicateur1.population_favorable = sexeSurRepresente
  }
  if (indicateur1.mode !== "csp") {
    indicateur1.date_consultation_cse = toISOString(data.declaration.dateConsultationCSE)
    indicateur1.catégories = data.indicateurUn.coefficient.map((coef) => ({
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
    indicateur1.catégories = data.indicateurUn.remunerationAnnuelle.map((coef, index) => ({
      nom: csp[index],
      tranches: {
        ":29": asPercentage(coef.tranchesAges[0].ecartTauxRemuneration),
        "30:39": asPercentage(coef.tranchesAges[1].ecartTauxRemuneration),
        "40:49": asPercentage(coef.tranchesAges[2].ecartTauxRemuneration),
        "50:": asPercentage(coef.tranchesAges[3].ecartTauxRemuneration),
      },
    }))
  }

  if (data.informationsComplementaires.objectifIndicateurUn) {
    indicateur1.objectif_de_progression = data.informationsComplementaires.objectifIndicateurUn
  }

  return indicateur1
}

// Indicateur 2 relatif à l'écart de taux d'augmentations individuelles(hors promotion) entre les femmes et les homme
const buildIndicateur2 = (data: AppState): any => {
  // @ts-ignore
  const motif = data.indicateurDeux.motifNonCalculable
  if (motif) {
    return { non_calculable: motif }
  }
  // @ts-ignore
  const indicateur2: any = {
    // @ts-ignore
    résultat: data.indicateurDeux.resultatFinal,
    // @ts-ignore
    note: data.indicateurDeux.noteFinale,
    catégories: data.indicateurDeux.tauxAugmentation.map((cat) => asPercentage(cat.ecartTauxAugmentation)),
  }
  // @ts-ignore
  const sexeSurRepresente = data.indicateurDeux.sexeSurRepresente
  if (sexeSurRepresente && sexeSurRepresente !== "egalite") {
    indicateur2.population_favorable = sexeSurRepresente
  }

  if (data.informationsComplementaires.objectifIndicateurDeux) {
    indicateur2.objectif_de_progression = data.informationsComplementaires.objectifIndicateurDeux
  }

  return indicateur2
}

// Indicateur 3 relatif à l'écart de taux de promotions entre les femmes et les hommes
const buildIndicateur3 = (data: AppState): any => {
  // @ts-ignore
  const motif = data.indicateurTrois.motifNonCalculable
  if (motif) {
    return { non_calculable: motif }
  }
  // @ts-ignore
  const indicateur3: any = {
    // @ts-ignore
    résultat: data.indicateurTrois.resultatFinal,
    // @ts-ignore
    note: data.indicateurTrois.noteFinale,
    catégories: data.indicateurTrois.tauxPromotion.map((cat) => asPercentage(cat.ecartTauxPromotion)),
  }
  // @ts-ignore
  const sexeSurRepresente = data.indicateurTrois.sexeSurRepresente
  if (sexeSurRepresente && sexeSurRepresente !== "egalite") {
    indicateur3.population_favorable = sexeSurRepresente
  }

  if (data.informationsComplementaires.objectifIndicateurTrois) {
    indicateur3.objectif_de_progression = data.informationsComplementaires.objectifIndicateurTrois
  }

  return indicateur3
}

// Indicateur 2et3 relatif à l'écart de taux d'augmentations individuelles entre les femmes et les homme pour les entreprises de 250 salariés ou moins
const buildIndicateur2et3 = (data: AppState): any => {
  // @ts-ignore
  const motif = data.indicateurDeuxTrois.motifNonCalculable
  if (motif) {
    return { non_calculable: motif }
  }
  const indicateur2et3: any = {
    // @ts-ignore
    résultat: data.indicateurDeuxTrois.resultatFinalEcart,
    // @ts-ignore
    note_en_pourcentage: data.indicateurDeuxTrois.noteEcart,
    résultat_nombre_salariés:
      // @ts-ignore
      data.indicateurDeuxTrois.resultatFinalNombreSalaries,
    // @ts-ignore
    note_nombre_salariés: data.indicateurDeuxTrois.noteNombreSalaries,
    // @ts-ignore
    note: data.indicateurDeuxTrois.noteFinale,
  }
  // @ts-ignore
  const sexeSurRepresente = data.indicateurDeuxTrois.sexeSurRepresente
  if (sexeSurRepresente && sexeSurRepresente !== "egalite") {
    indicateur2et3.population_favorable = sexeSurRepresente
  }

  if (data.informationsComplementaires.objectifIndicateurDeuxTrois) {
    indicateur2et3.objectif_de_progression = data.informationsComplementaires.objectifIndicateurDeuxTrois
  }

  return indicateur2et3
}

// Indicateur 4 relatif au pourcentage de salariées ayant bénéficié d'une augmentation dans l'année suivant leur retour de congé de maternité
const buildIndicateur4 = (data: AppState): any => {
  // @ts-ignore
  const motif = data.indicateurQuatre.motifNonCalculable
  if (motif) {
    return { non_calculable: motif.replace("absretcm", "absrcm") }
  }
  const indicateur4: any = {
    // @ts-ignore
    résultat: data.indicateurQuatre.resultatFinal,
    // @ts-ignore
    note: data.indicateurQuatre.noteFinale,
  }

  if (data.informationsComplementaires.objectifIndicateurQuatre) {
    indicateur4.objectif_de_progression = data.informationsComplementaires.objectifIndicateurQuatre
  }

  return indicateur4
}

// Indicateur 5 relatif au nombre de salariés du sexe sous- représenté parmi les 10 salariés ayant perçu les plus hautes rémunérations
const buildIndicateur5 = (data: AppState): any => {
  // @ts-ignore
  const motif = data.indicateurCinq.motifNonCalculable
  if (motif) {
    return { non_calculable: motif }
  }
  const indicateur5: any = {
    // @ts-ignore
    résultat: data.indicateurCinq.resultatFinal,
    // @ts-ignore
    note: data.indicateurCinq.noteFinale,
  }
  // @ts-ignore
  const sexeSurRepresente = data.indicateurCinq.sexeSurRepresente
  if (sexeSurRepresente && sexeSurRepresente !== "egalite") {
    indicateur5.population_favorable = sexeSurRepresente
  }

  if (data.informationsComplementaires.objectifIndicateurCinq) {
    indicateur5.objectif_de_progression = data.informationsComplementaires.objectifIndicateurCinq
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
