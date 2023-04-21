import type {
  AppState,
  DeclarationIndicateurCinqData,
  DeclarationIndicateurDeuxData,
  DeclarationIndicateurDeuxTroisData,
  DeclarationIndicateurQuatreData,
  DeclarationIndicateurTroisData,
  SexeType,
  TrancheEffectifs,
  TrancheEffectifsAPI,
} from "../globals"

import { departementCode, regionCode } from "../components/RegionsDepartements"
import { toISOString } from "./date"
import { asPercentage } from "./number"

export type DeclarationAPI = {
  siren: string
  year: number
  data: DeclarationDataField
  modified_at: number
  declared_at: number
}

export type DeclarationDataField = {
  id?: string // id de la simulation initiale !! N'est pas rendu par l'API pour GET /declaration
  source: string
  déclarant: Declarant
  entreprise: Entreprise
  déclaration: Declaration
  indicateurs?: Indicateurs
}

/*
 * Transform the simulation in declaration.
 *
 * @param id the id of the simulation
 * @param state the state of the simulation
 * @param declarationBase the previous declaration if any
 */
export const buildDeclarationFromSimulation = ({
  id,
  state,
}: {
  id: string
  state: AppState
}): DeclarationDataField => {
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
  index?: number
  mesures_correctives?: string
  points_calculables?: number
  points?: number
  fin_période_référence?: string // undefined si période_suffisante est à false.
  année_indicateurs?: number
  période_suffisante?: boolean
  publication?: {
    date_publication_mesures?: string
    date_publication_objectifs?: string
    modalités_objectifs_mesures?: string
    modalités?: string
    url?: string
    date?: string
  }
}

// Déclaration
const buildDeclaration = (state: AppState): Declaration => {
  const index = state.declaration.noteIndex

  // Condition for adding mesuresCorrection.
  const mesuresCorrectionToBeAdded = index !== undefined && index < 75 && state.informations.periodeSuffisante

  const declaration: Declaration = {
    année_indicateurs: state.informations.anneeDeclaration,
    période_suffisante: state.informations.periodeSuffisante,
    ...(state.informations.finPeriodeReference && {
      fin_période_référence: toISOString(state.informations.finPeriodeReference),
    }),
    ...(state.informations.periodeSuffisante && { points: state.declaration.totalPoint }),
    ...(state.informations.periodeSuffisante && { points_calculables: state.declaration.totalPointCalculable }),
    ...(mesuresCorrectionToBeAdded && { mesures_correctives: state.declaration.mesuresCorrection }),
    ...(index && state.informations.periodeSuffisante && { index }),
  }

  if (state.informations.periodeSuffisante) {
    if (index !== undefined || (state.informations.anneeDeclaration && state.informations.anneeDeclaration >= 2020)) {
      declaration.publication = {
        date: toISOString(state.declaration.datePublication),
        ...(state.declaration.publicationSurSiteInternet && { url: state.declaration.lienPublication }),
        ...(!state.declaration.publicationSurSiteInternet && { modalités: state.declaration.modalitesPublication }),
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
  code_pays?: string
  code_postal?: string
  raison_sociale: string
  siren: string
  région: string
  département: string
  adresse: string
  commune: string
  ues?: {
    nom: string
    entreprises: Array<{
      raison_sociale: string
      siren: string
    }>
  }
  plan_relance?: boolean
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
  résultat?: number
  note?: number
  date_consultation_cse?: string
  population_favorable?: SexeType
  catégories?: Array<{
    nom: string
    tranches?: {
      ":29"?: number
      "30:39"?: number
      "40:49"?: number
      "50:"?: number
    }
  }>
  objectif_de_progression?: string
}

type Indicateur1 = IndicateurNonCalculable | Indicateur1Calculable

// Indicateur 1 relatif à l'écart de rémunération entre les femmes et les hommes
const buildIndicateur1 = (state: AppState): Indicateur1 => {
  const indicateurUn = state.indicateurUn

  if (indicateurUn.motifNonCalculable) {
    return { non_calculable: indicateurUn.motifNonCalculable }
  }
  const indicateur1: Indicateur1Calculable = {
    mode:
      state.indicateurUn.modaliteCalcul === "csp"
        ? "csp"
        : state.indicateurUn.modaliteCalcul === "coef"
        ? "niveau_branche"
        : "niveau_autre",
    résultat: indicateurUn.resultatFinal,
    note: indicateurUn.noteFinale,
    ...(indicateurUn.sexeSurRepresente && { population_favorable: indicateurUn.sexeSurRepresente }),
  }

  if (indicateur1.mode !== "csp") {
    indicateur1.date_consultation_cse = toISOString(state.declaration.dateConsultationCSE)
    indicateur1.catégories = indicateurUn.coefficients.map((coef) => ({
      nom: coef.nom,
      tranches: {
        ":29": asPercentage(coef.tranchesAges[0].ecartTauxRemuneration),
        "30:39": asPercentage(coef.tranchesAges[1].ecartTauxRemuneration),
        "40:49": asPercentage(coef.tranchesAges[2].ecartTauxRemuneration),
        "50:": asPercentage(coef.tranchesAges[3].ecartTauxRemuneration),
      },
    }))
  } else {
    const csp = ["ouv", "emp", "tam", "ic"]
    indicateur1.catégories = indicateurUn.remunerationsAnnuelles.map((coef, index) => ({
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

export type Indicateur2Calculable = {
  résultat?: number
  note?: number
  catégories: (number | undefined)[]
  population_favorable?: SexeType
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

  return indicateur2
}

export type Indicateur3Calculable = {
  résultat?: number
  note?: number
  catégories: (number | undefined)[]
  population_favorable?: SexeType
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

  return indicateur3
}

export type Indicateur2et3Calculable = {
  résultat?: number
  note_en_pourcentage?: number
  résultat_nombre_salariés?: number
  note_nombre_salariés?: number
  note?: number
  population_favorable?: SexeType
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

  return indicateur2et3
}

export type Indicateur4Calculable = {
  résultat?: number
  note?: number
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

  return indicateur4
}

export type Indicateur5 = {
  population_favorable?: SexeType
  résultat?: number
  note?: number
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

  return indicateur5
}
