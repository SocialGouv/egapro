export type ActionType =
  | {
      type: "updateEffectif";
      group: Groupe;
    }
  | {
      type: "updateIndicateurUn";
      group: Groupe;
    }
  | {
      type: "updateIndicateurDeux";
      data: ActionIndicateurDeuxData;
    };

export type ActionIndicateurDeuxData = Array<{
  categorieSocioPro: CategorieSocioPro;
  tauxAugmentationFemmes: number | undefined;
  tauxAugmentationHommes: number | undefined;
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
}
