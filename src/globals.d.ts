export type ActionType =
  | {
      type: "updateEffectif";
      data: ActionEffectifData;
    }
  | {
      type: "updateIndicateurUn";
      data: ActionIndicateurUnData;
    }
  | {
      type: "updateIndicateurDeux";
      data: ActionIndicateurDeuxData;
    }
  | {
      type: "updateIndicateurTrois";
      data: ActionIndicateurTroisData;
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

export type ActionIndicateurDeuxData = Array<{
  categorieSocioPro: CategorieSocioPro;
  tauxAugmentationFemmes: number | undefined;
  tauxAugmentationHommes: number | undefined;
}>;

export type ActionIndicateurTroisData = Array<{
  categorieSocioPro: CategorieSocioPro;
  tauxPromotionFemmes: number | undefined;
  tauxPromotionHommes: number | undefined;
}>;

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
