export type AppState = {
  data: Array<Groupe>;
  effectif: {
    formValidated: FormState;
  };
  indicateurUn: {
    formValidated: FormState;
  };
  indicateurDeux: {
    formValidated: FormState;
    presenceAugmentation: boolean;
  };
  indicateurTrois: {
    formValidated: FormState;
    presencePromotion: boolean;
  };
  indicateurQuatre: {
    formValidated: FormState;
    presenceAugmentation: boolean;
    nombreSalariees: number | undefined;
    nombreSalarieesPeriodeAugmentation: number | undefined;
    nombreSalarieesAugmentees: number | undefined;
  };
};

export type FormState = "None" | "Valid" | "Invalid";

export type ActionType =
  | {
      type: "updateEffectif";
      data: ActionEffectifData;
    }
  | {
      type: "validateEffectif";
      valid: FormState;
    }
  | {
      type: "updateIndicateurUn";
      data: ActionIndicateurUnData;
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
      type: "updateIndicateurQuatre";
      data: ActionIndicateurQuatreData;
    }
  | {
      type: "validateIndicateurQuatre";
      valid: FormState;
    };

export type ActionEffectifData = Array<{
  categorieSocioPro: CategorieSocioPro;
  tranchesAges: Array<{
    trancheAge: TranchesAges;
    nombreSalariesFemmes: number | undefined;
    nombreSalariesHommes: number | undefined;
  }>;
}>;

export type ActionIndicateurUnData = Array<{
  categorieSocioPro: CategorieSocioPro;
  tranchesAges: Array<{
    trancheAge: TranchesAges;
    remunerationAnnuelleBrutFemmes: number | undefined;
    remunerationAnnuelleBrutHommes: number | undefined;
  }>;
}>;

export type ActionIndicateurDeuxData = {
  presenceAugmentation: boolean;
  tauxAugmentation: Array<{
    categorieSocioPro: CategorieSocioPro;
    tauxAugmentationFemmes: number | undefined;
    tauxAugmentationHommes: number | undefined;
  }>;
};

export type ActionIndicateurTroisData = {
  presencePromotion: boolean;
  tauxPromotion: Array<{
    categorieSocioPro: CategorieSocioPro;
    tauxPromotionFemmes: number | undefined;
    tauxPromotionHommes: number | undefined;
  }>;
};

export type ActionIndicateurQuatreData = {
  presenceAugmentation: boolean;
  nombreSalariees: number | undefined;
  nombreSalarieesPeriodeAugmentation: number | undefined;
  nombreSalarieesAugmentees: number | undefined;
};

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

export interface GroupTranchesAges {
  trancheAge: TranchesAges;
  nombreSalariesFemmes: number | undefined;
  nombreSalariesHommes: number | undefined;
  remunerationAnnuelleBrutFemmes: number | undefined;
  remunerationAnnuelleBrutHommes: number | undefined;
}

export interface Groupe {
  categorieSocioPro: CategorieSocioPro;
  tranchesAges: Array<GroupTranchesAges>;
  tauxAugmentationFemmes: number | undefined;
  tauxAugmentationHommes: number | undefined;
  tauxPromotionFemmes: number | undefined;
  tauxPromotionHommes: number | undefined;
}
