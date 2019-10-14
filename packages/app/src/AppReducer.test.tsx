import {
  CategorieSocioPro,
  TranchesAges,
  FormState,
  PeriodeDeclaration
} from "./globals.d";

import AppReducer from "./AppReducer";

import stateDefault from "./__fixtures__/stateDefault";
import stateComplete from "./__fixtures__/stateComplete";
import stateCompleteAndValidate from "./__fixtures__/stateCompleteAndValidate";

const stateUndefined = undefined;

//////////////////
// STATE /////////
//////////////////

describe("test state used for test before testing", () => {
  test("stateUndefined", () => expect(stateUndefined).toMatchSnapshot());
  test("stateDefault", () => expect(stateDefault).toMatchSnapshot());
  test("stateComplete", () => expect(stateComplete).toMatchSnapshot());
  test("stateCompleteAndValidate", () =>
    expect(stateCompleteAndValidate).toMatchSnapshot());
});

describe("resetState", () => {
  test("reset undefined state", () => {
    expect(
      AppReducer(stateUndefined, { type: "resetState" })
    ).toMatchSnapshot();
  });

  test("reset default state", () => {
    expect(AppReducer(stateDefault, { type: "resetState" })).toMatchSnapshot();
  });

  test("reset complete state", () => {
    expect(AppReducer(stateComplete, { type: "resetState" })).toMatchSnapshot();
  });
});

//////////////////
// UPDATE ////////
//////////////////

describe("updateEffectif", () => {
  const action = {
    type: "updateEffectif" as "updateEffectif",
    data: {
      nombreSalaries: [
        {
          categorieSocioPro: CategorieSocioPro.Ouvriers,
          tranchesAges: [
            {
              trancheAge: TranchesAges.MoinsDe30ans,
              nombreSalariesFemmes: 24,
              nombreSalariesHommes: 33
            },
            {
              trancheAge: TranchesAges.De30a39ans,
              nombreSalariesFemmes: 13,
              nombreSalariesHommes: 14
            },
            {
              trancheAge: TranchesAges.De40a49ans,
              nombreSalariesFemmes: 35,
              nombreSalariesHommes: 8
            },
            {
              trancheAge: TranchesAges.PlusDe50ans,
              nombreSalariesFemmes: 6,
              nombreSalariesHommes: 22
            }
          ]
        },
        {
          categorieSocioPro: CategorieSocioPro.Employes,
          tranchesAges: [
            {
              trancheAge: TranchesAges.MoinsDe30ans,
              nombreSalariesFemmes: 64,
              nombreSalariesHommes: 26
            },
            {
              trancheAge: TranchesAges.De30a39ans,
              nombreSalariesFemmes: 53,
              nombreSalariesHommes: 63
            },
            {
              trancheAge: TranchesAges.De40a49ans,
              nombreSalariesFemmes: 17,
              nombreSalariesHommes: 19
            },
            {
              trancheAge: TranchesAges.PlusDe50ans,
              nombreSalariesFemmes: 28,
              nombreSalariesHommes: 20
            }
          ]
        },
        {
          categorieSocioPro: CategorieSocioPro.Techniciens,
          tranchesAges: [
            {
              trancheAge: TranchesAges.MoinsDe30ans,
              nombreSalariesFemmes: 15,
              nombreSalariesHommes: 16
            },
            {
              trancheAge: TranchesAges.De30a39ans,
              nombreSalariesFemmes: 6,
              nombreSalariesHommes: 7
            },
            {
              trancheAge: TranchesAges.De40a49ans,
              nombreSalariesFemmes: 3,
              nombreSalariesHommes: 4
            },
            {
              trancheAge: TranchesAges.PlusDe50ans,
              nombreSalariesFemmes: 5,
              nombreSalariesHommes: 6
            }
          ]
        },
        {
          categorieSocioPro: CategorieSocioPro.Cadres,
          tranchesAges: [
            {
              trancheAge: TranchesAges.MoinsDe30ans,
              nombreSalariesFemmes: 4,
              nombreSalariesHommes: 9
            },
            {
              trancheAge: TranchesAges.De30a39ans,
              nombreSalariesFemmes: 20,
              nombreSalariesHommes: 18
            },
            {
              trancheAge: TranchesAges.De40a49ans,
              nombreSalariesFemmes: 3,
              nombreSalariesHommes: 3
            },
            {
              trancheAge: TranchesAges.PlusDe50ans,
              nombreSalariesFemmes: 6,
              nombreSalariesHommes: 9
            }
          ]
        }
      ]
    }
  };

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toMatchSnapshot();
  });

  test("change default state", () => {
    expect(AppReducer(stateDefault, action)).toMatchSnapshot();
  });

  test("change complete state", () => {
    expect(AppReducer(stateComplete, action)).toMatchSnapshot();
  });
});

describe("updateIndicateurUnType", () => {
  const action = {
    type: "updateIndicateurUnType" as "updateIndicateurUnType",
    data: { csp: false }
  };

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toMatchSnapshot();
  });

  test("change default state", () => {
    expect(AppReducer(stateDefault, action)).toMatchSnapshot();
  });

  test("change complete state", () => {
    expect(AppReducer(stateComplete, action)).toMatchSnapshot();
  });
});

describe("updateIndicateurUnCsp", () => {
  const action = {
    type: "updateIndicateurUnCsp" as "updateIndicateurUnCsp",
    data: {
      remunerationAnnuelle: [
        {
          categorieSocioPro: CategorieSocioPro.Ouvriers,
          tranchesAges: [
            {
              trancheAge: TranchesAges.MoinsDe30ans,
              remunerationAnnuelleBrutFemmes: 23500,
              remunerationAnnuelleBrutHommes: 25500
            },
            {
              trancheAge: TranchesAges.De30a39ans,
              remunerationAnnuelleBrutFemmes: 24500,
              remunerationAnnuelleBrutHommes: 26500
            },
            {
              trancheAge: TranchesAges.De40a49ans,
              remunerationAnnuelleBrutFemmes: 25600,
              remunerationAnnuelleBrutHommes: 26500
            },
            {
              trancheAge: TranchesAges.PlusDe50ans,
              remunerationAnnuelleBrutFemmes: 27600,
              remunerationAnnuelleBrutHommes: 28500
            }
          ]
        },
        {
          categorieSocioPro: CategorieSocioPro.Employes,
          tranchesAges: [
            {
              trancheAge: TranchesAges.MoinsDe30ans,
              remunerationAnnuelleBrutFemmes: 23400,
              remunerationAnnuelleBrutHommes: 25400
            },
            {
              trancheAge: TranchesAges.De30a39ans,
              remunerationAnnuelleBrutFemmes: 24400,
              remunerationAnnuelleBrutHommes: 26400
            },
            {
              trancheAge: TranchesAges.De40a49ans,
              remunerationAnnuelleBrutFemmes: 31400,
              remunerationAnnuelleBrutHommes: 33400
            },
            {
              trancheAge: TranchesAges.PlusDe50ans,
              remunerationAnnuelleBrutFemmes: 39400,
              remunerationAnnuelleBrutHommes: 43400
            }
          ]
        },
        {
          categorieSocioPro: CategorieSocioPro.Techniciens,
          tranchesAges: [
            {
              trancheAge: TranchesAges.MoinsDe30ans,
              remunerationAnnuelleBrutFemmes: 26650,
              remunerationAnnuelleBrutHommes: 28650
            },
            {
              trancheAge: TranchesAges.De30a39ans,
              remunerationAnnuelleBrutFemmes: 27650,
              remunerationAnnuelleBrutHommes: 29650
            },
            {
              trancheAge: TranchesAges.De40a49ans,
              remunerationAnnuelleBrutFemmes: 34650,
              remunerationAnnuelleBrutHommes: 36650
            },
            {
              trancheAge: TranchesAges.PlusDe50ans,
              remunerationAnnuelleBrutFemmes: 42650,
              remunerationAnnuelleBrutHommes: 46650
            }
          ]
        },
        {
          categorieSocioPro: CategorieSocioPro.Cadres,
          tranchesAges: [
            {
              trancheAge: TranchesAges.MoinsDe30ans,
              remunerationAnnuelleBrutFemmes: 36700,
              remunerationAnnuelleBrutHommes: 38700
            },
            {
              trancheAge: TranchesAges.De30a39ans,
              remunerationAnnuelleBrutFemmes: 37700,
              remunerationAnnuelleBrutHommes: 39700
            },
            {
              trancheAge: TranchesAges.De40a49ans,
              remunerationAnnuelleBrutFemmes: 44700,
              remunerationAnnuelleBrutHommes: 46700
            },
            {
              trancheAge: TranchesAges.PlusDe50ans,
              remunerationAnnuelleBrutFemmes: 52700,
              remunerationAnnuelleBrutHommes: 56700
            }
          ]
        }
      ]
    }
  };

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toMatchSnapshot();
  });

  test("change default state", () => {
    expect(AppReducer(stateDefault, action)).toMatchSnapshot();
  });

  test("change complete state", () => {
    expect(AppReducer(stateComplete, action)).toMatchSnapshot();
  });
});

describe("updateIndicateurUnCoefAddGroup", () => {
  const action = {
    type: "updateIndicateurUnCoefAddGroup" as "updateIndicateurUnCoefAddGroup"
  };

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toMatchSnapshot();
  });

  test("change default state", () => {
    expect(AppReducer(stateDefault, action)).toMatchSnapshot();
  });

  test("change complete state", () => {
    expect(AppReducer(stateComplete, action)).toMatchSnapshot();
  });
});

describe("updateIndicateurUnCoefDeleteGroup", () => {
  const action = {
    type: "updateIndicateurUnCoefDeleteGroup" as "updateIndicateurUnCoefDeleteGroup",
    index: 0
  };

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toMatchSnapshot();
  });

  test("change default state", () => {
    expect(AppReducer(stateDefault, action)).toMatchSnapshot();
  });

  test("change complete state", () => {
    expect(AppReducer(stateComplete, action)).toMatchSnapshot();
  });
});

describe("updateIndicateurUnCoef", () => {
  const actionCoefAddGroup = {
    type: "updateIndicateurUnCoefAddGroup" as "updateIndicateurUnCoefAddGroup"
  };
  const stateUndefinedWithOneGroup = AppReducer(
    stateUndefined,
    actionCoefAddGroup
  );
  const stateDefaultWithOneGroup = AppReducer(stateDefault, actionCoefAddGroup);

  describe("Array<{name: string}>", () => {
    const action = {
      type: "updateIndicateurUnCoef" as "updateIndicateurUnCoef",
      data: {
        coefficient: [
          {
            name: "Commercial"
          }
        ]
      }
    };

    test("nothing undefined state", () => {
      expect(AppReducer(stateUndefinedWithOneGroup, action)).toMatchSnapshot();
    });

    test("change default state", () => {
      expect(AppReducer(stateDefaultWithOneGroup, action)).toMatchSnapshot();
    });

    test("change complete state", () => {
      expect(AppReducer(stateComplete, action)).toMatchSnapshot();
    });
  });

  describe("Array<{tranchesAges: Array<GroupTranchesAgesEffectif>}>", () => {
    const action = {
      type: "updateIndicateurUnCoef" as "updateIndicateurUnCoef",
      data: {
        coefficient: [
          {
            tranchesAges: [
              {
                trancheAge: TranchesAges.MoinsDe30ans,
                nombreSalariesFemmes: 3,
                nombreSalariesHommes: 2
              },
              {
                trancheAge: TranchesAges.De30a39ans,
                nombreSalariesFemmes: 0,
                nombreSalariesHommes: 8
              },
              {
                trancheAge: TranchesAges.De40a49ans,
                nombreSalariesFemmes: 10,
                nombreSalariesHommes: 13
              },
              {
                trancheAge: TranchesAges.PlusDe50ans,
                nombreSalariesFemmes: 4,
                nombreSalariesHommes: 19
              }
            ]
          }
        ]
      }
    };

    test("nothing undefined state", () => {
      expect(AppReducer(stateUndefinedWithOneGroup, action)).toMatchSnapshot();
    });

    test("change default state", () => {
      expect(AppReducer(stateDefaultWithOneGroup, action)).toMatchSnapshot();
    });

    test("change complete state", () => {
      expect(AppReducer(stateComplete, action)).toMatchSnapshot();
    });
  });

  describe("Array<{tranchesAges: Array<GroupTranchesAgesIndicateurUn>}>", () => {
    const action = {
      type: "updateIndicateurUnCoef" as "updateIndicateurUnCoef",
      data: {
        coefficient: [
          {
            tranchesAges: [
              {
                trancheAge: TranchesAges.MoinsDe30ans,
                remunerationAnnuelleBrutFemmes: 25820,
                remunerationAnnuelleBrutHommes: 24820
              },
              {
                trancheAge: TranchesAges.De30a39ans,
                remunerationAnnuelleBrutFemmes: 32820,
                remunerationAnnuelleBrutHommes: 32820
              },
              {
                trancheAge: TranchesAges.De40a49ans,
                remunerationAnnuelleBrutFemmes: 41820,
                remunerationAnnuelleBrutHommes: 43820
              },
              {
                trancheAge: TranchesAges.PlusDe50ans,
                remunerationAnnuelleBrutFemmes: 49820,
                remunerationAnnuelleBrutHommes: 53550
              }
            ]
          }
        ]
      }
    };

    test("nothing undefined state", () => {
      expect(AppReducer(stateUndefinedWithOneGroup, action)).toMatchSnapshot();
    });

    test("change default state", () => {
      expect(AppReducer(stateDefaultWithOneGroup, action)).toMatchSnapshot();
    });

    test("change complete state", () => {
      expect(AppReducer(stateComplete, action)).toMatchSnapshot();
    });
  });
});

describe("updateIndicateurDeux", () => {
  const action = {
    type: "updateIndicateurDeux" as "updateIndicateurDeux",
    data: {
      presenceAugmentation: true,
      tauxAugmentation: [
        {
          categorieSocioPro: CategorieSocioPro.Ouvriers,
          tauxAugmentationFemmes: 2.4,
          tauxAugmentationHommes: 3
        },
        {
          categorieSocioPro: CategorieSocioPro.Employes,
          tauxAugmentationFemmes: 1.7,
          tauxAugmentationHommes: 2
        },
        {
          categorieSocioPro: CategorieSocioPro.Techniciens,
          tauxAugmentationFemmes: 9.4,
          tauxAugmentationHommes: 5.2
        },
        {
          categorieSocioPro: CategorieSocioPro.Cadres,
          tauxAugmentationFemmes: 10.05,
          tauxAugmentationHommes: 10.06
        }
      ]
    }
  };

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toMatchSnapshot();
  });

  test("change default state", () => {
    expect(AppReducer(stateDefault, action)).toMatchSnapshot();
  });

  test("change complete state", () => {
    expect(AppReducer(stateComplete, action)).toMatchSnapshot();
  });
});

describe("updateIndicateurTrois", () => {
  const action = {
    type: "updateIndicateurTrois" as "updateIndicateurTrois",
    data: {
      presencePromotion: true,
      tauxPromotion: [
        {
          categorieSocioPro: CategorieSocioPro.Ouvriers,
          tauxPromotionFemmes: 1,
          tauxPromotionHommes: 2
        },
        {
          categorieSocioPro: CategorieSocioPro.Employes,
          tauxPromotionFemmes: 0,
          tauxPromotionHommes: 0
        },
        {
          categorieSocioPro: CategorieSocioPro.Techniciens,
          tauxPromotionFemmes: 1,
          tauxPromotionHommes: 1.5
        },
        {
          categorieSocioPro: CategorieSocioPro.Cadres,
          tauxPromotionFemmes: 2,
          tauxPromotionHommes: 2.57
        }
      ]
    }
  };

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toMatchSnapshot();
  });

  test("change default state", () => {
    expect(AppReducer(stateDefault, action)).toMatchSnapshot();
  });

  test("change complete state", () => {
    expect(AppReducer(stateComplete, action)).toMatchSnapshot();
  });
});

describe("updateIndicateurDeuxTrois", () => {
  const action = {
    type: "updateIndicateurDeuxTrois" as "updateIndicateurDeuxTrois",
    data: {
      presenceAugmentationPromotion: true,
      nombreAugmentationPromotionFemmes: 3,
      nombreAugmentationPromotionHommes: 4,
      periodeDeclaration: "deuxPeriodesReference" as PeriodeDeclaration
    }
  };

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toMatchSnapshot();
  });

  test("change default state", () => {
    expect(AppReducer(stateDefault, action)).toMatchSnapshot();
  });

  test("change complete state", () => {
    expect(AppReducer(stateComplete, action)).toMatchSnapshot();
  });
});

describe("updateIndicateurQuatre", () => {
  const action = {
    type: "updateIndicateurQuatre" as "updateIndicateurQuatre",
    data: {
      presenceCongeMat: true,
      nombreSalarieesPeriodeAugmentation: 6,
      nombreSalarieesAugmentees: 5
    }
  };

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toMatchSnapshot();
  });

  test("change default state", () => {
    expect(AppReducer(stateDefault, action)).toMatchSnapshot();
  });

  test("change complete state", () => {
    expect(AppReducer(stateComplete, action)).toMatchSnapshot();
  });
});

describe("updateIndicateurCinq", () => {
  const action = {
    type: "updateIndicateurCinq" as "updateIndicateurCinq",
    data: {
      nombreSalariesHommes: 8,
      nombreSalariesFemmes: 2
    }
  };

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toMatchSnapshot();
  });

  test("change default state", () => {
    expect(AppReducer(stateDefault, action)).toMatchSnapshot();
  });

  test("change complete state", () => {
    expect(AppReducer(stateComplete, action)).toMatchSnapshot();
  });
});

//////////////////
// VALIDATE //////
//////////////////

describe("validateEffectif", () => {
  describe("Valid", () => {
    const action = {
      type: "validateEffectif" as "validateEffectif",
      valid: "Valid" as FormState
    };

    test("nothing undefined state", () => {
      expect(AppReducer(stateUndefined, action)).toMatchSnapshot();
    });

    test("change default state", () => {
      expect(AppReducer(stateDefault, action)).toMatchSnapshot();
    });

    test("change complete state", () => {
      expect(AppReducer(stateComplete, action)).toMatchSnapshot();
    });
  });

  describe("None with csp true", () => {
    const action = {
      type: "validateEffectif" as "validateEffectif",
      valid: "None" as FormState
    };

    test("invalid complete validate state", () => {
      expect(AppReducer(stateCompleteAndValidate, action)).toMatchSnapshot();
    });
  });

  describe("None with csp false", () => {
    const actionUpdateIndicateurUnType = {
      type: "updateIndicateurUnType" as "updateIndicateurUnType",
      data: { csp: false }
    };

    const stateCompleteAndValidateCoef = AppReducer(
      stateCompleteAndValidate,
      actionUpdateIndicateurUnType
    );

    test("stateCompleteAndValidateCoef", () => {
      expect(stateCompleteAndValidateCoef).toMatchSnapshot();
    });

    const action = {
      type: "validateEffectif" as "validateEffectif",
      valid: "None" as FormState
    };

    test("invalid complete validate state", () => {
      expect(
        AppReducer(stateCompleteAndValidateCoef, action)
      ).toMatchSnapshot();
    });
  });
});

describe("validateIndicateurUnCoefGroup", () => {
  describe("Valid", () => {
    const action = {
      type: "validateIndicateurUnCoefGroup" as "validateIndicateurUnCoefGroup",
      valid: "Valid" as FormState
    };

    test("nothing undefined state", () => {
      expect(AppReducer(stateUndefined, action)).toMatchSnapshot();
    });

    test("change default state", () => {
      expect(AppReducer(stateDefault, action)).toMatchSnapshot();
    });

    test("change complete state", () => {
      expect(AppReducer(stateComplete, action)).toMatchSnapshot();
    });
  });

  describe("None", () => {
    const action = {
      type: "validateIndicateurUnCoefGroup" as "validateIndicateurUnCoefGroup",
      valid: "None" as FormState
    };

    test("invalid complete validate state", () => {
      expect(AppReducer(stateCompleteAndValidate, action)).toMatchSnapshot();
    });
  });
});

describe("validateIndicateurUnCoefEffectif", () => {
  describe("Valid", () => {
    const action = {
      type: "validateIndicateurUnCoefEffectif" as "validateIndicateurUnCoefEffectif",
      valid: "Valid" as FormState
    };

    test("nothing undefined state", () => {
      expect(AppReducer(stateUndefined, action)).toMatchSnapshot();
    });

    test("change default state", () => {
      expect(AppReducer(stateDefault, action)).toMatchSnapshot();
    });

    test("change complete state", () => {
      expect(AppReducer(stateComplete, action)).toMatchSnapshot();
    });
  });

  describe("None", () => {
    const action = {
      type: "validateIndicateurUnCoefEffectif" as "validateIndicateurUnCoefEffectif",
      valid: "None" as FormState
    };

    test("invalid complete validate state", () => {
      expect(AppReducer(stateCompleteAndValidate, action)).toMatchSnapshot();
    });
  });
});

describe("validateIndicateurUn", () => {
  const action = {
    type: "validateIndicateurUn" as "validateIndicateurUn",
    valid: "Valid" as FormState
  };

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toMatchSnapshot();
  });

  test("change default state", () => {
    expect(AppReducer(stateDefault, action)).toMatchSnapshot();
  });

  test("change complete state", () => {
    expect(AppReducer(stateComplete, action)).toMatchSnapshot();
  });
});

describe("validateIndicateurDeux", () => {
  const action = {
    type: "validateIndicateurDeux" as "validateIndicateurDeux",
    valid: "Valid" as FormState
  };

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toMatchSnapshot();
  });

  test("change default state", () => {
    expect(AppReducer(stateDefault, action)).toMatchSnapshot();
  });

  test("change complete state", () => {
    expect(AppReducer(stateComplete, action)).toMatchSnapshot();
  });
});

describe("validateIndicateurTrois", () => {
  const action = {
    type: "validateIndicateurTrois" as "validateIndicateurTrois",
    valid: "Valid" as FormState
  };

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toMatchSnapshot();
  });

  test("change default state", () => {
    expect(AppReducer(stateDefault, action)).toMatchSnapshot();
  });

  test("change complete state", () => {
    expect(AppReducer(stateComplete, action)).toMatchSnapshot();
  });
});

describe("validateIndicateurDeuxTrois", () => {
  const action = {
    type: "validateIndicateurDeuxTrois" as "validateIndicateurDeuxTrois",
    valid: "Valid" as FormState
  };

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toMatchSnapshot();
  });

  test("change default state", () => {
    expect(AppReducer(stateDefault, action)).toMatchSnapshot();
  });

  test("change complete state", () => {
    expect(AppReducer(stateComplete, action)).toMatchSnapshot();
  });
});

describe("validateIndicateurQuatre", () => {
  const action = {
    type: "validateIndicateurQuatre" as "validateIndicateurQuatre",
    valid: "Valid" as FormState
  };

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toMatchSnapshot();
  });

  test("change default state", () => {
    expect(AppReducer(stateDefault, action)).toMatchSnapshot();
  });

  test("change complete state", () => {
    expect(AppReducer(stateComplete, action)).toMatchSnapshot();
  });
});

describe("validateIndicateurCinq", () => {
  const action = {
    type: "validateIndicateurCinq" as "validateIndicateurCinq",
    valid: "Valid" as FormState
  };

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toMatchSnapshot();
  });

  test("change default state", () => {
    expect(AppReducer(stateDefault, action)).toMatchSnapshot();
  });

  test("change complete state", () => {
    expect(AppReducer(stateComplete, action)).toMatchSnapshot();
  });
});
