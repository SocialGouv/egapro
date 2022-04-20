import { CategorieSocioPro, TranchesAges, ActionType, AppState } from "./globals"

import AppReducer, { dataIndicateurUnCoefGroup } from "./AppReducer"

import stateDefault from "./__fixtures__/stateDefault"
import stateComplete from "./__fixtures__/stateComplete"
import stateCompleteAndValidate from "./__fixtures__/stateCompleteAndValidate"

const stateUndefined = undefined

const realDate = global.Date

// Make sure we always get the same "new Date()" value for the AppReducer's
// auto-calculated `dateDeclaration` in `validateDeclaration`
beforeEach(() => {
  // @ts-ignore
  global.Date = jest.fn(() => new realDate(1578393480399))
  global.Date.UTC = realDate.UTC
})

afterEach(() => {
  global.Date = realDate
})

const testAppState: AppState = {
  declaration: "",
  effectif: "",
  indicateurUn: "",
  indicateurDeux: "",
  indicateurDeuxTrois: "",
  indicateurTrois: "",
  indicateurQuatre: "",
  indicateurCinq: "",
  informations: "",
  informationsDeclarant: "",
  informationsEntreprise: "",
}

//////////////////
// STATE /////////
//////////////////

describe("test state used for test before testing", () => {
  test("stateUndefined", () => expect(stateUndefined).toStrictEqual(undefined))
  test("stateDefault", () => expect(stateDefault).toStrictEqual(stateDefault))
  test("stateComplete", () => expect(stateComplete).toStrictEqual(stateComplete))
  test("stateCompleteAndValidate", () => expect(stateCompleteAndValidate).toStrictEqual(stateCompleteAndValidate))
})

describe("resetState", () => {
  test("reset undefined state", () => {
    expect(AppReducer(stateUndefined, { type: "resetState" })).toStrictEqual(undefined)
  })

  test("reset default state", () => {
    expect(AppReducer(stateDefault, { type: "resetState" })).toStrictEqual(undefined)
  })

  test("reset complete state", () => {
    expect(AppReducer(stateComplete, { type: "resetState" })).toStrictEqual(undefined)
  })
})

//////////////////
// UPDATE ////////
//////////////////

describe("updateInformationsSimulation", () => {
  const action: ActionType = {
    type: "updateInformationsSimulation",
    data: {
      nomEntreprise: "acme",
      trancheEffectifs: "251 à 999",
      anneeDeclaration: 2018,
      finPeriodeReference: "2020-10-14",
      periodeSuffisante: true,
    },
  }

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { informations, ...rest } = AppReducer(stateDefault, action) as AppState
    const { informations: informationsInitial, ...restInitial } = stateDefault as AppState

    expect(informations).toStrictEqual({
      ...informationsInitial,
      ...action.data,
    })
    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { informations, ...rest } = AppReducer(stateComplete, action) as AppState
    const { informations: informationsInitial, ...restInitial } = stateComplete as AppState

    expect(informations).toStrictEqual({
      ...informationsInitial,
      ...action.data,
    })
    expect(rest).toStrictEqual(restInitial)
  })
})

describe("updateEffectif", () => {
  const action: ActionType = {
    type: "updateEffectif",
    data: {
      nombreSalaries: [
        {
          categorieSocioPro: CategorieSocioPro.Ouvriers,
          tranchesAges: [
            {
              trancheAge: TranchesAges.MoinsDe30ans,
              nombreSalariesFemmes: 24,
              nombreSalariesHommes: 33,
            },
            {
              trancheAge: TranchesAges.De30a39ans,
              nombreSalariesFemmes: 13,
              nombreSalariesHommes: 14,
            },
            {
              trancheAge: TranchesAges.De40a49ans,
              nombreSalariesFemmes: 35,
              nombreSalariesHommes: 8,
            },
            {
              trancheAge: TranchesAges.PlusDe50ans,
              nombreSalariesFemmes: 6,
              nombreSalariesHommes: 22,
            },
          ],
        },
        {
          categorieSocioPro: CategorieSocioPro.Employes,
          tranchesAges: [
            {
              trancheAge: TranchesAges.MoinsDe30ans,
              nombreSalariesFemmes: 64,
              nombreSalariesHommes: 26,
            },
            {
              trancheAge: TranchesAges.De30a39ans,
              nombreSalariesFemmes: 53,
              nombreSalariesHommes: 63,
            },
            {
              trancheAge: TranchesAges.De40a49ans,
              nombreSalariesFemmes: 17,
              nombreSalariesHommes: 19,
            },
            {
              trancheAge: TranchesAges.PlusDe50ans,
              nombreSalariesFemmes: 28,
              nombreSalariesHommes: 20,
            },
          ],
        },
        {
          categorieSocioPro: CategorieSocioPro.Techniciens,
          tranchesAges: [
            {
              trancheAge: TranchesAges.MoinsDe30ans,
              nombreSalariesFemmes: 15,
              nombreSalariesHommes: 16,
            },
            {
              trancheAge: TranchesAges.De30a39ans,
              nombreSalariesFemmes: 6,
              nombreSalariesHommes: 7,
            },
            {
              trancheAge: TranchesAges.De40a49ans,
              nombreSalariesFemmes: 3,
              nombreSalariesHommes: 4,
            },
            {
              trancheAge: TranchesAges.PlusDe50ans,
              nombreSalariesFemmes: 5,
              nombreSalariesHommes: 6,
            },
          ],
        },
        {
          categorieSocioPro: CategorieSocioPro.Cadres,
          tranchesAges: [
            {
              trancheAge: TranchesAges.MoinsDe30ans,
              nombreSalariesFemmes: 4,
              nombreSalariesHommes: 9,
            },
            {
              trancheAge: TranchesAges.De30a39ans,
              nombreSalariesFemmes: 20,
              nombreSalariesHommes: 18,
            },
            {
              trancheAge: TranchesAges.De40a49ans,
              nombreSalariesFemmes: 3,
              nombreSalariesHommes: 3,
            },
            {
              trancheAge: TranchesAges.PlusDe50ans,
              nombreSalariesFemmes: 6,
              nombreSalariesHommes: 9,
            },
          ],
        },
      ],
    },
  }

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { effectif, ...rest } = AppReducer(stateDefault, action) as AppState
    const { effectif: effectifInitial, ...restInitial } = stateDefault as AppState

    expect(effectif).toStrictEqual({ ...effectifInitial, ...action.data })
    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { effectif, ...rest } = AppReducer(stateComplete, action) as AppState
    const { effectif: effectifInitial, ...restInitial } = stateComplete as AppState

    expect(effectif).toStrictEqual({ ...effectifInitial, ...action.data })
    expect(rest).toStrictEqual(restInitial)
  })
})

describe("updateIndicateurUnType", () => {
  const action: ActionType = {
    type: "updateIndicateurUnType",
    data: { csp: false, coef: false, autre: false },
  }

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { indicateurUn, ...rest } = AppReducer(stateDefault, action) as AppState
    const { indicateurUn: indicateurUnInitial, ...restInitial } = stateDefault as AppState

    expect(indicateurUn).toStrictEqual({ ...indicateurUnInitial, ...action.data })
    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { indicateurUn, ...rest } = AppReducer(stateComplete, action) as AppState
    const { indicateurUn: indicateurUnInitial, ...restInitial } = stateComplete as AppState

    expect(indicateurUn).toStrictEqual({ ...indicateurUnInitial, ...action.data })
    expect(rest).toStrictEqual(restInitial)
  })
})

describe("updateIndicateurUnCsp", () => {
  const action: ActionType = {
    type: "updateIndicateurUnCsp",
    data: {
      remunerationAnnuelle: [
        {
          categorieSocioPro: CategorieSocioPro.Ouvriers,
          tranchesAges: [
            {
              trancheAge: TranchesAges.MoinsDe30ans,
              remunerationAnnuelleBrutFemmes: 23500,
              remunerationAnnuelleBrutHommes: 25500,
            },
            {
              trancheAge: TranchesAges.De30a39ans,
              remunerationAnnuelleBrutFemmes: 24500,
              remunerationAnnuelleBrutHommes: 26500,
            },
            {
              trancheAge: TranchesAges.De40a49ans,
              remunerationAnnuelleBrutFemmes: 25600,
              remunerationAnnuelleBrutHommes: 26500,
            },
            {
              trancheAge: TranchesAges.PlusDe50ans,
              remunerationAnnuelleBrutFemmes: 27600,
              remunerationAnnuelleBrutHommes: 28500,
            },
          ],
        },
        {
          categorieSocioPro: CategorieSocioPro.Employes,
          tranchesAges: [
            {
              trancheAge: TranchesAges.MoinsDe30ans,
              remunerationAnnuelleBrutFemmes: 23400,
              remunerationAnnuelleBrutHommes: 25400,
            },
            {
              trancheAge: TranchesAges.De30a39ans,
              remunerationAnnuelleBrutFemmes: 24400,
              remunerationAnnuelleBrutHommes: 26400,
            },
            {
              trancheAge: TranchesAges.De40a49ans,
              remunerationAnnuelleBrutFemmes: 31400,
              remunerationAnnuelleBrutHommes: 33400,
            },
            {
              trancheAge: TranchesAges.PlusDe50ans,
              remunerationAnnuelleBrutFemmes: 39400,
              remunerationAnnuelleBrutHommes: 43400,
            },
          ],
        },
        {
          categorieSocioPro: CategorieSocioPro.Techniciens,
          tranchesAges: [
            {
              trancheAge: TranchesAges.MoinsDe30ans,
              remunerationAnnuelleBrutFemmes: 26650,
              remunerationAnnuelleBrutHommes: 28650,
            },
            {
              trancheAge: TranchesAges.De30a39ans,
              remunerationAnnuelleBrutFemmes: 27650,
              remunerationAnnuelleBrutHommes: 29650,
            },
            {
              trancheAge: TranchesAges.De40a49ans,
              remunerationAnnuelleBrutFemmes: 34650,
              remunerationAnnuelleBrutHommes: 36650,
            },
            {
              trancheAge: TranchesAges.PlusDe50ans,
              remunerationAnnuelleBrutFemmes: 42650,
              remunerationAnnuelleBrutHommes: 46650,
            },
          ],
        },
        {
          categorieSocioPro: CategorieSocioPro.Cadres,
          tranchesAges: [
            {
              trancheAge: TranchesAges.MoinsDe30ans,
              remunerationAnnuelleBrutFemmes: 36700,
              remunerationAnnuelleBrutHommes: 38700,
            },
            {
              trancheAge: TranchesAges.De30a39ans,
              remunerationAnnuelleBrutFemmes: 37700,
              remunerationAnnuelleBrutHommes: 39700,
            },
            {
              trancheAge: TranchesAges.De40a49ans,
              remunerationAnnuelleBrutFemmes: 44700,
              remunerationAnnuelleBrutHommes: 46700,
            },
            {
              trancheAge: TranchesAges.PlusDe50ans,
              remunerationAnnuelleBrutFemmes: 52700,
              remunerationAnnuelleBrutHommes: 56700,
            },
          ],
        },
      ],
    },
  }

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { indicateurUn, ...rest } = AppReducer(stateDefault, action) as AppState
    const { indicateurUn: indicateurUnInitial, ...restInitial } = stateDefault as AppState

    expect(indicateurUn).toStrictEqual({ ...indicateurUnInitial, ...action.data })
    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { indicateurUn, ...rest } = AppReducer(stateComplete, action) as AppState
    const { indicateurUn: indicateurUnInitial, ...restInitial } = stateComplete as AppState

    expect(indicateurUn).toStrictEqual({ ...indicateurUnInitial, ...action.data })
    expect(rest).toStrictEqual(restInitial)
  })
})

describe("updateIndicateurUnCoefAddGroup", () => {
  const action: ActionType = {
    type: "updateIndicateurUnCoefAddGroup",
  }

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { indicateurUn, ...rest } = AppReducer(stateDefault, action) as AppState
    const { indicateurUn: indicateurUnInitial, ...restInitial } = stateDefault as AppState

    expect(indicateurUn).toStrictEqual({
      ...indicateurUnInitial,
      coefficient: [...indicateurUnInitial.coefficient, dataIndicateurUnCoefGroup],
    })
    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { indicateurUn, ...rest } = AppReducer(stateComplete, action) as AppState
    const { indicateurUn: indicateurUnInitial, ...restInitial } = stateComplete as AppState

    expect(indicateurUn).toStrictEqual({
      ...indicateurUnInitial,
      coefficient: [...indicateurUnInitial.coefficient, dataIndicateurUnCoefGroup],
    })
    expect(rest).toStrictEqual(restInitial)
  })
})

describe("updateIndicateurUnCoefDeleteGroup", () => {
  const action: ActionType = {
    type: "updateIndicateurUnCoefDeleteGroup",
    index: 0,
  }

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { indicateurUn, ...rest } = AppReducer(stateDefault, action) as AppState
    const { indicateurUn: indicateurUnInitial, ...restInitial } = stateDefault as AppState

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, ...restCoefficients] = indicateurUnInitial.coefficient

    expect(indicateurUn).toStrictEqual({
      ...indicateurUnInitial,
      coefficient: restCoefficients,
    })
    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { indicateurUn, ...rest } = AppReducer(stateComplete, action) as AppState
    const { indicateurUn: indicateurUnInitial, ...restInitial } = stateComplete as AppState

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, ...restCoefficients] = indicateurUnInitial.coefficient

    expect(indicateurUn).toStrictEqual({
      ...indicateurUnInitial,
      coefficient: restCoefficients,
    })
    expect(rest).toStrictEqual(restInitial)
  })
})

describe.only("updateIndicateurUnCoef", () => {
  const actionCoefAddGroup: ActionType = {
    type: "updateIndicateurUnCoefAddGroup",
  }
  const stateUndefinedWithOneGroup = AppReducer(stateUndefined, actionCoefAddGroup)
  const stateDefaultWithOneGroup = AppReducer(stateDefault, actionCoefAddGroup)

  describe("Array<{name: string}>", () => {
    const action: ActionType = {
      type: "updateIndicateurUnCoef",
      data: {
        coefficient: [
          {
            name: "Commercial",
          },
        ],
      },
    }

    test("nothing undefined state", () => {
      expect(AppReducer(stateUndefinedWithOneGroup, action)).toStrictEqual(undefined)
    })

    test("change default state", () => {
      const { indicateurUn, ...rest } = AppReducer(stateDefaultWithOneGroup, action) as AppState
      const { indicateurUn: indicateurUnInitial, ...restInitial } = stateDefaultWithOneGroup as AppState

      const { coefficient: changedCoefficient } = indicateurUnInitial
      changedCoefficient[0].name = "Commercial"

      expect(indicateurUn).toStrictEqual({
        ...indicateurUnInitial,
        coefficient: changedCoefficient,
      })
      expect(rest).toStrictEqual(restInitial)
    })

    test("change complete state", () => {
      const { indicateurUn, ...rest } = AppReducer(stateComplete, action) as AppState
      const { indicateurUn: indicateurUnInitial, ...restInitial } = stateComplete as AppState

      const { coefficient: changedCoefficient } = indicateurUnInitial
      changedCoefficient[0].name = "Commercial"

      expect(indicateurUn).toStrictEqual({
        ...indicateurUnInitial,
        coefficient: changedCoefficient,
      })
      expect(rest).toStrictEqual(restInitial)
    })
  })

  describe.only("Array<{tranchesAges: Array<GroupTranchesAgesEffectif>}>", () => {
    const action: ActionType = {
      type: "updateIndicateurUnCoef",
      data: {
        coefficient: [
          {
            tranchesAges: [
              {
                trancheAge: TranchesAges.MoinsDe30ans,
                nombreSalariesFemmes: 3,
                nombreSalariesHommes: 2,
              },
              {
                trancheAge: TranchesAges.De30a39ans,
                nombreSalariesFemmes: 0,
                nombreSalariesHommes: 8,
              },
              {
                trancheAge: TranchesAges.De40a49ans,
                nombreSalariesFemmes: 10,
                nombreSalariesHommes: 13,
              },
              {
                trancheAge: TranchesAges.PlusDe50ans,
                nombreSalariesFemmes: 4,
                nombreSalariesHommes: 19,
              },
            ],
          },
        ],
      },
    }

    test("nothing undefined state", () => {
      expect(AppReducer(stateUndefinedWithOneGroup, action)).toMatchSnapshot()
    })

    test("change default state", () => {
      expect(AppReducer(stateDefaultWithOneGroup, action)).toMatchSnapshot()
    })

    test("change complete state", () => {
      expect(AppReducer(stateComplete, action)).toMatchSnapshot()
    })
  })

  describe("Array<{tranchesAges: Array<GroupTranchesAgesIndicateurUn>}>", () => {
    const action: ActionType = {
      type: "updateIndicateurUnCoef",
      data: {
        coefficient: [
          {
            tranchesAges: [
              {
                trancheAge: TranchesAges.MoinsDe30ans,
                remunerationAnnuelleBrutFemmes: 25820,
                remunerationAnnuelleBrutHommes: 24820,
              },
              {
                trancheAge: TranchesAges.De30a39ans,
                remunerationAnnuelleBrutFemmes: 32820,
                remunerationAnnuelleBrutHommes: 32820,
              },
              {
                trancheAge: TranchesAges.De40a49ans,
                remunerationAnnuelleBrutFemmes: 41820,
                remunerationAnnuelleBrutHommes: 43820,
              },
              {
                trancheAge: TranchesAges.PlusDe50ans,
                remunerationAnnuelleBrutFemmes: 49820,
                remunerationAnnuelleBrutHommes: 53550,
              },
            ],
          },
        ],
      },
    }

    test("nothing undefined state", () => {
      expect(AppReducer(stateUndefinedWithOneGroup, action)).toMatchSnapshot()
    })

    test("change default state", () => {
      expect(AppReducer(stateDefaultWithOneGroup, action)).toMatchSnapshot()
    })

    test("change complete state", () => {
      expect(AppReducer(stateComplete, action)).toMatchSnapshot()
    })
  })
})

describe("updateIndicateurDeux", () => {
  const action: ActionType = {
    type: "updateIndicateurDeux",
    data: {
      presenceAugmentation: true,
      tauxAugmentation: [
        {
          categorieSocioPro: CategorieSocioPro.Ouvriers,
          tauxAugmentationFemmes: 2.4,
          tauxAugmentationHommes: 3,
        },
        {
          categorieSocioPro: CategorieSocioPro.Employes,
          tauxAugmentationFemmes: 1.7,
          tauxAugmentationHommes: 2,
        },
        {
          categorieSocioPro: CategorieSocioPro.Techniciens,
          tauxAugmentationFemmes: 9.4,
          tauxAugmentationHommes: 5.2,
        },
        {
          categorieSocioPro: CategorieSocioPro.Cadres,
          tauxAugmentationFemmes: 10.05,
          tauxAugmentationHommes: 10.06,
        },
      ],
    },
  }

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toMatchSnapshot()
  })

  test("change default state", () => {
    expect(AppReducer(stateDefault, action)).toMatchSnapshot()
  })

  test("change complete state", () => {
    expect(AppReducer(stateComplete, action)).toMatchSnapshot()
  })
})

describe("updateIndicateurTrois", () => {
  const action: ActionType = {
    type: "updateIndicateurTrois",
    data: {
      presencePromotion: true,
      tauxPromotion: [
        {
          categorieSocioPro: CategorieSocioPro.Ouvriers,
          tauxPromotionFemmes: 1,
          tauxPromotionHommes: 2,
        },
        {
          categorieSocioPro: CategorieSocioPro.Employes,
          tauxPromotionFemmes: 0,
          tauxPromotionHommes: 0,
        },
        {
          categorieSocioPro: CategorieSocioPro.Techniciens,
          tauxPromotionFemmes: 1,
          tauxPromotionHommes: 1.5,
        },
        {
          categorieSocioPro: CategorieSocioPro.Cadres,
          tauxPromotionFemmes: 2,
          tauxPromotionHommes: 2.57,
        },
      ],
    },
  }

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toMatchSnapshot()
  })

  test("change default state", () => {
    expect(AppReducer(stateDefault, action)).toMatchSnapshot()
  })

  test("change complete state", () => {
    expect(AppReducer(stateComplete, action)).toMatchSnapshot()
  })
})

describe("updateIndicateurDeuxTrois", () => {
  const action: ActionType = {
    type: "updateIndicateurDeuxTrois",
    data: {
      presenceAugmentationPromotion: true,
      nombreAugmentationPromotionFemmes: 3,
      nombreAugmentationPromotionHommes: 4,
      periodeDeclaration: "deuxPeriodesReference",
    },
  }

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toMatchSnapshot()
  })

  test("change default state", () => {
    expect(AppReducer(stateDefault, action)).toMatchSnapshot()
  })

  test("change complete state", () => {
    expect(AppReducer(stateComplete, action)).toMatchSnapshot()
  })
})

describe("updateIndicateurQuatre", () => {
  const action: ActionType = {
    type: "updateIndicateurQuatre",
    data: {
      presenceCongeMat: true,
      nombreSalarieesPeriodeAugmentation: 6,
      nombreSalarieesAugmentees: 5,
    },
  }

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toMatchSnapshot()
  })

  test("change default state", () => {
    expect(AppReducer(stateDefault, action)).toMatchSnapshot()
  })

  test("change complete state", () => {
    expect(AppReducer(stateComplete, action)).toMatchSnapshot()
  })
})

describe("updateIndicateurCinq", () => {
  const action: ActionType = {
    type: "updateIndicateurCinq",
    data: {
      nombreSalariesHommes: 8,
      nombreSalariesFemmes: 2,
    },
  }

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toMatchSnapshot()
  })

  test("change default state", () => {
    expect(AppReducer(stateDefault, action)).toMatchSnapshot()
  })

  test("change complete state", () => {
    expect(AppReducer(stateComplete, action)).toMatchSnapshot()
  })
})

describe("updateInformationsEntreprise", () => {
  const action: ActionType = {
    type: "updateInformationsEntreprise",
    data: {
      nomEntreprise: "acme",
      siren: "12345",
      codeNaf: "6789",
      region: "Languedoc-Roussillon",
      departement: "Hérault",
      adresse: "2 rue du mérou",
      codePostal: "34000",
      commune: "Montpellier",
      structure: "Unité Economique et Sociale (UES)",
      nomUES: "foobar UES",
      nombreEntreprises: 2,
      entreprisesUES: [{ nom: "entreprise 1", siren: "12345" }],
    },
  }

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toMatchSnapshot()
  })

  test("change default state", () => {
    expect(AppReducer(stateDefault, action)).toMatchSnapshot()
  })

  test("change complete state", () => {
    expect(AppReducer(stateComplete, action)).toMatchSnapshot()
  })
})

describe("updateInformationsDeclarant", () => {
  const action: ActionType = {
    type: "updateInformationsDeclarant",
    data: {
      nom: "Norris",
      prenom: "Chuck",
      tel: "0102030405",
      email: "foo@bar.com",
      acceptationCGU: true,
    },
  }

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toMatchSnapshot()
  })

  test("change default state", () => {
    expect(AppReducer(stateDefault, action)).toMatchSnapshot()
  })

  test("change complete state", () => {
    expect(AppReducer(stateComplete, action)).toMatchSnapshot()
  })
})

describe("updateDeclaration", () => {
  const action: ActionType = {
    type: "updateDeclaration",
    data: {
      mesuresCorrection: "mmo",
      dateConsultationCSE: "01/02/2017",
      datePublication: "01/02/2020",
      lienPublication: "https://example.com",

      // TODO : modalitesPublication est obligatoire d'après la référence TS.
      // J'ajoute une valeur aléatoire pour respecter l'interface. À voir.
      modalitesPublication: "",
      planRelance: false,
    },
  }

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toMatchSnapshot()
  })

  test("change default state", () => {
    expect(AppReducer(stateDefault, action)).toMatchSnapshot()
  })

  test("change complete state", () => {
    expect(AppReducer(stateComplete, action)).toMatchSnapshot()
  })
})

//////////////////
// VALIDATE //////
//////////////////

describe("validateInformationsSimulation", () => {
  const action: ActionType = {
    type: "validateInformationsSimulation",
    valid: "Valid",
  }

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toMatchSnapshot()
  })

  test("change default state", () => {
    expect(AppReducer(stateDefault, action)).toMatchSnapshot()
  })

  test("change complete state", () => {
    expect(AppReducer(stateComplete, action)).toMatchSnapshot()
  })
})

describe("validateEffectif", () => {
  describe("Valid", () => {
    const action: ActionType = {
      type: "validateEffectif",
      valid: "Valid",
    }

    test("nothing undefined state", () => {
      expect(AppReducer(stateUndefined, action)).toMatchSnapshot()
    })

    test("change default state", () => {
      expect(AppReducer(stateDefault, action)).toMatchSnapshot()
    })

    test("change complete state", () => {
      expect(AppReducer(stateComplete, action)).toMatchSnapshot()
    })
  })

  describe("None with csp true", () => {
    const action: ActionType = {
      type: "validateEffectif",
      valid: "None",
    }

    test("invalid complete validate state", () => {
      expect(AppReducer(stateCompleteAndValidate, action)).toMatchSnapshot()
    })
  })

  describe("None with csp false", () => {
    const actionUpdateIndicateurUnType: ActionType = {
      type: "updateIndicateurUnType",
      data: { csp: false, coef: false, autre: false },
    }

    const stateCompleteAndValidateCoef = AppReducer(stateCompleteAndValidate, actionUpdateIndicateurUnType)

    test("stateCompleteAndValidateCoef", () => {
      expect(stateCompleteAndValidateCoef).toMatchSnapshot()
    })

    const action: ActionType = {
      type: "validateEffectif",
      valid: "None",
    }

    test("invalid complete validate state", () => {
      expect(AppReducer(stateCompleteAndValidateCoef, action)).toMatchSnapshot()
    })
  })
})

describe("validateIndicateurUnCoefGroup", () => {
  describe("Valid", () => {
    const action: ActionType = {
      type: "validateIndicateurUnCoefGroup",
      valid: "Valid",
    }

    test("nothing undefined state", () => {
      expect(AppReducer(stateUndefined, action)).toMatchSnapshot()
    })

    test("change default state", () => {
      expect(AppReducer(stateDefault, action)).toMatchSnapshot()
    })

    test("change complete state", () => {
      expect(AppReducer(stateComplete, action)).toMatchSnapshot()
    })
  })

  describe("None", () => {
    const action: ActionType = {
      type: "validateIndicateurUnCoefGroup",
      valid: "None",
    }

    test("invalid complete validate state", () => {
      expect(AppReducer(stateCompleteAndValidate, action)).toMatchSnapshot()
    })
  })
})

describe("validateIndicateurUnCoefEffectif", () => {
  describe("Valid", () => {
    const action: ActionType = {
      type: "validateIndicateurUnCoefEffectif",
      valid: "Valid",
    }

    test("nothing undefined state", () => {
      expect(AppReducer(stateUndefined, action)).toMatchSnapshot()
    })

    test("change default state", () => {
      expect(AppReducer(stateDefault, action)).toMatchSnapshot()
    })

    test("change complete state", () => {
      expect(AppReducer(stateComplete, action)).toMatchSnapshot()
    })
  })

  describe("None", () => {
    const action: ActionType = {
      type: "validateIndicateurUnCoefEffectif",
      valid: "None",
    }

    test("invalid complete validate state", () => {
      expect(AppReducer(stateCompleteAndValidate, action)).toMatchSnapshot()
    })
  })
})

describe("validateIndicateurUn", () => {
  const action: ActionType = {
    type: "validateIndicateurUn",
    valid: "Valid",
  }

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toMatchSnapshot()
  })

  test("change default state", () => {
    expect(AppReducer(stateDefault, action)).toMatchSnapshot()
  })

  test("change complete state", () => {
    expect(AppReducer(stateComplete, action)).toMatchSnapshot()
  })
})

describe("validateIndicateurDeux", () => {
  const action: ActionType = {
    type: "validateIndicateurDeux",
    valid: "Valid",
  }

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toMatchSnapshot()
  })

  test("change default state", () => {
    expect(AppReducer(stateDefault, action)).toMatchSnapshot()
  })

  test("change complete state", () => {
    expect(AppReducer(stateComplete, action)).toMatchSnapshot()
  })
})

describe("validateIndicateurTrois", () => {
  const action: ActionType = {
    type: "validateIndicateurTrois",
    valid: "Valid",
  }

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toMatchSnapshot()
  })

  test("change default state", () => {
    expect(AppReducer(stateDefault, action)).toMatchSnapshot()
  })

  test("change complete state", () => {
    expect(AppReducer(stateComplete, action)).toMatchSnapshot()
  })
})

describe("validateIndicateurDeuxTrois", () => {
  const action: ActionType = {
    type: "validateIndicateurDeuxTrois",
    valid: "Valid",
  }

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toMatchSnapshot()
  })

  test("change default state", () => {
    expect(AppReducer(stateDefault, action)).toMatchSnapshot()
  })

  test("change complete state", () => {
    expect(AppReducer(stateComplete, action)).toMatchSnapshot()
  })
})

describe("validateIndicateurQuatre", () => {
  const action: ActionType = {
    type: "validateIndicateurQuatre",
    valid: "Valid",
  }

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toMatchSnapshot()
  })

  test("change default state", () => {
    expect(AppReducer(stateDefault, action)).toMatchSnapshot()
  })

  test("change complete state", () => {
    expect(AppReducer(stateComplete, action)).toMatchSnapshot()
  })
})

describe("validateIndicateurCinq", () => {
  const action: ActionType = {
    type: "validateIndicateurCinq",
    valid: "Valid",
  }

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toMatchSnapshot()
  })

  test("change default state", () => {
    expect(AppReducer(stateDefault, action)).toMatchSnapshot()
  })

  test("change complete state", () => {
    expect(AppReducer(stateComplete, action)).toMatchSnapshot()
  })
})

describe("validateInformationsEntreprise", () => {
  const action: ActionType = {
    type: "validateInformationsEntreprise",
    valid: "Valid",
  }

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toMatchSnapshot()
  })

  test("change default state", () => {
    expect(AppReducer(stateDefault, action)).toMatchSnapshot()
  })

  test("change complete state", () => {
    expect(AppReducer(stateComplete, action)).toMatchSnapshot()
  })
})

describe("validateInformationsDeclarant", () => {
  const action: ActionType = {
    type: "validateInformationsDeclarant",
    valid: "Valid",
  }

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toMatchSnapshot()
  })

  test("change default state", () => {
    expect(AppReducer(stateDefault, action)).toMatchSnapshot()
  })

  test("change complete state", () => {
    expect(AppReducer(stateComplete, action)).toMatchSnapshot()
  })
})

// Test retiré car les types TS ne sont pas cohérents avec les jeux de données. (ex: effectifData non renseigné, )
// TODO : corriger les types dans global.ts ou bien ajouter les paramètres manquants dans ce test.
describe("validateDeclaration", () => {
  const action: ActionType = {
    type: "validateDeclaration",
    valid: "Valid",
    // @ts-ignore: see comment above
    indicateurUnData: {
      nombreCoefficients: 6,
      motifNonCalculable: "",
      motifNonCalculablePrecision: "",
      resultatFinal: 8.0,
      sexeSurRepresente: "femmes",
      noteFinale: 31,
    },
    // @ts-ignore: see comment above
    indicateurDeuxData: {
      motifNonCalculable: "",
      motifNonCalculablePrecision: "",
      resultatFinal: 5.0,
      sexeSurRepresente: "femmes",
      noteFinale: 10,
      mesuresCorrection: false,
    },
    // @ts-ignore: see comment above
    indicateurTroisData: {
      motifNonCalculable: "",
      motifNonCalculablePrecision: "",
      resultatFinal: 3.0,
      sexeSurRepresente: "femmes",
      noteFinale: 15,
      mesuresCorrection: false,
    },
    // @ts-ignore: see comment above
    indicateurDeuxTroisData: {
      motifNonCalculable: "",
      motifNonCalculablePrecision: "",
      resultatFinalEcart: 25,
      resultatFinalNombreSalaries: 5,
      sexeSurRepresente: "femmes",
      noteFinale: 25,
      mesuresCorrection: false,
    },
    // @ts-ignore: see comment above
    indicateurQuatreData: {
      motifNonCalculable: "",
      motifNonCalculablePrecision: "",
      resultatFinal: 80.0,
      noteFinale: 0,
    },
    indicateurCinqData: {
      resultatFinal: 4.0,
      sexeSurRepresente: "hommes",
      noteFinale: 10,
    },
    noteIndex: 78,
    totalPoint: 66,
    totalPointCalculable: 85,
  }

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toMatchSnapshot()
  })

  test("change default state", () => {
    expect(AppReducer(stateDefault, action)).toMatchSnapshot()
  })

  test("change complete state", () => {
    expect(AppReducer(stateComplete, action)).toMatchSnapshot()
  })
})
