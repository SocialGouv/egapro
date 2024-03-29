export type PeriodeDeclaration = "unePeriodeReference" | "deuxPeriodesReference" | "troisPeriodesReference"

// TrancheEffectifs uniquement utilisé par les Forms. Pour le retour d'API, on a un autre format (ex: "1000:")
export type TrancheEffectifs = "50 à 250" | "251 à 999" | "1000 et plus"

export type TrancheEffectifsAPI = "50:250" | "251:999" | "1000:"

/**
 * État de chacune des pages de formulaire
 *
 * - None    : le formulaire est en écriture (mode par défaut quand on rentre dans un formulaire).
 * - Valid   : l'utilisateur a soumis ce formulaire et la vérification des données s'est bien passée. Le formulaire devient read only.
 * Attention: les règles de non calculabilité pourront être détectées plus tard alors même que le formulaire est valide.
 * - Invalid : ce formulaire précédemment soumis est devenu désynchronisé suite à une modification d'un autre formulaire. Il n'est pas forcément invalide en tant que tel.
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
    nombreSalaries: EffectifsPourCSP[]
  } & Partial<DeclarationEffectifData>
  indicateurUn: {
    formValidated: FormState // Valeur calculé et non plus modifiable via l'UI. Valid si cspFormValidated est Valid pour modalideCalcul === "csp" ou si coefficientRemuFormValidated est Valid pour modalideCalcul === "coef" ou "autre" ou bien si non calculable à partir des effectifs de coefficient.
    modaliteCalcul?: "csp" | "coef" | "autre"
    modaliteCalculformValidated: FormState // => pour la première partie, permettant de choisir un mode de calcul
    coefficientGroupFormValidated: FormState
    coefficientEffectifFormValidated: FormState
    coefficientRemuFormValidated: FormState
    coefficients: CoefficientGroupe[] // Uniquement pour modalité coefficient ou autre.
    remunerationsAnnuelles: RemunerationsPourCSP[] // Uniquement pour modalité CSP.
  } & Partial<DeclarationIndicateurUnData>
  indicateurDeux: {
    formValidated: FormState
    presenceAugmentation: boolean
    tauxAugmentation: TauxAugmentationPourCSP[]
  } & Partial<DeclarationIndicateurDeuxData>
  indicateurTrois: {
    formValidated: FormState
    presencePromotion: boolean
    tauxPromotion: TauxPromotionsPourCSP[]
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
    entreprisesUES: EntrepriseUES[]
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
      type: "unsetEffectif"
    }
  | {
      type: "setValidEffectif"
    }
  | {
      type: "setInvalidEffectif"
    }
  | {
      type: "updateIndicateurUnModaliteCalcul"
      data: ActionIndicateurUnTypeData
    }
  | {
      type: "setValidIndicateurUnModaliteCalcul"
    }
  | {
      type: "unsetIndicateurUnModaliteCalcul"
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
      type: "setValidIndicateurUnCSP"
    }
  | {
      type: "setInvalidIndicateurUnCSP"
    }
  | {
      type: "unsetIndicateurUnCSP"
    }
  | {
      type: "setValidIndicateurUnCoefGroup"
    }
  | {
      type: "setInvalidIndicateurUnCoefGroup"
    }
  | {
      type: "unsetIndicateurUnCoefGroup"
    }
  | {
      type: "setValidIndicateurUnCoefEffectif"
    }
  | {
      type: "setInvalidIndicateurUnCoefEffectif"
    }
  | {
      type: "unsetIndicateurUnCoefEffectif"
    }
  | {
      type: "setValidIndicateurUnCoefRemuneration"
    }
  | {
      type: "setInvalidIndicateurUnCoefRemuneration"
    }
  | {
      type: "unsetIndicateurUnCoefRemuneration"
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
  nombreSalaries: EffectifsPourCSP[]
}

export type DeclarationEffectifData = {
  nombreSalariesTotal: number
}

export type ActionIndicateurUnTypeData = {
  modaliteCalcul: AppState["indicateurUn"]["modaliteCalcul"]
}

export type ActionIndicateurUnCspData = {
  remunerationsAnnuelles: RemunerationsPourCSP[]
}

export type ActionIndicateurUnCoefData = {
  coefficients:
    | Array<{ nom: string }>
    | Array<{
        tranchesAges: EffectifPourTrancheAge[]
      }>
    | Array<{
        tranchesAges: RemunerationPourTrancheAge[]
      }>
}

export type DeclarationIndicateurUnData = {
  nombreCoefficients?: number
  nonCalculable: boolean
  motifNonCalculable: "" | "egvi40pcet"
  remunerationsAnnuelles: RemunerationsPourCSP[]
  coefficients: CoefficientGroupe[]
  resultatFinal?: number
  sexeSurRepresente?: SexeType
  noteFinale?: number
}

export type ActionIndicateurDeuxData = {
  presenceAugmentation: boolean
  tauxAugmentation: TauxAugmentationPourCSP[]
}

export type DeclarationIndicateurDeuxData = {
  nonCalculable: boolean
  motifNonCalculable: "" | "egvi40pcet" | "absaugi"
  tauxAugmentation: TauxAugmentationPourCSP[]
  resultatFinal?: number
  sexeSurRepresente?: SexeType
  noteFinale?: number
  mesuresCorrection: boolean
}

export type ActionIndicateurTroisData = {
  presencePromotion: boolean
  tauxPromotion: TauxPromotionsPourCSP[]
}

export type DeclarationIndicateurTroisData = {
  nonCalculable: boolean
  motifNonCalculable: "" | "egvi40pcet" | "absprom"
  tauxPromotion: TauxPromotionsPourCSP[]
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
  entreprisesUES: EntrepriseUES[]
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

export type EffectifPourTrancheAge = {
  trancheAge: TrancheAge
  nombreSalariesFemmes?: number
  nombreSalariesHommes?: number
}

export type EffectifsPourCSP = {
  categorieSocioPro: CSP
  tranchesAges: EffectifPourTrancheAge[]
}

export type RemunerationPourTrancheAge = {
  trancheAge: TrancheAge
  remunerationAnnuelleBrutFemmes?: number
  remunerationAnnuelleBrutHommes?: number
  ecartTauxRemuneration?: number
}

export type RemunerationsPourCSP = {
  categorieSocioPro: CSP
  tranchesAges: RemunerationPourTrancheAge[]
}

export type CoefficientPourTrancheAge = {
  trancheAge: TrancheAge
  nombreSalariesFemmes?: number
  nombreSalariesHommes?: number
  remunerationAnnuelleBrutFemmes?: number
  remunerationAnnuelleBrutHommes?: number
  ecartTauxRemuneration?: number
}

export type CoefficientGroupe = {
  nom: string
  tranchesAges: CoefficientPourTrancheAge[]
}

type FemmeHomme = [number, number]

export type CoefficientGroupe2 = {
  name: string
  effectifs: [FemmeHomme, FemmeHomme, FemmeHomme, FemmeHomme]
  remunerations: [FemmeHomme, FemmeHomme, FemmeHomme, FemmeHomme]
}

export type TauxAugmentationPourCSP = {
  categorieSocioPro: CSP
  tauxAugmentationFemmes?: number
  tauxAugmentationHommes?: number
  ecartTauxAugmentation?: number
}

export type TauxPromotionsPourCSP = {
  categorieSocioPro: CSP
  tauxPromotionFemmes?: number
  tauxPromotionHommes?: number
  ecartTauxPromotion?: number
}

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
