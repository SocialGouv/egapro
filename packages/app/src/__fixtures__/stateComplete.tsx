import {
  CategorieSocioPro,
  PeriodeDeclaration,
  Structure,
  TranchesAges,
  TrancheEffectifs
} from "../globals.d";
import AppReducer from "../AppReducer";

const actionInitiateState = {
  type: "initiateState" as "initiateState",
  data: {}
};

const actionUpdateInformationsSimulation = {
  type: "updateInformationsSimulation" as "updateInformationsSimulation",
  data: {
    nomEntreprise: "BigCorp",
    trancheEffectifs: "1000 et plus" as TrancheEffectifs,
    debutPeriodeReference: "2019-01-01",
    finPeriodeReference: "2019-12-31"
  }
};

const actionUpdateEffectif = {
  type: "updateEffectif" as "updateEffectif",
  data: {
    nombreSalaries: [
      {
        categorieSocioPro: CategorieSocioPro.Ouvriers,
        tranchesAges: [
          {
            trancheAge: TranchesAges.MoinsDe30ans,
            nombreSalariesFemmes: 23,
            nombreSalariesHommes: 32
          },
          {
            trancheAge: TranchesAges.De30a39ans,
            nombreSalariesFemmes: 12,
            nombreSalariesHommes: 13
          },
          {
            trancheAge: TranchesAges.De40a49ans,
            nombreSalariesFemmes: 34,
            nombreSalariesHommes: 7
          },
          {
            trancheAge: TranchesAges.PlusDe50ans,
            nombreSalariesFemmes: 5,
            nombreSalariesHommes: 21
          }
        ]
      },
      {
        categorieSocioPro: CategorieSocioPro.Employes,
        tranchesAges: [
          {
            trancheAge: TranchesAges.MoinsDe30ans,
            nombreSalariesFemmes: 63,
            nombreSalariesHommes: 25
          },
          {
            trancheAge: TranchesAges.De30a39ans,
            nombreSalariesFemmes: 52,
            nombreSalariesHommes: 62
          },
          {
            trancheAge: TranchesAges.De40a49ans,
            nombreSalariesFemmes: 16,
            nombreSalariesHommes: 18
          },
          {
            trancheAge: TranchesAges.PlusDe50ans,
            nombreSalariesFemmes: 27,
            nombreSalariesHommes: 19
          }
        ]
      },
      {
        categorieSocioPro: CategorieSocioPro.Techniciens,
        tranchesAges: [
          {
            trancheAge: TranchesAges.MoinsDe30ans,
            nombreSalariesFemmes: 14,
            nombreSalariesHommes: 15
          },
          {
            trancheAge: TranchesAges.De30a39ans,
            nombreSalariesFemmes: 4,
            nombreSalariesHommes: 5
          },
          {
            trancheAge: TranchesAges.De40a49ans,
            nombreSalariesFemmes: 6,
            nombreSalariesHommes: 8
          },
          {
            trancheAge: TranchesAges.PlusDe50ans,
            nombreSalariesFemmes: 7,
            nombreSalariesHommes: 7
          }
        ]
      },
      {
        categorieSocioPro: CategorieSocioPro.Cadres,
        tranchesAges: [
          {
            trancheAge: TranchesAges.MoinsDe30ans,
            nombreSalariesFemmes: 7,
            nombreSalariesHommes: 8
          },
          {
            trancheAge: TranchesAges.De30a39ans,
            nombreSalariesFemmes: 10,
            nombreSalariesHommes: 8
          },
          {
            trancheAge: TranchesAges.De40a49ans,
            nombreSalariesFemmes: 13,
            nombreSalariesHommes: 13
          },
          {
            trancheAge: TranchesAges.PlusDe50ans,
            nombreSalariesFemmes: 16,
            nombreSalariesHommes: 19
          }
        ]
      }
    ]
  }
};

const actionUpdateIndicateurUnCsp = {
  type: "updateIndicateurUnCsp" as "updateIndicateurUnCsp",
  data: {
    remunerationAnnuelle: [
      {
        categorieSocioPro: CategorieSocioPro.Ouvriers,
        tranchesAges: [
          {
            trancheAge: TranchesAges.MoinsDe30ans,
            remunerationAnnuelleBrutFemmes: 23000,
            remunerationAnnuelleBrutHommes: 25000
          },
          {
            trancheAge: TranchesAges.De30a39ans,
            remunerationAnnuelleBrutFemmes: 24000,
            remunerationAnnuelleBrutHommes: 26000
          },
          {
            trancheAge: TranchesAges.De40a49ans,
            remunerationAnnuelleBrutFemmes: 25500,
            remunerationAnnuelleBrutHommes: 26000
          },
          {
            trancheAge: TranchesAges.PlusDe50ans,
            remunerationAnnuelleBrutFemmes: 27500,
            remunerationAnnuelleBrutHommes: 28000
          }
        ]
      },
      {
        categorieSocioPro: CategorieSocioPro.Employes,
        tranchesAges: [
          {
            trancheAge: TranchesAges.MoinsDe30ans,
            remunerationAnnuelleBrutFemmes: 23000,
            remunerationAnnuelleBrutHommes: 25000
          },
          {
            trancheAge: TranchesAges.De30a39ans,
            remunerationAnnuelleBrutFemmes: 24000,
            remunerationAnnuelleBrutHommes: 26000
          },
          {
            trancheAge: TranchesAges.De40a49ans,
            remunerationAnnuelleBrutFemmes: 31000,
            remunerationAnnuelleBrutHommes: 33000
          },
          {
            trancheAge: TranchesAges.PlusDe50ans,
            remunerationAnnuelleBrutFemmes: 39000,
            remunerationAnnuelleBrutHommes: 43000
          }
        ]
      },
      {
        categorieSocioPro: CategorieSocioPro.Techniciens,
        tranchesAges: [
          {
            trancheAge: TranchesAges.MoinsDe30ans,
            remunerationAnnuelleBrutFemmes: 26000,
            remunerationAnnuelleBrutHommes: 28000
          },
          {
            trancheAge: TranchesAges.De30a39ans,
            remunerationAnnuelleBrutFemmes: 27000,
            remunerationAnnuelleBrutHommes: 29000
          },
          {
            trancheAge: TranchesAges.De40a49ans,
            remunerationAnnuelleBrutFemmes: 34000,
            remunerationAnnuelleBrutHommes: 36000
          },
          {
            trancheAge: TranchesAges.PlusDe50ans,
            remunerationAnnuelleBrutFemmes: 42000,
            remunerationAnnuelleBrutHommes: 46000
          }
        ]
      },
      {
        categorieSocioPro: CategorieSocioPro.Cadres,
        tranchesAges: [
          {
            trancheAge: TranchesAges.MoinsDe30ans,
            remunerationAnnuelleBrutFemmes: 36000,
            remunerationAnnuelleBrutHommes: 38000
          },
          {
            trancheAge: TranchesAges.De30a39ans,
            remunerationAnnuelleBrutFemmes: 37000,
            remunerationAnnuelleBrutHommes: 39000
          },
          {
            trancheAge: TranchesAges.De40a49ans,
            remunerationAnnuelleBrutFemmes: 44000,
            remunerationAnnuelleBrutHommes: 46000
          },
          {
            trancheAge: TranchesAges.PlusDe50ans,
            remunerationAnnuelleBrutFemmes: 52000,
            remunerationAnnuelleBrutHommes: 56000
          }
        ]
      }
    ]
  }
};

const actionUpdateIndicateurUnCoefName = {
  type: "updateIndicateurUnCoef" as "updateIndicateurUnCoef",
  data: {
    coefficient: [
      {
        name: "Business Developers"
      }
    ]
  }
};

const actionUpdateIndicateurUnCoefNombreSalaries = {
  type: "updateIndicateurUnCoef" as "updateIndicateurUnCoef",
  data: {
    coefficient: [
      {
        tranchesAges: [
          {
            trancheAge: TranchesAges.MoinsDe30ans,
            nombreSalariesFemmes: 5,
            nombreSalariesHommes: 4
          },
          {
            trancheAge: TranchesAges.De30a39ans,
            nombreSalariesFemmes: 2,
            nombreSalariesHommes: 6
          },
          {
            trancheAge: TranchesAges.De40a49ans,
            nombreSalariesFemmes: 5,
            nombreSalariesHommes: 3
          },
          {
            trancheAge: TranchesAges.PlusDe50ans,
            nombreSalariesFemmes: 1,
            nombreSalariesHommes: 3
          }
        ]
      }
    ]
  }
};

const actionUpdateIndicateurUnCoefRemuneration = {
  type: "updateIndicateurUnCoef" as "updateIndicateurUnCoef",
  data: {
    coefficient: [
      {
        tranchesAges: [
          {
            trancheAge: TranchesAges.MoinsDe30ans,
            remunerationAnnuelleBrutFemmes: 25000,
            remunerationAnnuelleBrutHommes: 24000
          },
          {
            trancheAge: TranchesAges.De30a39ans,
            remunerationAnnuelleBrutFemmes: 32000,
            remunerationAnnuelleBrutHommes: 32000
          },
          {
            trancheAge: TranchesAges.De40a49ans,
            remunerationAnnuelleBrutFemmes: 41000,
            remunerationAnnuelleBrutHommes: 43000
          },
          {
            trancheAge: TranchesAges.PlusDe50ans,
            remunerationAnnuelleBrutFemmes: 49000,
            remunerationAnnuelleBrutHommes: 51500
          }
        ]
      }
    ]
  }
};

const actionUpdateIndicateurDeux = {
  type: "updateIndicateurDeux" as "updateIndicateurDeux",
  data: {
    presenceAugmentation: false,
    tauxAugmentation: [
      {
        categorieSocioPro: CategorieSocioPro.Ouvriers,
        tauxAugmentationFemmes: 2.2,
        tauxAugmentationHommes: 3.5
      },
      {
        categorieSocioPro: CategorieSocioPro.Employes,
        tauxAugmentationFemmes: 1.3,
        tauxAugmentationHommes: 2.2
      },
      {
        categorieSocioPro: CategorieSocioPro.Techniciens,
        tauxAugmentationFemmes: 8.02,
        tauxAugmentationHommes: 6.92
      },
      {
        categorieSocioPro: CategorieSocioPro.Cadres,
        tauxAugmentationFemmes: 12.15,
        tauxAugmentationHommes: 13.56
      }
    ]
  }
};

const actionUpdateIndicateurTrois = {
  type: "updateIndicateurTrois" as "updateIndicateurTrois",
  data: {
    presencePromotion: false,
    tauxPromotion: [
      {
        categorieSocioPro: CategorieSocioPro.Ouvriers,
        tauxPromotionFemmes: 1.1,
        tauxPromotionHommes: 2.2
      },
      {
        categorieSocioPro: CategorieSocioPro.Employes,
        tauxPromotionFemmes: 0.3,
        tauxPromotionHommes: 2.0
      },
      {
        categorieSocioPro: CategorieSocioPro.Techniciens,
        tauxPromotionFemmes: 2,
        tauxPromotionHommes: 3
      },
      {
        categorieSocioPro: CategorieSocioPro.Cadres,
        tauxPromotionFemmes: 4,
        tauxPromotionHommes: 5.55
      }
    ]
  }
};

const actionUpdateIndicateurDeuxTrois = {
  type: "updateIndicateurDeuxTrois" as "updateIndicateurDeuxTrois",
  data: {
    presenceAugmentationPromotion: false,
    nombreAugmentationPromotionFemmes: 1,
    nombreAugmentationPromotionHommes: 2,
    periodeDeclaration: "unePeriodeReference" as PeriodeDeclaration
  }
};

const actionUpdateIndicateurQuatre = {
  type: "updateIndicateurQuatre" as "updateIndicateurQuatre",
  data: {
    presenceCongeMat: false,
    nombreSalarieesPeriodeAugmentation: 7,
    nombreSalarieesAugmentees: 7
  }
};

const actionUpdateIndicateurCinq = {
  type: "updateIndicateurCinq" as "updateIndicateurCinq",
  data: {
    nombreSalariesHommes: 6,
    nombreSalariesFemmes: 4
  }
};

const actionUpdateInformationsEntreprise = {
  type: "updateInformationsEntreprise" as "updateInformationsEntreprise",
  data: {
    nomEntreprise: "acme",
    siren: "1234",
    codeNaf: "5678",
    region: "Auvergne-Rhône-Alpes",
    departement: "Drôme",
    adresse: "30 rue des alouettes",
    codePostal: "12345",
    commune: "Trifouilly",
    structure: "Unité Economique et Sociale (UES)" as Structure,
    nomUES: "nom d'une UES",
    nombreEntreprises: 2,
    entreprisesUES: [
      { nom: "entreprise 1", siren: "12345" },
      { nom: "entreprise 2", siren: "67890" }
    ]
  }
};

const actionUpdateInformationsDeclarant = {
  type: "updateInformationsDeclarant" as "updateInformationsDeclarant",
  data: {
    nom: "Daffy",
    prenom: "Duck",
    tel: "0123456789",
    email: "daffy.duck@example.com"
  }
};

const actionUpdateInformationsComplementaires = {
  type: "updateInformationsComplementaires" as "updateInformationsComplementaires",
  data: {
    dateConsultationCSE: "01/02/2019",
    anneeDeclaration: 2020,
    datePublication: "01/02/2020",
    lienPublication: "https://example.com"
  }
};

const actionUpdateDeclaration = {
  type: "updateDeclaration" as "updateDeclaration",
  data: {}
};

// fast pipe, I miss you in JS…
const stateDefault = AppReducer(
  AppReducer(
    AppReducer(
      AppReducer(
        AppReducer(
          AppReducer(
            AppReducer(
              AppReducer(
                AppReducer(
                  AppReducer(
                    AppReducer(
                      AppReducer(
                        AppReducer(
                          AppReducer(
                            AppReducer(
                              AppReducer(undefined, actionInitiateState),
                              actionUpdateInformationsSimulation
                            ),
                            actionUpdateEffectif
                          ),
                          actionUpdateIndicateurUnCsp
                        ),
                        actionUpdateIndicateurUnCoefName
                      ),
                      actionUpdateIndicateurUnCoefNombreSalaries
                    ),
                    actionUpdateIndicateurUnCoefRemuneration
                  ),
                  actionUpdateIndicateurDeux
                ),
                actionUpdateIndicateurTrois
              ),
              actionUpdateIndicateurDeuxTrois
            ),
            actionUpdateIndicateurQuatre
          ),
          actionUpdateIndicateurCinq
        ),
        actionUpdateInformationsEntreprise
      ),
      actionUpdateInformationsDeclarant
    ),
    actionUpdateInformationsComplementaires
  ),
  actionUpdateDeclaration
);

export default stateDefault;
