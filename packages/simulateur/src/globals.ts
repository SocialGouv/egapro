// AppState is like a store which represents the state of the wizard in the simulation. Declaration has another shape (see DeclarationTotale).
export type AppState = {
  informations: {
    formValidated: FormState
    nomEntreprise: string
    trancheEffectifs: TrancheEffectifs
    anneeDeclaration: number | undefined // uniquement un number quand une déclaration est valide
    finPeriodeReference?: string
    periodeSuffisante: boolean | undefined // uniquement un boolean quand une déclaration est valide
  }
  effectif: {
    formValidated: FormState
    nombreSalaries: Array<GroupeEffectif>
  } & Partial<DeclarationEffectifData>
  indicateurUn: {
    formValidated: FormState
    csp: boolean
    coef: boolean
    autre: boolean
    remunerationAnnuelle: Array<GroupeIndicateurUn>
    coefficientGroupFormValidated: FormState
    coefficientEffectifFormValidated: FormState
    coefficient: Array<GroupeCoefficient>
  } & Partial<DeclarationIndicateurUnData>
  indicateurDeux: {
    formValidated: FormState
    presenceAugmentation: boolean
    tauxAugmentation: Array<GroupeIndicateurDeux>
  } & Partial<DeclarationIndicateurDeuxData>
  indicateurTrois: {
    formValidated: FormState
    presencePromotion: boolean
    tauxPromotion: Array<GroupeIndicateurTrois>
  } & Partial<DeclarationIndicateurTroisData>
  indicateurDeuxTrois: {
    formValidated: FormState
    presenceAugmentationPromotion: boolean
    nombreAugmentationPromotionFemmes?: number | undefined
    nombreAugmentationPromotionHommes?: number | undefined
    periodeDeclaration: PeriodeDeclaration
  } & Partial<DeclarationIndicateurDeuxTroisData>
  indicateurQuatre: {
    formValidated: FormState
    presenceCongeMat: boolean
    nombreSalarieesPeriodeAugmentation?: number | undefined
    nombreSalarieesAugmentees?: number | undefined
  } & Partial<DeclarationIndicateurQuatreData>
  indicateurCinq: {
    formValidated: FormState
    nombreSalariesHommes?: number | undefined
    nombreSalariesFemmes?: number | undefined
  } & Partial<DeclarationIndicateurCinqData>
  informationsEntreprise: {
    formValidated: FormState
    nomEntreprise: string
    siren: string
    codeNaf: string
    region: string
    departement: string
    adresse: string
    codePostal: string
    codePays: string
    commune: string
    structure: Structure
    nomUES: string
    nombreEntreprises?: number | undefined
    entreprisesUES: Array<EntrepriseUES>
  }
  informationsDeclarant: {
    formValidated: FormState
    nom: string
    prenom: string
    tel: string
    email: string
    acceptationCGU: boolean
  }
  declaration: {
    formValidated: FormState
    mesuresCorrection: string
    cseMisEnPlace?: boolean | undefined
    dateConsultationCSE: string
    datePublication: string
    publicationSurSiteInternet?: boolean | undefined // uniquement un boolean quand une déclaration est valide
    lienPublication: string
    planRelance: boolean | undefined // uniquement un boolean quand une déclaration est valide
    modalitesPublication: string
    dateDeclaration: string
    noteIndex?: number | undefined
    totalPoint: number
    totalPointCalculable: number
  }
}

export type PeriodeDeclaration = "unePeriodeReference" | "deuxPeriodesReference" | "troisPeriodesReference"

// TrancheEffectifs uniquement utilisé par les Forms. Pour le retour d'API, on a un autre format (ex: "1000:")
export type TrancheEffectifs = "50 à 250" | "251 à 999" | "1000 et plus"

export type TrancheEffectifsAPI = "50:250" | "251:999" | "1000:"

export type FormState = "None" | "Valid" | "Invalid"

export type Structure = "Entreprise" | "Unité Economique et Sociale (UES)"

export interface EntrepriseUES {
  nom: string
  siren: string
}

export type ActionType =
  | {
      type: "resetState"
    }
  | {
      type: "initiateState"
      data: any
    }
  | {
      type: "updateInformationsSimulation"
      data: ActionInformationsSimulationData
    }
  | {
      type: "validateInformationsSimulation"
      valid: FormState
    }
  | {
      type: "updateEffectif"
      data: ActionEffectifData
    }
  | {
      type: "validateEffectif"
      valid: FormState
    }
  | {
      type: "updateIndicateurUnType"
      data: ActionIndicateurUnTypeData
    }
  | {
      type: "updateIndicateurUnCsp"
      data: ActionIndicateurUnCspData
    }
  | {
      type: "updateIndicateurUnCoefAddGroup"
    }
  | {
      type: "updateIndicateurUnCoefDeleteGroup"
      index: number
    }
  | {
      type: "updateIndicateurUnCoef"
      data: ActionIndicateurUnCoefData
    }
  | {
      type: "validateIndicateurUnCoefGroup"
      valid: FormState
    }
  | {
      type: "validateIndicateurUnCoefEffectif"
      valid: FormState
    }
  | {
      type: "validateIndicateurUn"
      valid: FormState
    }
  | {
      type: "updateIndicateurDeux"
      data: ActionIndicateurDeuxData
    }
  | {
      type: "validateIndicateurDeux"
      valid: FormState
    }
  | {
      type: "updateIndicateurTrois"
      data: ActionIndicateurTroisData
    }
  | {
      type: "validateIndicateurTrois"
      valid: FormState
    }
  | {
      type: "updateIndicateurDeuxTrois"
      data: ActionIndicateurDeuxTroisData
    }
  | {
      type: "validateIndicateurDeuxTrois"
      valid: FormState
    }
  | {
      type: "updateIndicateurQuatre"
      data: ActionIndicateurQuatreData
    }
  | {
      type: "validateIndicateurQuatre"
      valid: FormState
    }
  | {
      type: "updateIndicateurCinq"
      data: ActionIndicateurCinqData
    }
  | {
      type: "validateIndicateurCinq"
      valid: FormState
    }
  | {
      type: "updateInformationsEntreprise"
      data: ActionInformationsEntrepriseData
    }
  | {
      type: "validateInformationsEntreprise"
      valid: FormState
    }
  | {
      type: "updateInformationsDeclarant"
      data: ActionInformationsDeclarantData
    }
  | {
      type: "validateInformationsDeclarant"
      valid: FormState
    }
  | {
      type: "updateDeclaration"
      data: ActionDeclarationData
    }
  | {
      type: "validateDeclaration"
      valid: FormState
      effectifData: DeclarationEffectifData
      indicateurUnData: DeclarationIndicateurUnData
      indicateurDeuxData: DeclarationIndicateurDeuxData
      indicateurTroisData: DeclarationIndicateurTroisData
      indicateurDeuxTroisData: DeclarationIndicateurDeuxTroisData
      indicateurQuatreData: DeclarationIndicateurQuatreData
      indicateurCinqData: DeclarationIndicateurCinqData
      noteIndex: number | undefined
      totalPoint: number
      totalPointCalculable: number
    }
  | {
      type: "updateEmailDeclarant"
      data: ActionEmailDeclarantData
    }

export type ActionInformationsSimulationData = {
  nomEntreprise: string
  trancheEffectifs: TrancheEffectifs
  anneeDeclaration: number | undefined
  finPeriodeReference?: string
  periodeSuffisante: boolean | undefined
}

export type ActionEffectifData = {
  nombreSalaries: Array<GroupeEffectif>
}

export type DeclarationEffectifData = {
  nombreSalariesTotal: number
}

export type ActionIndicateurUnTypeData = {
  csp: boolean
  coef: boolean
  autre: boolean
}

export type ActionIndicateurUnCspData = {
  remunerationAnnuelle: Array<GroupeIndicateurUn>
}

export type ActionIndicateurUnCoefData = {
  coefficient:
    | Array<{ name: string }>
    | Array<{
        tranchesAges: Array<GroupTranchesAgesEffectif>
      }>
    | Array<{
        tranchesAges: Array<GroupTranchesAgesIndicateurUn>
      }>
}

export type DeclarationIndicateurUnData = {
  nombreCoefficients: number | undefined
  nonCalculable: boolean
  motifNonCalculable: "" | "egvi40pcet"
  remunerationAnnuelle: Array<GroupeIndicateurUn>
  coefficient: Array<GroupeCoefficient>
  resultatFinal: number | undefined
  sexeSurRepresente: undefined | "femmes" | "hommes"
  noteFinale: number | undefined
}

export type ActionIndicateurDeuxData = {
  presenceAugmentation: boolean
  tauxAugmentation: Array<GroupeIndicateurDeux>
}

export type DeclarationIndicateurDeuxData = {
  nonCalculable: boolean
  motifNonCalculable: "" | "egvi40pcet" | "absaugi"

  tauxAugmentation: Array<GroupeIndicateurDeux>
  resultatFinal: number | undefined
  sexeSurRepresente: undefined | "femmes" | "hommes"
  noteFinale: number | undefined
  mesuresCorrection: boolean
}

export type ActionIndicateurTroisData = {
  presencePromotion: boolean
  tauxPromotion: Array<GroupeIndicateurTrois>
}

export type DeclarationIndicateurTroisData = {
  nonCalculable: boolean
  motifNonCalculable: "" | "egvi40pcet" | "absprom"

  tauxPromotion: Array<GroupeIndicateurTrois>
  resultatFinal: number | undefined
  sexeSurRepresente: undefined | "femmes" | "hommes"
  noteFinale: number | undefined
  mesuresCorrection: boolean
}

export type ActionIndicateurDeuxTroisData = {
  presenceAugmentationPromotion: boolean
  nombreAugmentationPromotionFemmes: number | undefined
  nombreAugmentationPromotionHommes: number | undefined
  periodeDeclaration: PeriodeDeclaration
}

export type DeclarationIndicateurDeuxTroisData = {
  nonCalculable: boolean
  motifNonCalculable: "" | "etsno5f5h" | "absaugi"

  resultatFinalEcart: number | undefined
  resultatFinalNombreSalaries: number | undefined
  sexeSurRepresente: undefined | "femmes" | "hommes"
  noteEcart: number | undefined
  noteNombreSalaries: number | undefined
  noteFinale: number | undefined
  mesuresCorrection: boolean
}

export type DateInterval = {
  start: Date
  end: Date
}

export type ActionIndicateurQuatreData = {
  presenceCongeMat: boolean
  nombreSalarieesPeriodeAugmentation: number | undefined
  nombreSalarieesAugmentees: number | undefined
}

export type DeclarationIndicateurQuatreData = {
  nonCalculable: boolean
  motifNonCalculable: "" | "absaugpdtcm" | "absretcm"

  resultatFinal: number | undefined
  noteFinale: number | undefined
}

export type ActionIndicateurCinqData = {
  nombreSalariesHommes: number | undefined
  nombreSalariesFemmes: number | undefined
}

export type DeclarationIndicateurCinqData = {
  resultatFinal: number | undefined
  sexeSurRepresente: undefined | "egalite" | "femmes" | "hommes"
  noteFinale: number | undefined
}

export type ActionInformationsEntrepriseData = {
  nomEntreprise: string
  siren: string
  codeNaf: string
  region: string
  departement: string
  adresse: string
  codePostal: string
  codePays: string
  commune: string
  structure: Structure
  nomUES: string
  nombreEntreprises: number | undefined
  entreprisesUES: Array<EntrepriseUES>
}

export type ActionInformationsDeclarantData = {
  nom: string
  prenom: string
  tel: string
  email: string
  acceptationCGU: boolean
}

export type ActionDeclarationData = {
  mesuresCorrection: string
  cseMisEnPlace?: boolean | undefined
  dateConsultationCSE: string
  datePublication: string
  publicationSurSiteInternet?: boolean | undefined
  lienPublication: string
  modalitesPublication: string
  planRelance: boolean | undefined
}

export type ActionEmailDeclarantData = {
  email: string
}

////

export enum TranchesAges {
  MoinsDe30ans,
  De30a39ans,
  De40a49ans,
  PlusDe50ans,
}

export enum CategorieSocioPro {
  Ouvriers,
  Employes,
  Techniciens,
  Cadres,
}

export interface GroupTranchesAgesEffectif {
  trancheAge: TranchesAges
  nombreSalariesFemmes?: number | undefined
  nombreSalariesHommes?: number | undefined
}

export interface GroupeEffectif {
  categorieSocioPro: CategorieSocioPro
  tranchesAges: Array<GroupTranchesAgesEffectif>
}

export interface GroupTranchesAgesIndicateurUn {
  trancheAge: TranchesAges
  remunerationAnnuelleBrutFemmes?: number | undefined
  remunerationAnnuelleBrutHommes?: number | undefined
  ecartTauxRemuneration?: number | undefined
}

export interface GroupeIndicateurUn {
  categorieSocioPro: CategorieSocioPro
  tranchesAges: Array<GroupTranchesAgesIndicateurUn>
}

export interface GroupTranchesAgesCoefficient {
  trancheAge: TranchesAges
  nombreSalariesFemmes: number | undefined
  nombreSalariesHommes: number | undefined
  remunerationAnnuelleBrutFemmes: number | undefined
  remunerationAnnuelleBrutHommes: number | undefined
  ecartTauxRemuneration: number | undefined
}

export interface GroupeCoefficient {
  name: string
  tranchesAges: Array<GroupTranchesAgesCoefficient>
}

export interface GroupeIndicateurDeux {
  categorieSocioPro: CategorieSocioPro
  tauxAugmentationFemmes?: number | undefined
  tauxAugmentationHommes?: number | undefined
  ecartTauxAugmentation?: number | undefined
}

export interface GroupeIndicateurTrois {
  categorieSocioPro: CategorieSocioPro
  tauxPromotionFemmes?: number | undefined
  tauxPromotionHommes?: number | undefined
  ecartTauxPromotion?: number | undefined
}

////////////

export type FAQPartType =
  | "champApplication"
  | "periodeReference"
  | "effectifs"
  | "remuneration"
  | "indicateur1"
  | "indicateur2"
  | "indicateur3"
  | "indicateur2et3"
  | "indicateur4"
  | "publication"

export type FAQPart = {
  [key in FAQPartType]: {
    title: string
    qr: Array<{ question: string; reponse: Array<string> }>
  }
}

export type FAQSectionType =
  | "champApplication"
  | "informations"
  | "effectifs"
  | "indicateur1"
  | "indicateur2"
  | "indicateur3"
  | "indicateur2et3"
  | "indicateur4"
  | "indicateur5"
  | "resultat"

export type FAQSection = {
  [key in FAQSectionType]: {
    title: string
    parts: Array<FAQPartType>
  }
}

export type EntrepriseType = {
  raison_sociale?: string
  code_naf?: string
  région?: string
  département?: string
  adresse?: string
  commune?: string
  code_postal?: string
  code_pays?: string
}

export type AlertMessageType = {
  text: string
  kind: "success" | "error"
}

export * as AppModels from "./app-models.d"
