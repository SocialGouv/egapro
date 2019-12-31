export type AppState = {
  informations: {
    formValidated: FormState;
    nomEntreprise: string;
    trancheEffectifs: TrancheEffectifs;
    debutPeriodeReference: string;
    finPeriodeReference: string;
  };
  effectif: {
    formValidated: FormState;
    nombreSalaries: Array<GroupeEffectif>;
  };
  indicateurUn: {
    formValidated: FormState;
    csp: boolean;
    remunerationAnnuelle: Array<GroupeIndicateurUn>;
    coefficientGroupFormValidated: FormState;
    coefficientEffectifFormValidated: FormState;
    coefficient: Array<GroupeCoefficient>;
  };
  indicateurDeux: {
    formValidated: FormState;
    presenceAugmentation: boolean;
    tauxAugmentation: Array<GroupeIndicateurDeux>;
  };
  indicateurTrois: {
    formValidated: FormState;
    presencePromotion: boolean;
    tauxPromotion: Array<GroupeIndicateurTrois>;
  };
  indicateurDeuxTrois: {
    formValidated: FormState;
    presenceAugmentationPromotion: boolean;
    nombreAugmentationPromotionFemmes: number | undefined;
    nombreAugmentationPromotionHommes: number | undefined;
    periodeDeclaration: PeriodeDeclaration;
  };
  indicateurQuatre: {
    formValidated: FormState;
    presenceCongeMat: boolean;
    nombreSalarieesPeriodeAugmentation: number | undefined;
    nombreSalarieesAugmentees: number | undefined;
  };
  indicateurCinq: {
    formValidated: FormState;
    nombreSalariesHommes: number | undefined;
    nombreSalariesFemmes: number | undefined;
  };
  informationsEntreprise: {
    formValidated: FormState;
    nomEntreprise: string;
    siren: string;
    codeNaf: string;
    adresse: string;
  };
};

export type PeriodeDeclaration =
  | "unePeriodeReference"
  | "deuxPeriodesReference"
  | "troisPeriodesReference";

export type TrancheEffectifs = "50 à 250" | "251 à 999" | "1000 et plus";

export type FormState = "None" | "Valid" | "Invalid";

export type ActionType =
  | {
      type: "resetState";
    }
  | {
      type: "initiateState";
      data: any;
    }
  | {
      type: "updateInformationsSimulation";
      data: ActionInformationsSimulationData;
    }
  | {
      type: "validateInformationsSimulation";
      valid: FormState;
    }
  | {
      type: "updateEffectif";
      data: ActionEffectifData;
    }
  | {
      type: "validateEffectif";
      valid: FormState;
    }
  | {
      type: "updateIndicateurUnType";
      data: ActionIndicateurUnTypeData;
    }
  | {
      type: "updateIndicateurUnCsp";
      data: ActionIndicateurUnCspData;
    }
  | {
      type: "updateIndicateurUnCoefAddGroup";
    }
  | {
      type: "updateIndicateurUnCoefDeleteGroup";
      index: number;
    }
  | {
      type: "updateIndicateurUnCoef";
      data: ActionIndicateurUnCoefData;
    }
  | {
      type: "validateIndicateurUnCoefGroup";
      valid: FormState;
    }
  | {
      type: "validateIndicateurUnCoefEffectif";
      valid: FormState;
    }
  | {
      type: "validateIndicateurUn";
      valid: FormState;
    }
  | {
      type: "updateIndicateurDeux";
      data: ActionIndicateurDeuxData;
    }
  | {
      type: "validateIndicateurDeux";
      valid: FormState;
    }
  | {
      type: "updateIndicateurTrois";
      data: ActionIndicateurTroisData;
    }
  | {
      type: "validateIndicateurTrois";
      valid: FormState;
    }
  | {
      type: "updateIndicateurDeuxTrois";
      data: ActionIndicateurDeuxTroisData;
    }
  | {
      type: "validateIndicateurDeuxTrois";
      valid: FormState;
    }
  | {
      type: "updateIndicateurQuatre";
      data: ActionIndicateurQuatreData;
    }
  | {
      type: "validateIndicateurQuatre";
      valid: FormState;
    }
  | {
      type: "updateIndicateurCinq";
      data: ActionIndicateurCinqData;
    }
  | {
      type: "validateIndicateurCinq";
      valid: FormState;
    }
  | {
      type: "updateInformationsEntreprise";
      data: ActionInformationsEntrepriseData;
    }
  | {
      type: "validateInformationsEntreprise";
      valid: FormState;
    };

export type ActionInformationsSimulationData = {
  nomEntreprise: string;
  trancheEffectifs: TrancheEffectifs;
  debutPeriodeReference: string;
  finPeriodeReference: string;
};

export type ActionEffectifData = {
  nombreSalaries: Array<GroupeEffectif>;
};

export type ActionIndicateurUnTypeData = {
  csp: boolean;
};

export type ActionIndicateurUnCspData = {
  remunerationAnnuelle: Array<GroupeIndicateurUn>;
};

export type ActionIndicateurUnCoefData = {
  coefficient:
    | Array<{ name: string }>
    | Array<{
        tranchesAges: Array<GroupTranchesAgesEffectif>;
      }>
    | Array<{
        tranchesAges: Array<GroupTranchesAgesIndicateurUn>;
      }>;
};

export type ActionIndicateurDeuxData = {
  presenceAugmentation: boolean;
  tauxAugmentation: Array<GroupeIndicateurDeux>;
};

export type ActionIndicateurTroisData = {
  presencePromotion: boolean;
  tauxPromotion: Array<GroupeIndicateurTrois>;
};

export type ActionIndicateurDeuxTroisData = {
  presenceAugmentationPromotion: boolean;
  nombreAugmentationPromotionFemmes: number | undefined;
  nombreAugmentationPromotionHommes: number | undefined;
  periodeDeclaration: PeriodeDeclaration;
};

export type DateInterval = {
  start: Date;
  end: Date;
};

export type ActionIndicateurQuatreData = {
  presenceCongeMat: boolean;
  nombreSalarieesPeriodeAugmentation: number | undefined;
  nombreSalarieesAugmentees: number | undefined;
};

export type ActionIndicateurCinqData = {
  nombreSalariesHommes: number | undefined;
  nombreSalariesFemmes: number | undefined;
};

export type ActionInformationsEntrepriseData = {
  nomEntreprise: string;
  siren: string;
  codeNaf: string;
  adresse: string;
};

////

export enum TranchesAges {
  MoinsDe30ans,
  De30a39ans,
  De40a49ans,
  PlusDe50ans
}

export enum CategorieSocioPro {
  Ouvriers,
  Employes,
  Techniciens,
  Cadres
}

export interface GroupTranchesAgesEffectif {
  trancheAge: TranchesAges;
  nombreSalariesFemmes: number | undefined;
  nombreSalariesHommes: number | undefined;
}

export interface GroupeEffectif {
  categorieSocioPro: CategorieSocioPro;
  tranchesAges: Array<GroupTranchesAgesEffectif>;
}

export interface GroupTranchesAgesIndicateurUn {
  trancheAge: TranchesAges;
  remunerationAnnuelleBrutFemmes: number | undefined;
  remunerationAnnuelleBrutHommes: number | undefined;
}

export interface GroupeIndicateurUn {
  categorieSocioPro: CategorieSocioPro;
  tranchesAges: Array<GroupTranchesAgesIndicateurUn>;
}

export interface GroupTranchesAgesCoefficient {
  trancheAge: TranchesAges;
  nombreSalariesFemmes: number | undefined;
  nombreSalariesHommes: number | undefined;
  remunerationAnnuelleBrutFemmes: number | undefined;
  remunerationAnnuelleBrutHommes: number | undefined;
}

export interface GroupeCoefficient {
  name: string;
  tranchesAges: Array<GroupTranchesAgesCoefficient>;
}

export interface GroupeIndicateurDeux {
  categorieSocioPro: CategorieSocioPro;
  tauxAugmentationFemmes: number | undefined;
  tauxAugmentationHommes: number | undefined;
}

export interface GroupeIndicateurTrois {
  categorieSocioPro: CategorieSocioPro;
  tauxPromotionFemmes: number | undefined;
  tauxPromotionHommes: number | undefined;
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
  | "publication";

export type FAQPart = {
  [key in FAQPartType]: {
    title: string;
    qr: Array<{ question: string; reponse: Array<string> }>;
  };
};

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
  | "resultat";

export type FAQSection = {
  [key in FAQSectionType]: {
    title: string;
    parts: Array<FAQPartType>;
  };
};
