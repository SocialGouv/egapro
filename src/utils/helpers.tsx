import * as Sentry from "@sentry/react"
import { addYears, addDays, format, parse as rootParse, parseISO } from "date-fns"
import { regionCode, departementCode } from "../components/RegionsDepartements"

import { TranchesAges, CategorieSocioPro, AppState } from "../globals"

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

/* Utils */

export const roundDecimal = (num: number, decimal: number): number => {
  const mult = Math.pow(10, decimal)
  return Math.round(num * mult) / mult
}

export const fractionToPercentage = (num: number) => roundDecimal(num * 100, 5)

export const percentageToFraction = (num: number) => roundDecimal(num / 100, 5)

/* Dates */

export function parseDate(dateStr: string): Date | undefined {
  const parsed = parseISO(dateStr)
  if (parsed.toString() === "Invalid Date") {
    const rootParsed = rootParse(dateStr, "dd/MM/yyyy", new Date())
    if (rootParsed.toString() === "Invalid Date") {
      return
    }
    return rootParsed
  }
  return parsed
}

export function dateToString(date: Date | undefined): string {
  return date !== undefined ? format(date, "dd/MM/yyyy") : ""
}

export enum Year {
  Add,
  Subtract,
}

// Return a date that is exactly one year later or before:
// Eg: one year in the future: 2019-01-01 -> 2019-12-31
export function calendarYear(dateStr: string, operation: Year, numYears: number): string {
  // Adding a year: we subtract a day to the final result.
  // Subtracting a year: we add a day to the final result.
  const year = operation === Year.Add ? numYears : -numYears
  const day = operation === Year.Add ? -1 : 1
  const date = parseDate(dateStr)
  if (date === undefined) {
    return ""
  }
  const yearsAdded = addYears(date, year)
  const dayAdded = addDays(yearsAdded, day)
  return format(dayAdded, "dd/MM/yyyy")
}

/* Misc */

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

// Format the data from the AppReducer to be compatible with the API new format

const toISOString = (date: string) => {
  const parsed = parseDate(date)
  return parsed ? format(parsed, "yyyy-MM-dd") : undefined
}

export const formatDataForAPI = (id: string, data: AppState) => {
  // Indicateurs
  const output = {
    id,
    source: "simulateur",
    déclaration: getDeclaration(data),
    déclarant: getDeclarant(data),
    entreprise: getEntreprise(data),
    ...(data.informations.periodeSuffisante && { indicateurs: getIndicateurs(data) }),
  }

  return output
}

// Déclaration
const getDeclaration = (data: AppState): any => {
  const declaration: any = {
    année_indicateurs: data.informations.anneeDeclaration,
    période_suffisante: data.informations.periodeSuffisante,
    ...(data.informations.finPeriodeReference && {
      fin_période_référence: toISOString(data.informations.finPeriodeReference),
    }),
    ...(data.informations.periodeSuffisante && { points: data.declaration.totalPoint }),
    ...(data.informations.periodeSuffisante && { points_calculables: data.declaration.totalPointCalculable }),
  }

  if (data.informations.periodeSuffisante) {
    const index = data.declaration.noteIndex
    if (index !== undefined || (data.informations.anneeDeclaration && data.informations.anneeDeclaration >= 2020)) {
      declaration.publication = {
        date: toISOString(data.declaration.datePublication),
      }
      if (data.declaration.publicationSurSiteInternet) {
        declaration.publication.url = data.declaration.lienPublication
      } else {
        declaration.publication.modalités = data.declaration.modalitesPublication
      }
    }

    if (index !== undefined) {
      declaration.index = index
      if (index < 75) {
        declaration.mesures_correctives = data.declaration.mesuresCorrection
      }
    }
  }
  return declaration
}

// Déclarant
const getDeclarant = (data: AppState): any => {
  const declarant: any = {
    prénom: data.informationsDeclarant.prenom,
    nom: data.informationsDeclarant.nom,
    téléphone: data.informationsDeclarant.tel,
    email: data.informationsDeclarant.email,
  }
  return declarant
}

// Entreprise
const getEntreprise = (data: AppState): any => {
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

// Indicateurs
const getIndicateurs = (data: AppState): any => {
  const indicateurs: any = {
    rémunérations: getIndicateur1(data),
    congés_maternité: getIndicateur4(data),
    hautes_rémunérations: getIndicateur5(data),
  }
  if (data.informations.trancheEffectifs === "50 à 250") {
    indicateurs.augmentations_et_promotions = getIndicateur2et3(data)
  } else {
    indicateurs.augmentations = getIndicateur2(data)
    indicateurs.promotions = getIndicateur3(data)
  }
  return indicateurs
}

const asPercentage = (value: number | undefined) => {
  // Return `33` for "33%" (which is passed in as a value of 0.33)
  if (value !== undefined) {
    return value * 100
  }
}

// Indicateur 1 relatif à l'écart de rémunération entre les femmes et les hommes
const getIndicateur1 = (data: AppState): any => {
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
  return indicateur1
}

// Indicateur 2 relatif à l'écart de taux d'augmentations individuelles(hors promotion) entre les femmes et les homme
const getIndicateur2 = (data: AppState): any => {
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
  return indicateur2
}

// Indicateur 3 relatif à l'écart de taux de promotions entre les femmes et les hommes
const getIndicateur3 = (data: AppState): any => {
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
  return indicateur3
}

// Indicateur 2et3 relatif à l'écart de taux d'augmentations individuelles entre les femmes et les homme pour les entreprises de 250 salariés ou moins
const getIndicateur2et3 = (data: AppState): any => {
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
  return indicateur2et3
}

// Indicateur 4 relatif au pourcentage de salariées ayant bénéficié d'une augmentation dans l'année suivant leur retour de congé de maternité
const getIndicateur4 = (data: AppState): any => {
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
  return indicateur4
}

// Indicateur 5 relatif au nombre de salariés du sexe sous- représenté parmi les 10 salariés ayant perçu les plus hautes rémunérations
const getIndicateur5 = (data: AppState): any => {
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
  return indicateur5
}

/* SENTRY */
export function logToSentry(error: any, data: any) {
  if (process.env.REACT_APP_SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: data,
    })
  }
}
