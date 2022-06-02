import { CategorieSocioPro, TranchesAges, ActionType, AppState } from "./globals"

import AppReducer, { dataIndicateurUnCoefGroup } from "./AppReducer"

import stateDefault from "./__fixtures__/stateDefault"
import stateComplete from "./__fixtures__/stateComplete"
import stateCompleteAndValidate from "./__fixtures__/stateCompleteAndValidate"
import deepmerge from "deepmerge"
import { combineMerge } from "./utils/merge"

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

describe("updateIndicateurUnCoef", () => {
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

  describe("Array<{tranchesAges: Array<GroupTranchesAgesEffectif>}>", () => {
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
      expect(AppReducer(stateUndefinedWithOneGroup, action)).toStrictEqual(undefined)
    })

    test("change default state", () => {
      const { indicateurUn, ...rest } = AppReducer(stateDefaultWithOneGroup, action) as AppState
      const { indicateurUn: indicateurUnInitial, ...restInitial } = stateDefaultWithOneGroup as AppState

      const changedCoefficient = deepmerge(
        indicateurUnInitial.coefficient,
        // @ts-ignore
        action.data.coefficient,
        { arrayMerge: combineMerge },
      )

      expect(indicateurUn).toStrictEqual({
        ...indicateurUnInitial,
        coefficient: changedCoefficient,
      })
      expect(rest).toStrictEqual(restInitial)
    })

    test("change complete state", () => {
      const { indicateurUn, ...rest } = AppReducer(stateComplete, action) as AppState
      const { indicateurUn: indicateurUnInitial, ...restInitial } = stateComplete as AppState

      const changedCoefficient = deepmerge(
        indicateurUnInitial.coefficient,
        // @ts-ignore
        action.data.coefficient,
        { arrayMerge: combineMerge },
      )

      expect(indicateurUn).toStrictEqual({
        ...indicateurUnInitial,
        coefficient: changedCoefficient,
      })
      expect(rest).toStrictEqual(restInitial)
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
      expect(AppReducer(stateUndefinedWithOneGroup, action)).toStrictEqual(undefined)
    })

    test("change default state", () => {
      const { indicateurUn, ...rest } = AppReducer(stateDefaultWithOneGroup, action) as AppState
      const { indicateurUn: indicateurUnInitial, ...restInitial } = stateDefaultWithOneGroup as AppState

      const changedCoefficient = deepmerge(
        indicateurUnInitial.coefficient,
        // @ts-ignore
        action.data.coefficient,
        { arrayMerge: combineMerge },
      )

      expect(indicateurUn).toStrictEqual({
        ...indicateurUnInitial,
        coefficient: changedCoefficient,
      })
      expect(rest).toStrictEqual(restInitial)
    })

    test("change complete state", () => {
      const { indicateurUn, ...rest } = AppReducer(stateComplete, action) as AppState
      const { indicateurUn: indicateurUnInitial, ...restInitial } = stateComplete as AppState

      const changedCoefficient = deepmerge(
        indicateurUnInitial.coefficient,
        // @ts-ignore
        action.data.coefficient,
        { arrayMerge: combineMerge },
      )

      expect(indicateurUn).toStrictEqual({
        ...indicateurUnInitial,
        coefficient: changedCoefficient,
      })
      expect(rest).toStrictEqual(restInitial)
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
    expect(AppReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { indicateurDeux, ...rest } = AppReducer(stateDefault, action) as AppState
    const { indicateurDeux: indicateurDeuxInitial, ...restInitial } = stateDefault as AppState

    expect(indicateurDeux).toStrictEqual({
      ...indicateurDeuxInitial,
      presenceAugmentation: action.data.presenceAugmentation,
      tauxAugmentation: action.data.tauxAugmentation,
    })
    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { indicateurDeux, ...rest } = AppReducer(stateComplete, action) as AppState
    const { indicateurDeux: indicateurDeuxInitial, ...restInitial } = stateComplete as AppState

    expect(indicateurDeux).toStrictEqual({
      ...indicateurDeuxInitial,
      presenceAugmentation: action.data.presenceAugmentation,
      tauxAugmentation: action.data.tauxAugmentation,
    })
    expect(rest).toStrictEqual(restInitial)
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
    expect(AppReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { indicateurTrois, ...rest } = AppReducer(stateDefault, action) as AppState
    const { indicateurTrois: indicateurTroisInitial, ...restInitial } = stateDefault as AppState

    expect(indicateurTrois).toStrictEqual({
      ...indicateurTroisInitial,
      presencePromotion: action.data.presencePromotion,
      tauxPromotion: action.data.tauxPromotion,
    })
    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { indicateurTrois, ...rest } = AppReducer(stateComplete, action) as AppState
    const { indicateurTrois: indicateurTroisInitial, ...restInitial } = stateComplete as AppState

    expect(indicateurTrois).toStrictEqual({
      ...indicateurTroisInitial,
      presencePromotion: action.data.presencePromotion,
      tauxPromotion: action.data.tauxPromotion,
    })
    expect(rest).toStrictEqual(restInitial)
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
    expect(AppReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { indicateurDeuxTrois, ...rest } = AppReducer(stateDefault, action) as AppState
    const { indicateurDeuxTrois: indicateurDeuxTroisInitial, ...restInitial } = stateDefault as AppState

    expect(indicateurDeuxTrois).toStrictEqual({
      ...indicateurDeuxTroisInitial,
      presenceAugmentationPromotion: action.data.presenceAugmentationPromotion,
      nombreAugmentationPromotionFemmes: action.data.nombreAugmentationPromotionFemmes,
      nombreAugmentationPromotionHommes: action.data.nombreAugmentationPromotionHommes,
      periodeDeclaration: action.data.periodeDeclaration,
    })
    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { indicateurDeuxTrois, ...rest } = AppReducer(stateComplete, action) as AppState
    const { indicateurDeuxTrois: indicateurDeuxTroisInitial, ...restInitial } = stateComplete as AppState

    expect(indicateurDeuxTrois).toStrictEqual({
      ...indicateurDeuxTroisInitial,
      presenceAugmentationPromotion: action.data.presenceAugmentationPromotion,
      nombreAugmentationPromotionFemmes: action.data.nombreAugmentationPromotionFemmes,
      nombreAugmentationPromotionHommes: action.data.nombreAugmentationPromotionHommes,
      periodeDeclaration: action.data.periodeDeclaration,
    })
    expect(rest).toStrictEqual(restInitial)
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
    expect(AppReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { indicateurQuatre, ...rest } = AppReducer(stateDefault, action) as AppState
    const { indicateurQuatre: indicateurQuatreInitial, ...restInitial } = stateDefault as AppState

    expect(indicateurQuatre).toStrictEqual({
      ...indicateurQuatreInitial,
      ...action.data,
    })
    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { indicateurQuatre, ...rest } = AppReducer(stateComplete, action) as AppState
    const { indicateurQuatre: indicateurQuatreInitial, ...restInitial } = stateComplete as AppState

    expect(indicateurQuatre).toStrictEqual({
      ...indicateurQuatreInitial,
      ...action.data,
    })
    expect(rest).toStrictEqual(restInitial)
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
    expect(AppReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { indicateurCinq, ...rest } = AppReducer(stateDefault, action) as AppState
    const { indicateurCinq: indicateurCinqInitial, ...restInitial } = stateDefault as AppState

    expect(indicateurCinq).toStrictEqual({
      ...indicateurCinqInitial,
      ...action.data,
    })
    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { indicateurCinq, ...rest } = AppReducer(stateComplete, action) as AppState
    const { indicateurCinq: indicateurCinqInitial, ...restInitial } = stateComplete as AppState

    expect(indicateurCinq).toStrictEqual({
      ...indicateurCinqInitial,
      ...action.data,
    })
    expect(rest).toStrictEqual(restInitial)
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
      codePays: "",
      commune: "Montpellier",
      structure: "Unité Economique et Sociale (UES)",
      nomUES: "foobar UES",
      nombreEntreprises: 2,
      entreprisesUES: [{ nom: "entreprise 1", siren: "12345" }],
    },
  }

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { informationsEntreprise, ...rest } = AppReducer(stateDefault, action) as AppState
    const { informationsEntreprise: informationsEntrepriseInitial, ...restInitial } = stateDefault as AppState

    expect(informationsEntreprise).toStrictEqual({
      ...informationsEntrepriseInitial,
      ...action.data,
    })
    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { informationsEntreprise, ...rest } = AppReducer(stateComplete, action) as AppState
    const { informationsEntreprise: informationsEntrepriseInitial, ...restInitial } = stateComplete as AppState

    expect(informationsEntreprise).toStrictEqual({
      ...informationsEntrepriseInitial,
      ...action.data,
    })
    expect(rest).toStrictEqual(restInitial)
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
    expect(AppReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { informationsDeclarant, ...rest } = AppReducer(stateDefault, action) as AppState
    const { informationsDeclarant: informationsDeclarantInitial, ...restInitial } = stateDefault as AppState

    expect(informationsDeclarant).toStrictEqual({
      ...informationsDeclarantInitial,
      ...action.data,
    })
    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { informationsDeclarant, ...rest } = AppReducer(stateComplete, action) as AppState
    const { informationsDeclarant: informationsDeclarantInitial, ...restInitial } = stateComplete as AppState

    expect(informationsDeclarant).toStrictEqual({
      ...informationsDeclarantInitial,
      ...action.data,
    })
    expect(rest).toStrictEqual(restInitial)
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
    expect(AppReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { declaration, ...rest } = AppReducer(stateDefault, action) as AppState
    const { declaration: declarationInitial, ...restInitial } = stateDefault as AppState

    expect(declaration).toStrictEqual({
      ...declarationInitial,
      ...action.data,
    })
    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { declaration, ...rest } = AppReducer(stateComplete, action) as AppState
    const { declaration: declarationInitial, ...restInitial } = stateComplete as AppState

    expect(declaration).toStrictEqual({
      ...declarationInitial,
      ...action.data,
    })
    expect(rest).toStrictEqual(restInitial)
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
    expect(AppReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { informations, declaration, ...rest } = AppReducer(stateDefault, action) as AppState
    const {
      informations: informationsInitial,
      declaration: declarationInitial,
      ...restInitial
    } = stateDefault as AppState

    expect(informations).toStrictEqual({
      ...informationsInitial,
      formValidated: "Valid",
    })
    expect(declaration).toStrictEqual({
      ...declarationInitial,
      formValidated: declarationInitial.formValidated,
    })
    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { informations, declaration, ...rest } = AppReducer(stateComplete, action) as AppState
    const {
      informations: informationsInitial,
      declaration: declarationInitial,
      ...restInitial
    } = stateComplete as AppState

    expect(informations).toStrictEqual({
      ...informationsInitial,
      formValidated: "Valid",
    })
    expect(declaration).toStrictEqual({
      ...declarationInitial,
      formValidated: declarationInitial.formValidated,
    })
    expect(rest).toStrictEqual(restInitial)
  })
})

describe("validateEffectif", () => {
  describe("Valid", () => {
    const action: ActionType = {
      type: "validateEffectif",
      valid: "Valid",
    }

    test("nothing undefined state", () => {
      expect(AppReducer(stateUndefined, action)).toStrictEqual(undefined)
    })

    test("change default state", () => {
      const { effectif, ...rest } = AppReducer(stateDefault, action) as AppState
      const { effectif: effectifInitial, ...restInitial } = stateDefault as AppState

      expect(effectif).toStrictEqual({
        ...effectifInitial,
        formValidated: "Valid",
      })

      expect(rest).toStrictEqual(restInitial)
    })

    test("change complete state", () => {
      const { effectif, ...rest } = AppReducer(stateComplete, action) as AppState
      const { effectif: effectifInitial, ...restInitial } = stateComplete as AppState

      expect(effectif).toStrictEqual({
        ...effectifInitial,
        formValidated: "Valid",
      })

      expect(rest).toStrictEqual(restInitial)
    })
  })

  describe("None with csp true", () => {
    const action: ActionType = {
      type: "validateEffectif",
      valid: "None",
    }

    test("invalid complete validate state", () => {
      const { effectif, indicateurUn, indicateurDeux, indicateurTrois, indicateurDeuxTrois, declaration, ...rest } =
        AppReducer(stateCompleteAndValidate, action) as AppState
      const {
        effectif: effectifInitial,
        indicateurUn: indicateurUnInitial,
        indicateurDeux: indicateurDeuxInitial,
        indicateurTrois: indicateurTroisInitial,
        indicateurDeuxTrois: indicateurDeuxTroisInitial,
        declaration: declarationInitial,
        ...restInitial
      } = stateCompleteAndValidate as AppState

      expect(effectif).toStrictEqual({
        ...effectifInitial,
        formValidated: "None",
      })
      expect(indicateurUn).toStrictEqual({
        ...indicateurUnInitial,
        formValidated: "Invalid",
        coefficientEffectifFormValidated: "Invalid",
      })
      expect(indicateurDeux).toStrictEqual({
        ...indicateurDeuxInitial,
        formValidated: "Invalid",
      })
      expect(indicateurTrois).toStrictEqual({
        ...indicateurTroisInitial,
        formValidated: "Invalid",
      })
      expect(indicateurDeuxTrois).toStrictEqual({
        ...indicateurDeuxTroisInitial,
        formValidated: "Invalid",
      })
      expect(declaration).toStrictEqual({
        ...declarationInitial,
        formValidated: "Invalid",
      })
      expect(rest).toStrictEqual(restInitial)
    })
  })

  describe("None with csp false", () => {
    const actionUpdateIndicateurUnType: ActionType = {
      type: "updateIndicateurUnType",
      data: { csp: false, coef: false, autre: false },
    }

    const stateCompleteAndValidateCoef = AppReducer(stateCompleteAndValidate, actionUpdateIndicateurUnType)

    test("stateCompleteAndValidateCoef", () => {
      const { indicateurUn, ...rest } = stateCompleteAndValidateCoef as AppState
      const { indicateurUn: indicateurUnInitial, ...restInitial } = stateCompleteAndValidateCoef as AppState

      expect(indicateurUn).toStrictEqual({
        ...indicateurUnInitial,
        csp: actionUpdateIndicateurUnType.data.csp,
        coef: actionUpdateIndicateurUnType.data.coef,
        autre: actionUpdateIndicateurUnType.data.autre,
      })

      expect(rest).toStrictEqual(restInitial)
    })

    const action: ActionType = {
      type: "validateEffectif",
      valid: "None",
    }

    test("invalid complete validate state", () => {
      const { effectif, indicateurUn, indicateurDeux, indicateurTrois, indicateurDeuxTrois, declaration, ...rest } =
        AppReducer(stateCompleteAndValidateCoef, action) as AppState
      const {
        effectif: effectifInitial,
        indicateurUn: indicateurUnInitial,
        indicateurDeux: indicateurDeuxInitial,
        indicateurTrois: indicateurTroisInitial,
        indicateurDeuxTrois: indicateurDeuxTroisInitial,
        declaration: declarationInitial,
        ...restInitial
      } = stateCompleteAndValidateCoef as AppState

      expect(effectif).toStrictEqual({
        ...effectifInitial,
        formValidated: "None",
      })
      expect(indicateurUn).toStrictEqual({
        ...indicateurUnInitial,
        formValidated: "Invalid",
        coefficientEffectifFormValidated: "Invalid",
      })
      expect(indicateurDeux).toStrictEqual({
        ...indicateurDeuxInitial,
        formValidated: "Invalid",
      })
      expect(indicateurTrois).toStrictEqual({
        ...indicateurTroisInitial,
        formValidated: "Invalid",
      })
      expect(indicateurDeuxTrois).toStrictEqual({
        ...indicateurDeuxTroisInitial,
        formValidated: "Invalid",
      })
      expect(declaration).toStrictEqual({
        ...declarationInitial,
        formValidated: "Invalid",
      })
      expect(rest).toStrictEqual(restInitial)
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
      expect(AppReducer(stateUndefined, action)).toStrictEqual(undefined)
    })

    test("change default state", () => {
      const { indicateurUn, declaration, ...rest } = AppReducer(stateDefault, action) as AppState
      const {
        indicateurUn: indicateurUnInitial,
        declaration: declarationInitial,
        ...restInitial
      } = stateDefault as AppState

      expect(indicateurUn).toStrictEqual({
        ...indicateurUnInitial,
        coefficientGroupFormValidated: "Valid",
        coefficientEffectifFormValidated: indicateurUnInitial.coefficientEffectifFormValidated,
        formValidated: indicateurUnInitial.formValidated,
      })

      expect(declaration).toStrictEqual({
        ...declarationInitial,
        formValidated: declarationInitial.formValidated,
      })

      expect(rest).toStrictEqual(restInitial)
    })

    test("change complete state", () => {
      const { indicateurUn, declaration, ...rest } = AppReducer(stateComplete, action) as AppState
      const {
        indicateurUn: indicateurUnInitial,
        declaration: declarationInitial,
        ...restInitial
      } = stateComplete as AppState

      expect(indicateurUn).toStrictEqual({
        ...indicateurUnInitial,
        coefficientGroupFormValidated: "Valid",
        coefficientEffectifFormValidated: indicateurUnInitial.coefficientEffectifFormValidated,
        formValidated: indicateurUnInitial.formValidated,
      })

      expect(declaration).toStrictEqual({
        ...declarationInitial,
        formValidated: declarationInitial.formValidated,
      })

      expect(rest).toStrictEqual(restInitial)
    })
  })

  describe("None", () => {
    const action: ActionType = {
      type: "validateIndicateurUnCoefGroup",
      valid: "None",
    }

    test("invalid complete validate state", () => {
      const { indicateurUn, declaration, ...rest } = AppReducer(stateCompleteAndValidate, action) as AppState
      const {
        indicateurUn: indicateurUnInitial,
        declaration: declarationInitial,
        ...restInitial
      } = stateCompleteAndValidate as AppState

      expect(indicateurUn).toStrictEqual({
        ...indicateurUnInitial,
        coefficientGroupFormValidated: "None",
        coefficientEffectifFormValidated: "Invalid",
        formValidated: "Invalid",
      })

      expect(declaration).toStrictEqual({
        ...declarationInitial,
        formValidated: "Invalid",
      })

      expect(rest).toStrictEqual(restInitial)
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
      expect(AppReducer(stateUndefined, action)).toStrictEqual(undefined)
    })

    test("change default state", () => {
      const { indicateurUn, declaration, ...rest } = AppReducer(stateDefault, action) as AppState
      const {
        indicateurUn: indicateurUnInitial,
        declaration: declarationInitial,
        ...restInitial
      } = stateDefault as AppState

      expect(indicateurUn).toStrictEqual({
        ...indicateurUnInitial,
        coefficientEffectifFormValidated: "Valid",
        formValidated: indicateurUnInitial.formValidated,
      })

      expect(declaration).toStrictEqual({
        ...declarationInitial,
        formValidated: declarationInitial.formValidated,
      })

      expect(rest).toStrictEqual(restInitial)
    })

    test("change complete state", () => {
      const { indicateurUn, declaration, ...rest } = AppReducer(stateComplete, action) as AppState
      const {
        indicateurUn: indicateurUnInitial,
        declaration: declarationInitial,
        ...restInitial
      } = stateComplete as AppState

      expect(indicateurUn).toStrictEqual({
        ...indicateurUnInitial,
        coefficientEffectifFormValidated: "Valid",
        formValidated: indicateurUnInitial.formValidated,
      })

      expect(declaration).toStrictEqual({
        ...declarationInitial,
        formValidated: declarationInitial.formValidated,
      })

      expect(rest).toStrictEqual(restInitial)
    })
  })

  describe("None", () => {
    const action: ActionType = {
      type: "validateIndicateurUnCoefEffectif",
      valid: "None",
    }

    test("invalid complete validate state", () => {
      const { indicateurUn, declaration, ...rest } = AppReducer(stateCompleteAndValidate, action) as AppState
      const {
        indicateurUn: indicateurUnInitial,
        declaration: declarationInitial,
        ...restInitial
      } = stateCompleteAndValidate as AppState

      expect(indicateurUn).toStrictEqual({
        ...indicateurUnInitial,
        coefficientEffectifFormValidated: "None",
        formValidated: "Invalid",
      })

      expect(declaration).toStrictEqual({
        ...declarationInitial,
        formValidated: "Invalid",
      })

      expect(rest).toStrictEqual(restInitial)
    })
  })
})

describe("validateIndicateurUn", () => {
  const action: ActionType = {
    type: "validateIndicateurUn",
    valid: "Valid",
  }

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { indicateurUn, declaration, ...rest } = AppReducer(stateDefault, action) as AppState
    const {
      indicateurUn: indicateurUnInitial,
      declaration: declarationInitial,
      ...restInitial
    } = stateDefault as AppState

    expect(indicateurUn).toStrictEqual({
      ...indicateurUnInitial,
      formValidated: "Valid",
    })

    expect(declaration).toStrictEqual({
      ...declarationInitial,
      formValidated: declarationInitial.formValidated,
    })

    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { indicateurUn, declaration, ...rest } = AppReducer(stateComplete, action) as AppState
    const {
      indicateurUn: indicateurUnInitial,
      declaration: declarationInitial,
      ...restInitial
    } = stateComplete as AppState

    expect(indicateurUn).toStrictEqual({
      ...indicateurUnInitial,
      formValidated: "Valid",
    })

    expect(declaration).toStrictEqual({
      ...declarationInitial,
      formValidated: declarationInitial.formValidated,
    })

    expect(rest).toStrictEqual(restInitial)
  })
})

describe("validateIndicateurDeux", () => {
  const action: ActionType = {
    type: "validateIndicateurDeux",
    valid: "Valid",
  }

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { indicateurDeux, declaration, ...rest } = AppReducer(stateDefault, action) as AppState
    const {
      indicateurDeux: indicateurDeuxInitial,
      declaration: declarationInitial,
      ...restInitial
    } = stateDefault as AppState

    expect(indicateurDeux).toStrictEqual({
      ...indicateurDeuxInitial,
      formValidated: "Valid",
    })

    expect(declaration).toStrictEqual({
      ...declarationInitial,
      formValidated: declarationInitial.formValidated,
    })

    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { indicateurDeux, declaration, ...rest } = AppReducer(stateComplete, action) as AppState
    const {
      indicateurDeux: indicateurDeuxInitial,
      declaration: declarationInitial,
      ...restInitial
    } = stateComplete as AppState

    expect(indicateurDeux).toStrictEqual({
      ...indicateurDeuxInitial,
      formValidated: "Valid",
    })

    expect(declaration).toStrictEqual({
      ...declarationInitial,
      formValidated: declarationInitial.formValidated,
    })

    expect(rest).toStrictEqual(restInitial)
  })
})

describe("validateIndicateurTrois", () => {
  const action: ActionType = {
    type: "validateIndicateurTrois",
    valid: "Valid",
  }

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { indicateurTrois, declaration, ...rest } = AppReducer(stateDefault, action) as AppState
    const {
      indicateurTrois: indicateurTroisInitial,
      declaration: declarationInitial,
      ...restInitial
    } = stateDefault as AppState

    expect(indicateurTrois).toStrictEqual({
      ...indicateurTroisInitial,
      formValidated: "Valid",
    })

    expect(declaration).toStrictEqual({
      ...declarationInitial,
      formValidated: declarationInitial.formValidated,
    })

    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { indicateurTrois, declaration, ...rest } = AppReducer(stateComplete, action) as AppState
    const {
      indicateurTrois: indicateurTroisInitial,
      declaration: declarationInitial,
      ...restInitial
    } = stateComplete as AppState

    expect(indicateurTrois).toStrictEqual({
      ...indicateurTroisInitial,
      formValidated: "Valid",
    })

    expect(declaration).toStrictEqual({
      ...declarationInitial,
      formValidated: declarationInitial.formValidated,
    })

    expect(rest).toStrictEqual(restInitial)
  })
})

describe("validateIndicateurDeuxTrois", () => {
  const action: ActionType = {
    type: "validateIndicateurDeuxTrois",
    valid: "Valid",
  }

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { indicateurDeuxTrois, declaration, ...rest } = AppReducer(stateDefault, action) as AppState
    const {
      indicateurDeuxTrois: indicateurDeuxTroisInitial,
      declaration: declarationInitial,
      ...restInitial
    } = stateDefault as AppState

    expect(indicateurDeuxTrois).toStrictEqual({
      ...indicateurDeuxTroisInitial,
      formValidated: "Valid",
    })

    expect(declaration).toStrictEqual({
      ...declarationInitial,
      formValidated: declarationInitial.formValidated,
    })

    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { indicateurDeuxTrois, declaration, ...rest } = AppReducer(stateComplete, action) as AppState
    const {
      indicateurDeuxTrois: indicateurDeuxTroisInitial,
      declaration: declarationInitial,
      ...restInitial
    } = stateComplete as AppState

    expect(indicateurDeuxTrois).toStrictEqual({
      ...indicateurDeuxTroisInitial,
      formValidated: "Valid",
    })

    expect(declaration).toStrictEqual({
      ...declarationInitial,
      formValidated: declarationInitial.formValidated,
    })

    expect(rest).toStrictEqual(restInitial)
  })
})

describe("validateIndicateurQuatre", () => {
  const action: ActionType = {
    type: "validateIndicateurQuatre",
    valid: "Valid",
  }

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { indicateurQuatre, declaration, ...rest } = AppReducer(stateDefault, action) as AppState
    const {
      indicateurQuatre: indicateurQuatreInitial,
      declaration: declarationInitial,
      ...restInitial
    } = stateDefault as AppState

    expect(indicateurQuatre).toStrictEqual({
      ...indicateurQuatreInitial,
      formValidated: "Valid",
    })

    expect(declaration).toStrictEqual({
      ...declarationInitial,
      formValidated: declarationInitial.formValidated,
    })

    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { indicateurQuatre, declaration, ...rest } = AppReducer(stateComplete, action) as AppState
    const {
      indicateurQuatre: indicateurQuatreInitial,
      declaration: declarationInitial,
      ...restInitial
    } = stateComplete as AppState

    expect(indicateurQuatre).toStrictEqual({
      ...indicateurQuatreInitial,
      formValidated: "Valid",
    })

    expect(declaration).toStrictEqual({
      ...declarationInitial,
      formValidated: declarationInitial.formValidated,
    })

    expect(rest).toStrictEqual(restInitial)
  })
})

describe("validateIndicateurCinq", () => {
  const action: ActionType = {
    type: "validateIndicateurCinq",
    valid: "Valid",
  }

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { indicateurCinq, declaration, ...rest } = AppReducer(stateDefault, action) as AppState
    const {
      indicateurCinq: indicateurCinqInitial,
      declaration: declarationInitial,
      ...restInitial
    } = stateDefault as AppState

    expect(indicateurCinq).toStrictEqual({
      ...indicateurCinqInitial,
      formValidated: "Valid",
    })

    expect(declaration).toStrictEqual({
      ...declarationInitial,
      formValidated: declarationInitial.formValidated,
    })

    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { indicateurCinq, declaration, ...rest } = AppReducer(stateComplete, action) as AppState
    const {
      indicateurCinq: indicateurCinqInitial,
      declaration: declarationInitial,
      ...restInitial
    } = stateComplete as AppState

    expect(indicateurCinq).toStrictEqual({
      ...indicateurCinqInitial,
      formValidated: "Valid",
    })

    expect(declaration).toStrictEqual({
      ...declarationInitial,
      formValidated: declarationInitial.formValidated,
    })

    expect(rest).toStrictEqual(restInitial)
  })
})

describe("validateInformationsEntreprise", () => {
  const action: ActionType = {
    type: "validateInformationsEntreprise",
    valid: "Valid",
  }

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { informationsEntreprise, declaration, ...rest } = AppReducer(stateDefault, action) as AppState
    const {
      informationsEntreprise: informationsEntrepriseInitial,
      declaration: declarationInitial,
      ...restInitial
    } = stateDefault as AppState

    expect(informationsEntreprise).toStrictEqual({
      ...informationsEntrepriseInitial,
      formValidated: "Valid",
    })

    expect(declaration).toStrictEqual({
      ...declarationInitial,
      formValidated: declarationInitial.formValidated,
    })

    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { informationsEntreprise, declaration, ...rest } = AppReducer(stateComplete, action) as AppState
    const {
      informationsEntreprise: informationsEntrepriseInitial,
      declaration: declarationInitial,
      ...restInitial
    } = stateComplete as AppState

    expect(informationsEntreprise).toStrictEqual({
      ...informationsEntrepriseInitial,
      formValidated: "Valid",
    })

    expect(declaration).toStrictEqual({
      ...declarationInitial,
      formValidated: declarationInitial.formValidated,
    })

    expect(rest).toStrictEqual(restInitial)
  })
})

describe("validateInformationsDeclarant", () => {
  const action: ActionType = {
    type: "validateInformationsDeclarant",
    valid: "Valid",
  }

  test("nothing undefined state", () => {
    expect(AppReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { informationsDeclarant, declaration, ...rest } = AppReducer(stateDefault, action) as AppState
    const {
      informationsDeclarant: informationsDeclarantInitial,
      declaration: declarationInitial,
      ...restInitial
    } = stateDefault as AppState

    expect(informationsDeclarant).toStrictEqual({
      ...informationsDeclarantInitial,
      formValidated: "Valid",
    })

    expect(declaration).toStrictEqual({
      ...declarationInitial,
      formValidated: declarationInitial.formValidated,
    })

    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { informationsDeclarant, declaration, ...rest } = AppReducer(stateComplete, action) as AppState
    const {
      informationsDeclarant: informationsDeclarantInitial,
      declaration: declarationInitial,
      ...restInitial
    } = stateComplete as AppState

    expect(informationsDeclarant).toStrictEqual({
      ...informationsDeclarantInitial,
      formValidated: "Valid",
    })

    expect(declaration).toStrictEqual({
      ...declarationInitial,
      formValidated: declarationInitial.formValidated,
    })

    expect(rest).toStrictEqual(restInitial)
  })
})

// Test limité car les types TS ne sont pas cohérents avec les jeux de données. (ex: effectifData non renseigné, etc. )
// TODO : corriger les types dans global.ts ou bien ajouter les paramètres manquants dans ce test.
describe("validateDeclaration", () => {
  const action: ActionType = {
    type: "validateDeclaration",
    valid: "Valid",
    // @ts-ignore: see comment above
    indicateurUnData: {
      coefficient: [],
      motifNonCalculable: "",
      motifNonCalculablePrecision: "",
      nombreCoefficients: 6,
      noteFinale: 31,
      resultatFinal: 8.0,
      sexeSurRepresente: "femmes",
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
    expect(AppReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    expect(AppReducer(stateDefault, action)).toMatchSnapshot()
  })

  test("change complete state", () => {
    expect(AppReducer(stateComplete, action)).toMatchSnapshot()
  })
})
