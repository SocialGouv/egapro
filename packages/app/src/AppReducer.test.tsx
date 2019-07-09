import { CategorieSocioPro, TranchesAges } from "./globals.d";

import AppReducer from "./AppReducer";

import stateDefault from "./__fixtures__/stateDefault";

const stateUndefined = undefined;

//////////////////
// STATE /////////
//////////////////

describe("test state used for test before testing", () => {
  test("stateUndefined", () => expect(stateUndefined).toMatchSnapshot());
  test("stateDefault", () => expect(stateDefault).toMatchSnapshot());
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
});

//////////////////
// UPDATE ////////
//////////////////

describe("updateEffectif", () => {
  const action = {
    type: "updateEffectif",
    data: {
      nombreSalaries: [
        {
          categorieSocioPro: CategorieSocioPro.Ouvriers,
          tranchesAges: [
            {
              trancheAge: TranchesAges.De40a49ans,
              nombreSalariesFemmes: 23,
              nombreSalariesHommes: 32
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
});

describe("updateIndicateurUnCsp", () => {
  const action = {
    type: "updateIndicateurUnCsp",
    data: {
      remunerationAnnuelle: [
        {
          categorieSocioPro: CategorieSocioPro.Ouvriers,
          tranchesAges: [
            {
              trancheAge: TranchesAges.De30a39ans,
              remunerationAnnuelleBrutFemmes: 23000,
              remunerationAnnuelleBrutHommes: 25000
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
});

describe("updateIndicateurUnCoef", () => {
  describe("Array<{name: string}>", () => {
    const action = {
      type: "updateIndicateurUnCoef",
      data: {
        coefficient: [
          {
            name: "Custome Name"
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
  });

  describe("Array<{tranchesAges: Array<GroupTranchesAgesEffectif>}>", () => {
    const action = {
      type: "updateIndicateurUnCoef",
      data: {
        coefficient: [
          {
            tranchesAges: [
              {
                trancheAge: TranchesAges.De30a39ans,
                nombreSalariesFemmes: 28,
                nombreSalariesHommes: 19
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
  });

  describe("Array<{tranchesAges: Array<GroupTranchesAgesIndicateurUn>}>", () => {
    const action = {
      type: "updateIndicateurUnCoef",
      data: {
        coefficient: [
          {
            tranchesAges: [
              {
                trancheAge: TranchesAges.MoinsDe30ans,
                remunerationAnnuelleBrutFemmes: 23000,
                remunerationAnnuelleBrutHommes: 25000
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
  });
});

describe("updateIndicateurDeux", () => {
  const action = {
    type: "updateIndicateurDeux",
    data: {
      presenceAugmentation: true,
      tauxAugmentation: [
        {
          categorieSocioPro: CategorieSocioPro.Employes,
          tauxAugmentationFemmes: 2.2,
          tauxAugmentationHommes: 3.5
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
});

describe("updateIndicateurTrois", () => {
  const action = {
    type: "updateIndicateurTrois",
    data: {
      presencePromotion: true,
      tauxPromotion: [
        {
          categorieSocioPro: CategorieSocioPro.Employes,
          tauxPromotionFemmes: 2.2,
          tauxPromotionHommes: 3.5
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
});

describe("updateIndicateurQuatre", () => {
  const action = {
    type: "updateIndicateurQuatre",
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
});

describe("updateIndicateurCinq", () => {
  const action = {
    type: "updateIndicateurCinq",
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
});
