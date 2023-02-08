export type PeriodeDeclaration = "unePeriodeReference" | "deuxPeriodesReference" | "troisPeriodesReference"

// TrancheEffectifs uniquement utilisé par les Forms. Pour le retour d'API, on a un autre format (ex: "1000:")
export type TrancheEffectifs = "50 à 250" | "251 à 999" | "1000 et plus"

export type TrancheEffectifsAPI = "50:250" | "251:999" | "1000:"

/**
 * Explication :
 * None    => l'utilisateur n'a pas encore soumis ce formulaire qui était en écriture.
 * Valid   => l'utilisateur a soumis ce formulaire et le formulaire devient read-only.
 * Invalid => ce formulaire précédemment soumis est devenu invalide suite à une modification d'un autre formulaire.
 */
export type FormState = "None" | "Valid" | "Invalid"

export type Structure = "Entreprise" | "Unité Economique et Sociale (UES)"

export type SexeType = "hommes" | "femmes"

// AppState is like a store which represents the state of the wizard in the simulation. Declaration has another shape (see DeclarationTotale).
export type AppState = {
  informations: {
    formValidated: FormState
    nomEntreprise: string
    trancheEffectifs: TrancheEffectifs
    anneeDeclaration?: number // uniquement un number quand une déclaration est valide
    finPeriodeReference?: string
    periodeSuffisante?: boolean // uniquement un boolean quand une déclaration est valide
  }
  effectif: {
    formValidated: FormState
    nombreSalaries: Array<EffectifsCategorie>
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
    tauxAugmentation: Array<TauxAugmentationParCSP>
  } & Partial<DeclarationIndicateurDeuxData>
  indicateurTrois: {
    formValidated: FormState
    presencePromotion: boolean
    tauxPromotion: Array<GroupeIndicateurTrois>
  } & Partial<DeclarationIndicateurTroisData>
  indicateurDeuxTrois: {
    formValidated: FormState
    presenceAugmentationPromotion: boolean
    nombreAugmentationPromotionFemmes?: number
    nombreAugmentationPromotionHommes?: number
    periodeDeclaration: PeriodeDeclaration
  } & Partial<DeclarationIndicateurDeuxTroisData>
  indicateurQuatre: {
    formValidated: FormState
    presenceCongeMat: boolean
    nombreSalarieesPeriodeAugmentation?: number
    nombreSalarieesAugmentees?: number
  } & Partial<DeclarationIndicateurQuatreData>
  indicateurCinq: {
    formValidated: FormState
    nombreSalariesHommes?: number
    nombreSalariesFemmes?: number
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
    nombreEntreprises?: number
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
    cseMisEnPlace?: boolean
    dateConsultationCSE: string
    datePublication: string
    publicationSurSiteInternet?: boolean // uniquement un boolean quand une déclaration est valide
    lienPublication: string
    planRelance?: boolean // uniquement un boolean quand une déclaration est valide
    modalitesPublication: string
    dateDeclaration: string
    noteIndex?: number
    totalPoint: number
    totalPointCalculable: number
  }
}

export type EntrepriseUES = {
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
      noteIndex?: number
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
  anneeDeclaration?: number
  finPeriodeReference?: string
  periodeSuffisante?: boolean
}

export type ActionEffectifData = {
  nombreSalaries: Array<EffectifsCategorie>
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
  nombreCoefficients?: number
  nonCalculable: boolean
  motifNonCalculable: "" | "egvi40pcet"
  remunerationAnnuelle: Array<GroupeIndicateurUn>
  coefficient: Array<GroupeCoefficient>
  resultatFinal?: number
  sexeSurRepresente?: SexeType
  noteFinale?: number
}

export type ActionIndicateurDeuxData = {
  presenceAugmentation: boolean
  tauxAugmentation: Array<TauxAugmentationParCSP>
}

export type DeclarationIndicateurDeuxData = {
  nonCalculable: boolean
  motifNonCalculable: "" | "egvi40pcet" | "absaugi"

  tauxAugmentation: Array<TauxAugmentationParCSP>
  resultatFinal?: number
  sexeSurRepresente?: SexeType
  noteFinale?: number
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
  resultatFinal?: number
  sexeSurRepresente?: SexeType
  noteFinale?: number
  mesuresCorrection: boolean
}

export type ActionIndicateurDeuxTroisData = {
  presenceAugmentationPromotion: boolean
  nombreAugmentationPromotionFemmes?: number
  nombreAugmentationPromotionHommes?: number
  periodeDeclaration: PeriodeDeclaration
}

export type DeclarationIndicateurDeuxTroisData = {
  nonCalculable: boolean
  motifNonCalculable: "" | "etsno5f5h" | "absaugi"

  resultatFinalEcart?: number
  resultatFinalNombreSalaries?: number
  sexeSurRepresente?: SexeType
  noteEcart?: number
  noteNombreSalaries?: number
  noteFinale?: number
  mesuresCorrection: boolean
}

export type DateInterval = {
  start: Date
  end: Date
}

export type ActionIndicateurQuatreData = {
  presenceCongeMat: boolean
  nombreSalarieesPeriodeAugmentation?: number
  nombreSalarieesAugmentees?: number
}

export type DeclarationIndicateurQuatreData = {
  nonCalculable: boolean
  motifNonCalculable: "" | "absaugpdtcm" | "absretcm"

  resultatFinal?: number
  noteFinale?: number
}

export type ActionIndicateurCinqData = {
  nombreSalariesHommes?: number
  nombreSalariesFemmes?: number
}

export type DeclarationIndicateurCinqData = {
  resultatFinal?: number
  sexeSurRepresente?: "egalite" | SexeType
  noteFinale?: number
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
  nombreEntreprises?: number
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
  cseMisEnPlace?: boolean
  dateConsultationCSE: string
  datePublication: string
  publicationSurSiteInternet?: boolean
  lienPublication: string
  modalitesPublication: string
  planRelance?: boolean
}

export type ActionEmailDeclarantData = {
  email: string
}

////

export enum TrancheAge {
  MoinsDe30ans,
  De30a39ans,
  De40a49ans,
  PlusDe50ans,
}

export enum CSP {
  Ouvriers,
  Employes,
  Techniciens,
  Cadres,
}

export interface GroupTranchesAgesEffectif {
  trancheAge: TrancheAge
  nombreSalariesFemmes?: number
  nombreSalariesHommes?: number
}

export type EffectifsCategorie = {
  categorieSocioPro: CSP
  tranchesAges: Array<GroupTranchesAgesEffectif>
}

export interface GroupTranchesAgesIndicateurUn {
  trancheAge: TrancheAge
  remunerationAnnuelleBrutFemmes?: number
  remunerationAnnuelleBrutHommes?: number
  ecartTauxRemuneration?: number
}

export interface GroupeIndicateurUn {
  categorieSocioPro: CSP
  tranchesAges: Array<GroupTranchesAgesIndicateurUn>
}

export type GroupTranchesAgesCoefficient = {
  trancheAge: TrancheAge
  nombreSalariesFemmes?: number
  nombreSalariesHommes?: number
  remunerationAnnuelleBrutFemmes?: number
  remunerationAnnuelleBrutHommes?: number
  ecartTauxRemuneration?: number
}

export type GroupeCoefficient = {
  name: string
  tranchesAges: Array<GroupTranchesAgesCoefficient>
}

export type TauxAugmentationParCSP = {
  categorieSocioPro: CSP
  tauxAugmentationFemmes?: number
  tauxAugmentationHommes?: number
  ecartTauxAugmentation?: number
}

export type GroupeIndicateurTrois = {
  categorieSocioPro: CSP
  tauxPromotionFemmes?: number
  tauxPromotionHommes?: number
  ecartTauxPromotion?: number
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
