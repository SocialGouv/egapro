import { CSP, TrancheAge, ActionType, AppState, CoefficientGroupe } from "./globals"

import appReducer, { defaultDataIndicateurUnCoefGroup } from "./app-reducer"

import stateDefault from "./__fixtures__/stateDefault"
import stateComplete from "./__fixtures__/stateComplete"
import stateCompleteAndValidate from "./__fixtures__/stateCompleteAndValidate"
import deepmerge from "deepmerge"
import { combineMerge } from "./utils/merge"
import produce from "immer"
import { calculerValiditeGroupe3 } from "./utils/calculsEgaProIndicateurUn"

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
    expect(appReducer(stateUndefined, { type: "resetState" })).toStrictEqual(undefined)
  })

  test("reset default state", () => {
    expect(appReducer(stateDefault, { type: "resetState" })).toStrictEqual(undefined)
  })

  test("reset complete state", () => {
    expect(appReducer(stateComplete, { type: "resetState" })).toStrictEqual(undefined)
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
    expect(appReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { informations, ...rest } = appReducer(stateDefault, action) as AppState
    const { informations: informationsInitial, ...restInitial } = stateDefault as AppState

    expect(informations).toStrictEqual({
      ...informationsInitial,
      ...action.data,
    })
    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { informations, ...rest } = appReducer(stateComplete, action) as AppState
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
          categorieSocioPro: CSP.Ouvriers,
          tranchesAges: [
            {
              trancheAge: TrancheAge.MoinsDe30ans,
              nombreSalariesFemmes: 24,
              nombreSalariesHommes: 33,
            },
            {
              trancheAge: TrancheAge.De30a39ans,
              nombreSalariesFemmes: 13,
              nombreSalariesHommes: 14,
            },
            {
              trancheAge: TrancheAge.De40a49ans,
              nombreSalariesFemmes: 35,
              nombreSalariesHommes: 8,
            },
            {
              trancheAge: TrancheAge.PlusDe50ans,
              nombreSalariesFemmes: 6,
              nombreSalariesHommes: 22,
            },
          ],
        },
        {
          categorieSocioPro: CSP.Employes,
          tranchesAges: [
            {
              trancheAge: TrancheAge.MoinsDe30ans,
              nombreSalariesFemmes: 64,
              nombreSalariesHommes: 26,
            },
            {
              trancheAge: TrancheAge.De30a39ans,
              nombreSalariesFemmes: 53,
              nombreSalariesHommes: 63,
            },
            {
              trancheAge: TrancheAge.De40a49ans,
              nombreSalariesFemmes: 17,
              nombreSalariesHommes: 19,
            },
            {
              trancheAge: TrancheAge.PlusDe50ans,
              nombreSalariesFemmes: 28,
              nombreSalariesHommes: 20,
            },
          ],
        },
        {
          categorieSocioPro: CSP.Techniciens,
          tranchesAges: [
            {
              trancheAge: TrancheAge.MoinsDe30ans,
              nombreSalariesFemmes: 15,
              nombreSalariesHommes: 16,
            },
            {
              trancheAge: TrancheAge.De30a39ans,
              nombreSalariesFemmes: 6,
              nombreSalariesHommes: 7,
            },
            {
              trancheAge: TrancheAge.De40a49ans,
              nombreSalariesFemmes: 3,
              nombreSalariesHommes: 4,
            },
            {
              trancheAge: TrancheAge.PlusDe50ans,
              nombreSalariesFemmes: 5,
              nombreSalariesHommes: 6,
            },
          ],
        },
        {
          categorieSocioPro: CSP.Cadres,
          tranchesAges: [
            {
              trancheAge: TrancheAge.MoinsDe30ans,
              nombreSalariesFemmes: 4,
              nombreSalariesHommes: 9,
            },
            {
              trancheAge: TrancheAge.De30a39ans,
              nombreSalariesFemmes: 20,
              nombreSalariesHommes: 18,
            },
            {
              trancheAge: TrancheAge.De40a49ans,
              nombreSalariesFemmes: 3,
              nombreSalariesHommes: 3,
            },
            {
              trancheAge: TrancheAge.PlusDe50ans,
              nombreSalariesFemmes: 6,
              nombreSalariesHommes: 9,
            },
          ],
        },
      ],
    },
  }

  test("nothing undefined state", () => {
    expect(appReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { effectif, ...rest } = appReducer(stateDefault, action) as AppState
    const { effectif: effectifInitial, ...restInitial } = stateDefault as AppState

    expect(effectif).toStrictEqual({ ...effectifInitial, ...action.data })
    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { effectif, ...rest } = appReducer(stateComplete, action) as AppState
    const { effectif: effectifInitial, ...restInitial } = stateComplete as AppState

    expect(effectif).toStrictEqual({ ...effectifInitial, ...action.data })
    expect(rest).toStrictEqual(restInitial)
  })
})

describe("updateIndicateurUnModaliteCalcul", () => {
  const action: ActionType = {
    type: "updateIndicateurUnModaliteCalcul",
    data: { modaliteCalcul: undefined },
  }

  test("nothing undefined state", () => {
    expect(appReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { indicateurUn, ...rest } = appReducer(stateDefault, action) as AppState
    const { indicateurUn: indicateurUnInitial, ...restInitial } = stateDefault as AppState

    expect(indicateurUn).toStrictEqual({ ...indicateurUnInitial, ...action.data })
    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { indicateurUn, ...rest } = appReducer(stateComplete, action) as AppState
    const { indicateurUn: indicateurUnInitial, ...restInitial } = stateComplete as AppState

    expect(indicateurUn).toStrictEqual({ ...indicateurUnInitial, ...action.data })
    expect(rest).toStrictEqual(restInitial)
  })
})

describe("updateIndicateurUnCsp", () => {
  const action: ActionType = {
    type: "updateIndicateurUnCsp",
    data: {
      remunerationsAnnuelles: [
        {
          categorieSocioPro: CSP.Ouvriers,
          tranchesAges: [
            {
              trancheAge: TrancheAge.MoinsDe30ans,
              remunerationAnnuelleBrutFemmes: 23500,
              remunerationAnnuelleBrutHommes: 25500,
            },
            {
              trancheAge: TrancheAge.De30a39ans,
              remunerationAnnuelleBrutFemmes: 24500,
              remunerationAnnuelleBrutHommes: 26500,
            },
            {
              trancheAge: TrancheAge.De40a49ans,
              remunerationAnnuelleBrutFemmes: 25600,
              remunerationAnnuelleBrutHommes: 26500,
            },
            {
              trancheAge: TrancheAge.PlusDe50ans,
              remunerationAnnuelleBrutFemmes: 27600,
              remunerationAnnuelleBrutHommes: 28500,
            },
          ],
        },
        {
          categorieSocioPro: CSP.Employes,
          tranchesAges: [
            {
              trancheAge: TrancheAge.MoinsDe30ans,
              remunerationAnnuelleBrutFemmes: 23400,
              remunerationAnnuelleBrutHommes: 25400,
            },
            {
              trancheAge: TrancheAge.De30a39ans,
              remunerationAnnuelleBrutFemmes: 24400,
              remunerationAnnuelleBrutHommes: 26400,
            },
            {
              trancheAge: TrancheAge.De40a49ans,
              remunerationAnnuelleBrutFemmes: 31400,
              remunerationAnnuelleBrutHommes: 33400,
            },
            {
              trancheAge: TrancheAge.PlusDe50ans,
              remunerationAnnuelleBrutFemmes: 39400,
              remunerationAnnuelleBrutHommes: 43400,
            },
          ],
        },
        {
          categorieSocioPro: CSP.Techniciens,
          tranchesAges: [
            {
              trancheAge: TrancheAge.MoinsDe30ans,
              remunerationAnnuelleBrutFemmes: 26650,
              remunerationAnnuelleBrutHommes: 28650,
            },
            {
              trancheAge: TrancheAge.De30a39ans,
              remunerationAnnuelleBrutFemmes: 27650,
              remunerationAnnuelleBrutHommes: 29650,
            },
            {
              trancheAge: TrancheAge.De40a49ans,
              remunerationAnnuelleBrutFemmes: 34650,
              remunerationAnnuelleBrutHommes: 36650,
            },
            {
              trancheAge: TrancheAge.PlusDe50ans,
              remunerationAnnuelleBrutFemmes: 42650,
              remunerationAnnuelleBrutHommes: 46650,
            },
          ],
        },
        {
          categorieSocioPro: CSP.Cadres,
          tranchesAges: [
            {
              trancheAge: TrancheAge.MoinsDe30ans,
              remunerationAnnuelleBrutFemmes: 36700,
              remunerationAnnuelleBrutHommes: 38700,
            },
            {
              trancheAge: TrancheAge.De30a39ans,
              remunerationAnnuelleBrutFemmes: 37700,
              remunerationAnnuelleBrutHommes: 39700,
            },
            {
              trancheAge: TrancheAge.De40a49ans,
              remunerationAnnuelleBrutFemmes: 44700,
              remunerationAnnuelleBrutHommes: 46700,
            },
            {
              trancheAge: TrancheAge.PlusDe50ans,
              remunerationAnnuelleBrutFemmes: 52700,
              remunerationAnnuelleBrutHommes: 56700,
            },
          ],
        },
      ],
    },
  }

  test("nothing undefined state", () => {
    expect(appReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { indicateurUn, ...rest } = appReducer(stateDefault, action) as AppState
    const { indicateurUn: indicateurUnInitial, ...restInitial } = stateDefault as AppState

    expect(indicateurUn).toStrictEqual({ ...indicateurUnInitial, ...action.data })
    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { indicateurUn, ...rest } = appReducer(stateComplete, action) as AppState
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
    expect(appReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { indicateurUn, ...rest } = appReducer(stateDefault, action) as AppState
    const { indicateurUn: indicateurUnInitial, ...restInitial } = stateDefault as AppState

    expect(indicateurUn).toStrictEqual({
      ...indicateurUnInitial,
      coefficients: [...indicateurUnInitial.coefficients, defaultDataIndicateurUnCoefGroup],
    })
    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { indicateurUn, ...rest } = appReducer(stateComplete, action) as AppState
    const { indicateurUn: indicateurUnInitial, ...restInitial } = stateComplete as AppState

    expect(indicateurUn).toStrictEqual({
      ...indicateurUnInitial,
      coefficients: [...indicateurUnInitial.coefficients, defaultDataIndicateurUnCoefGroup],
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
    expect(appReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { indicateurUn, ...rest } = appReducer(stateDefault, action) as AppState
    const { indicateurUn: indicateurUnInitial, ...restInitial } = stateDefault as AppState

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, ...restCoefficients] = indicateurUnInitial.coefficients

    expect(indicateurUn).toStrictEqual({
      ...indicateurUnInitial,
      coefficients: restCoefficients,
    })
    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { indicateurUn, ...rest } = appReducer(stateComplete, action) as AppState
    const { indicateurUn: indicateurUnInitial, ...restInitial } = stateComplete as AppState

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, ...restCoefficients] = indicateurUnInitial.coefficients

    expect(indicateurUn).toStrictEqual({
      ...indicateurUnInitial,
      coefficients: restCoefficients,
    })
    expect(rest).toStrictEqual(restInitial)
  })
})

describe("updateIndicateurUnCoef", () => {
  const actionCoefAddGroup: ActionType = {
    type: "updateIndicateurUnCoefAddGroup",
  }
  const stateUndefinedWithOneGroup = appReducer(stateUndefined, actionCoefAddGroup)
  const stateDefaultWithOneGroup = appReducer(stateDefault, actionCoefAddGroup)

  describe("Array<{name: string}>", () => {
    const action: ActionType = {
      type: "updateIndicateurUnCoef",
      data: {
        coefficients: [
          {
            nom: "Commercial",
          },
        ],
      },
    }

    test("nothing undefined state", () => {
      expect(appReducer(stateUndefinedWithOneGroup, action)).toStrictEqual(undefined)
    })

    test("change default state", () => {
      const { indicateurUn: indicateurUnInitial, ...restInitial } = stateDefaultWithOneGroup as AppState
      // Only name is supposed to change, so we just patch the initial indicateurUn.
      const patchedIndicateurUnInitial = produce(indicateurUnInitial, (draft) => {
        draft.coefficients[0].nom = "Commercial"
      })
      const { indicateurUn, ...rest } = appReducer(stateDefaultWithOneGroup, action) as AppState

      expect(indicateurUn).toStrictEqual(patchedIndicateurUnInitial)
      expect(rest).toStrictEqual(restInitial)
    })

    test("change complete state", () => {
      const { indicateurUn: indicateurUnInitial, ...restInitial } = stateComplete as AppState
      // Only name is supposed to change, so we just patch the initial indicateurUn.
      const patchedIndicateurUnInitial = produce(indicateurUnInitial, (draft) => {
        draft.coefficients[0].nom = "Commercial"
      })
      const { indicateurUn, ...rest } = appReducer(stateComplete, action) as AppState

      expect(indicateurUn).toStrictEqual(patchedIndicateurUnInitial)
      expect(rest).toStrictEqual(restInitial)
    })
  })

  describe("Array<{tranchesAges: Array<GroupTranchesAgesEffectif>}>", () => {
    const action: ActionType = {
      type: "updateIndicateurUnCoef",
      data: {
        coefficients: [
          {
            tranchesAges: [
              {
                trancheAge: TrancheAge.MoinsDe30ans,
                nombreSalariesFemmes: 3,
                nombreSalariesHommes: 2,
              },
              {
                trancheAge: TrancheAge.De30a39ans,
                nombreSalariesFemmes: 0,
                nombreSalariesHommes: 8,
              },
              {
                trancheAge: TrancheAge.De40a49ans,
                nombreSalariesFemmes: 10,
                nombreSalariesHommes: 13,
              },
              {
                trancheAge: TrancheAge.PlusDe50ans,
                nombreSalariesFemmes: 4,
                nombreSalariesHommes: 19,
              },
            ],
          },
        ],
      },
    }

    test("nothing undefined state", () => {
      expect(appReducer(stateUndefinedWithOneGroup, action)).toStrictEqual(undefined)
    })

    test("change default state", () => {
      const { indicateurUn: indicateurUnInitial, ...restInitial } = stateDefaultWithOneGroup as AppState
      const { indicateurUn, ...rest } = appReducer(stateDefaultWithOneGroup, action) as AppState

      const changedCoefficient = deepmerge(
        indicateurUnInitial.coefficients,
        action.data.coefficients as CoefficientGroupe[], // An element in action.data.coefficients is a subset of CoefficientGroupe.
        {
          arrayMerge: combineMerge,
        },
      )

      expect(indicateurUn).toStrictEqual({
        ...indicateurUnInitial,
        coefficients: changedCoefficient,
      })
      expect(rest).toStrictEqual(restInitial)
    })

    test("change complete state", () => {
      const { indicateurUn, ...rest } = appReducer(stateComplete, action) as AppState
      const { indicateurUn: indicateurUnInitial, ...restInitial } = stateComplete as AppState

      const changedCoefficient = deepmerge(
        indicateurUnInitial.coefficients,
        // @ts-ignore
        action.data.coefficients,
        { arrayMerge: combineMerge },
      )

      expect(indicateurUn).toStrictEqual({
        ...indicateurUnInitial,
        coefficients: changedCoefficient,
      })
      expect(rest).toStrictEqual(restInitial)
    })
  })

  describe("Array<{tranchesAges: Array<GroupTranchesAgesIndicateurUn>}>", () => {
    const action: ActionType = {
      type: "updateIndicateurUnCoef",
      data: {
        coefficients: [
          {
            tranchesAges: [
              {
                trancheAge: TrancheAge.MoinsDe30ans,
                remunerationAnnuelleBrutFemmes: 25820,
                remunerationAnnuelleBrutHommes: 24820,
              },
              {
                trancheAge: TrancheAge.De30a39ans,
                remunerationAnnuelleBrutFemmes: 32820,
                remunerationAnnuelleBrutHommes: 32820,
              },
              {
                trancheAge: TrancheAge.De40a49ans,
                remunerationAnnuelleBrutFemmes: 41820,
                remunerationAnnuelleBrutHommes: 43820,
              },
              {
                trancheAge: TrancheAge.PlusDe50ans,
                remunerationAnnuelleBrutFemmes: 49820,
                remunerationAnnuelleBrutHommes: 53550,
              },
            ],
          },
        ],
      },
    }

    test("nothing undefined state", () => {
      expect(appReducer(stateUndefinedWithOneGroup, action)).toStrictEqual(undefined)
    })

    test("change default state", () => {
      const { indicateurUn, ...rest } = appReducer(stateDefaultWithOneGroup, action) as AppState
      const { indicateurUn: indicateurUnInitial, ...restInitial } = stateDefaultWithOneGroup as AppState

      const changedCoefficient = deepmerge(
        indicateurUnInitial.coefficients,
        // @ts-ignore
        action.data.coefficients,
        { arrayMerge: combineMerge },
      )

      expect(indicateurUn).toStrictEqual({
        ...indicateurUnInitial,
        coefficients: changedCoefficient,
      })
      expect(rest).toStrictEqual(restInitial)
    })

    test("change complete state", () => {
      const { indicateurUn, ...rest } = appReducer(stateComplete, action) as AppState
      const { indicateurUn: indicateurUnInitial, ...restInitial } = stateComplete as AppState

      const changedCoefficient = deepmerge(
        indicateurUnInitial.coefficients,
        // @ts-ignore
        action.data.coefficients,
        { arrayMerge: combineMerge },
      )

      expect(indicateurUn).toStrictEqual({
        ...indicateurUnInitial,
        coefficients: changedCoefficient,
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
          categorieSocioPro: CSP.Ouvriers,
          tauxAugmentationFemmes: 2.4,
          tauxAugmentationHommes: 3,
        },
        {
          categorieSocioPro: CSP.Employes,
          tauxAugmentationFemmes: 1.7,
          tauxAugmentationHommes: 2,
        },
        {
          categorieSocioPro: CSP.Techniciens,
          tauxAugmentationFemmes: 9.4,
          tauxAugmentationHommes: 5.2,
        },
        {
          categorieSocioPro: CSP.Cadres,
          tauxAugmentationFemmes: 10.05,
          tauxAugmentationHommes: 10.06,
        },
      ],
    },
  }

  test("nothing undefined state", () => {
    expect(appReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { indicateurDeux, ...rest } = appReducer(stateDefault, action) as AppState
    const { indicateurDeux: indicateurDeuxInitial, ...restInitial } = stateDefault as AppState

    expect(indicateurDeux).toStrictEqual({
      ...indicateurDeuxInitial,
      presenceAugmentation: action.data.presenceAugmentation,
      tauxAugmentation: action.data.tauxAugmentation,
    })
    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { indicateurDeux, ...rest } = appReducer(stateComplete, action) as AppState
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
          categorieSocioPro: CSP.Ouvriers,
          tauxPromotionFemmes: 1,
          tauxPromotionHommes: 2,
        },
        {
          categorieSocioPro: CSP.Employes,
          tauxPromotionFemmes: 0,
          tauxPromotionHommes: 0,
        },
        {
          categorieSocioPro: CSP.Techniciens,
          tauxPromotionFemmes: 1,
          tauxPromotionHommes: 1.5,
        },
        {
          categorieSocioPro: CSP.Cadres,
          tauxPromotionFemmes: 2,
          tauxPromotionHommes: 2.57,
        },
      ],
    },
  }

  test("nothing undefined state", () => {
    expect(appReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { indicateurTrois, ...rest } = appReducer(stateDefault, action) as AppState
    const { indicateurTrois: indicateurTroisInitial, ...restInitial } = stateDefault as AppState

    expect(indicateurTrois).toStrictEqual({
      ...indicateurTroisInitial,
      presencePromotion: action.data.presencePromotion,
      tauxPromotion: action.data.tauxPromotion,
    })
    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { indicateurTrois, ...rest } = appReducer(stateComplete, action) as AppState
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
    expect(appReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { indicateurDeuxTrois, ...rest } = appReducer(stateDefault, action) as AppState
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
    const { indicateurDeuxTrois, ...rest } = appReducer(stateComplete, action) as AppState
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
    expect(appReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { indicateurQuatre, ...rest } = appReducer(stateDefault, action) as AppState
    const { indicateurQuatre: indicateurQuatreInitial, ...restInitial } = stateDefault as AppState

    expect(indicateurQuatre).toStrictEqual({
      ...indicateurQuatreInitial,
      ...action.data,
    })
    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { indicateurQuatre, ...rest } = appReducer(stateComplete, action) as AppState
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
    expect(appReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { indicateurCinq, ...rest } = appReducer(stateDefault, action) as AppState
    const { indicateurCinq: indicateurCinqInitial, ...restInitial } = stateDefault as AppState

    expect(indicateurCinq).toStrictEqual({
      ...indicateurCinqInitial,
      ...action.data,
    })
    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { indicateurCinq, ...rest } = appReducer(stateComplete, action) as AppState
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
    expect(appReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { informationsEntreprise, ...rest } = appReducer(stateDefault, action) as AppState
    const { informationsEntreprise: informationsEntrepriseInitial, ...restInitial } = stateDefault as AppState

    expect(informationsEntreprise).toStrictEqual({
      ...informationsEntrepriseInitial,
      ...action.data,
    })
    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { informationsEntreprise, ...rest } = appReducer(stateComplete, action) as AppState
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
    expect(appReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { informationsDeclarant, ...rest } = appReducer(stateDefault, action) as AppState
    const { informationsDeclarant: informationsDeclarantInitial, ...restInitial } = stateDefault as AppState

    expect(informationsDeclarant).toStrictEqual({
      ...informationsDeclarantInitial,
      ...action.data,
    })
    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { informationsDeclarant, ...rest } = appReducer(stateComplete, action) as AppState
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
    expect(appReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { declaration, ...rest } = appReducer(stateDefault, action) as AppState
    const { declaration: declarationInitial, ...restInitial } = stateDefault as AppState

    expect(declaration).toStrictEqual({
      ...declarationInitial,
      ...action.data,
    })
    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { declaration, ...rest } = appReducer(stateComplete, action) as AppState
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
    expect(appReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { informations, declaration, ...rest } = appReducer(stateDefault, action) as AppState
    const {
      informations: informationsInitial,
      declaration: declarationInitial,
      ...restInitial
    } = stateDefault as AppState

    expect(informations).toStrictEqual({
      ...informationsInitial,
      formValidated: "Valid",
    })
    expect(declaration).toStrictEqual(declarationInitial)

    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { informations, declaration, ...rest } = appReducer(stateComplete, action) as AppState
    const {
      informations: informationsInitial,
      declaration: declarationInitial,
      ...restInitial
    } = stateComplete as AppState

    expect(informations).toStrictEqual({
      ...informationsInitial,
      formValidated: "Valid",
    })
    expect(declaration).toStrictEqual(declarationInitial)

    expect(rest).toStrictEqual(restInitial)
  })
})

describe("validateEffectif", () => {
  describe("Valid", () => {
    const action: ActionType = {
      type: "setValidEffectif",
    }

    test("nothing undefined state", () => {
      expect(appReducer(stateUndefined, action)).toStrictEqual(undefined)
    })

    test("change default state", () => {
      const newState = appReducer(stateDefault, action) as AppState

      const expectedState = produce(stateDefault as AppState, (draft) => {
        draft.effectif.formValidated = "Valid"
        draft.indicateurUn.formValidated = "Valid"
        draft.indicateurUn.modaliteCalculformValidated = "Valid"
        draft.indicateurUn.coefficientEffectifFormValidated = "None"
        draft.indicateurDeux.formValidated = "Valid"
        draft.indicateurTrois.formValidated = "Valid"
        draft.indicateurDeuxTrois.formValidated = "Valid"
      })

      expect(newState).toStrictEqual(expectedState)
    })

    test("change complete state", () => {
      const { effectif, ...rest } = appReducer(stateComplete, action) as AppState
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
      type: "unsetEffectif",
    }

    test("invalid complete validate state", () => {
      const { effectif, ...rest } = appReducer(stateCompleteAndValidate, action) as AppState

      const { effectif: effectifInitial, ...restInitial } = stateCompleteAndValidate as AppState

      expect(effectif).toStrictEqual({
        ...effectifInitial,
        formValidated: "None",
      })
      expect(rest).toStrictEqual(restInitial)
    })
  })

  describe("None with csp false", () => {
    const actionUpdateIndicateurUnType: ActionType = {
      type: "updateIndicateurUnModaliteCalcul",
      data: { modaliteCalcul: undefined },
    }

    const stateCompleteAndValidateCoef = appReducer(stateCompleteAndValidate, actionUpdateIndicateurUnType)

    test("stateCompleteAndValidateCoef", () => {
      const { indicateurUn, ...rest } = stateCompleteAndValidateCoef as AppState
      const { indicateurUn: indicateurUnInitial, ...restInitial } = stateCompleteAndValidateCoef as AppState

      expect(indicateurUn).toStrictEqual({
        ...indicateurUnInitial,
        modaliteCalcul: undefined,
      })

      expect(rest).toStrictEqual(restInitial)
    })

    const action: ActionType = {
      type: "unsetEffectif",
    }

    test("invalid complete validate state", () => {
      const newState = appReducer(stateCompleteAndValidateCoef, action) as AppState

      const expectedState = produce(stateCompleteAndValidateCoef as AppState, (draft) => {
        draft.effectif.formValidated = "None"
      })

      expect(newState).toStrictEqual(expectedState)
    })
  })
})

describe("validateIndicateurUnCoefGroup", () => {
  describe("Valid", () => {
    const action: ActionType = {
      type: "setValidIndicateurUnCoefGroup",
    }

    test("nothing undefined state", () => {
      expect(appReducer(stateUndefined, action)).toStrictEqual(undefined)
    })

    test("change default state", () => {
      const { indicateurUn, declaration, ...rest } = appReducer(stateDefault, action) as AppState
      const {
        indicateurUn: indicateurUnInitial,
        declaration: declarationInitial,
        ...restInitial
      } = stateDefault as AppState

      expect(indicateurUn).toStrictEqual({
        ...indicateurUnInitial,
        coefficientGroupFormValidated: "Valid",
      })

      expect(declaration).toStrictEqual(declarationInitial)

      expect(rest).toStrictEqual(restInitial)
    })

    test("change complete state", () => {
      const { indicateurUn, declaration, ...rest } = appReducer(stateComplete, action) as AppState
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

      expect(declaration).toStrictEqual(declarationInitial)

      expect(rest).toStrictEqual(restInitial)
    })
  })

  describe("None", () => {
    const action: ActionType = {
      type: "unsetIndicateurUnCoefGroup",
    }

    test("invalid complete validate state", () => {
      const { indicateurUn, declaration, ...rest } = appReducer(stateCompleteAndValidate, action) as AppState
      const {
        indicateurUn: indicateurUnInitial,
        declaration: declarationInitial,
        ...restInitial
      } = stateCompleteAndValidate as AppState

      expect(indicateurUn).toStrictEqual({
        ...indicateurUnInitial,
        coefficientGroupFormValidated: "None",
        formValidated: "None",
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
      type: "setValidIndicateurUnCoefEffectif",
    }

    test("nothing undefined state", () => {
      expect(appReducer(stateUndefined, action)).toStrictEqual(undefined)
    })

    test("change default state", () => {
      const { indicateurUn, declaration, ...rest } = appReducer(stateDefault, action) as AppState
      const {
        indicateurUn: indicateurUnInitial,
        declaration: declarationInitial,
        ...restInitial
      } = stateDefault as AppState

      const patchedIndicateurUnInitial = produce(indicateurUnInitial, (draft) => {
        draft.coefficientEffectifFormValidated = "Valid"
        draft.coefficientRemuFormValidated = "Valid"
        draft.formValidated = "Valid"
      })

      expect(indicateurUn).toStrictEqual(patchedIndicateurUnInitial)

      expect(declaration).toStrictEqual(declarationInitial)

      expect(rest).toStrictEqual(restInitial)
    })

    test("change complete state", () => {
      const { indicateurUn, declaration, ...rest } = appReducer(stateComplete, action) as AppState
      const {
        indicateurUn: indicateurUnInitial,
        declaration: declarationInitial,
        ...restInitial
      } = stateComplete as AppState

      const patchedIndicateurUnInitial = produce(indicateurUnInitial, (draft) => {
        draft.coefficientEffectifFormValidated = "Valid"

        draft.coefficients.forEach((categorie) => {
          categorie.tranchesAges.forEach((trancheAge) => {
            if (!calculerValiditeGroupe3(trancheAge.nombreSalariesFemmes || 0, trancheAge.nombreSalariesHommes || 0)) {
              trancheAge.remunerationAnnuelleBrutFemmes = 0
              trancheAge.remunerationAnnuelleBrutHommes = 0
            }
          })
        })
      })

      expect(indicateurUn).toStrictEqual(patchedIndicateurUnInitial)

      expect(declaration).toStrictEqual(declarationInitial)

      expect(rest).toStrictEqual(restInitial)
    })
  })

  describe("None", () => {
    const action: ActionType = {
      type: "unsetIndicateurUnCoefEffectif",
    }

    test("invalid complete validate state", () => {
      const { indicateurUn, declaration, ...rest } = appReducer(stateCompleteAndValidate, action) as AppState
      const {
        indicateurUn: indicateurUnInitial,
        declaration: declarationInitial,
        ...restInitial
      } = stateCompleteAndValidate as AppState

      expect(indicateurUn).toStrictEqual({
        ...indicateurUnInitial,
        coefficientEffectifFormValidated: "None",
        formValidated: "None",
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
    // type: "validateIndicateurUn",
    type: "setValidIndicateurUnCSP",
  }

  test("nothing undefined state", () => {
    expect(appReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { indicateurUn, declaration, ...rest } = appReducer(stateDefault, action) as AppState
    const {
      indicateurUn: indicateurUnInitial,
      declaration: declarationInitial,
      ...restInitial
    } = stateDefault as AppState

    expect(indicateurUn).toStrictEqual({
      ...indicateurUnInitial,
      formValidated: "Valid",
    })

    expect(declaration).toStrictEqual(declarationInitial)

    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { indicateurUn, declaration, ...rest } = appReducer(stateComplete, action) as AppState
    const {
      indicateurUn: indicateurUnInitial,
      declaration: declarationInitial,
      ...restInitial
    } = stateComplete as AppState

    expect(indicateurUn).toStrictEqual({
      ...indicateurUnInitial,
      formValidated: "Valid",
    })

    expect(declaration).toStrictEqual(declarationInitial)

    expect(rest).toStrictEqual(restInitial)
  })
})

describe("validateIndicateurDeux", () => {
  const action: ActionType = {
    type: "validateIndicateurDeux",
    valid: "Valid",
  }

  test("nothing undefined state", () => {
    expect(appReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { indicateurDeux, declaration, ...rest } = appReducer(stateDefault, action) as AppState
    const {
      indicateurDeux: indicateurDeuxInitial,
      declaration: declarationInitial,
      ...restInitial
    } = stateDefault as AppState

    expect(indicateurDeux).toStrictEqual({
      ...indicateurDeuxInitial,
      formValidated: "Valid",
    })

    expect(declaration).toStrictEqual(declarationInitial)

    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { indicateurDeux, declaration, ...rest } = appReducer(stateComplete, action) as AppState
    const {
      indicateurDeux: indicateurDeuxInitial,
      declaration: declarationInitial,
      ...restInitial
    } = stateComplete as AppState

    expect(indicateurDeux).toStrictEqual({
      ...indicateurDeuxInitial,
      formValidated: "Valid",
    })

    expect(declaration).toStrictEqual(declarationInitial)

    expect(rest).toStrictEqual(restInitial)
  })
})

describe("validateIndicateurTrois", () => {
  const action: ActionType = {
    type: "validateIndicateurTrois",
    valid: "Valid",
  }

  test("nothing undefined state", () => {
    expect(appReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { indicateurTrois, declaration, ...rest } = appReducer(stateDefault, action) as AppState
    const {
      indicateurTrois: indicateurTroisInitial,
      declaration: declarationInitial,
      ...restInitial
    } = stateDefault as AppState

    expect(indicateurTrois).toStrictEqual({
      ...indicateurTroisInitial,
      formValidated: "Valid",
    })

    expect(declaration).toStrictEqual(declarationInitial)

    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { indicateurTrois, declaration, ...rest } = appReducer(stateComplete, action) as AppState
    const {
      indicateurTrois: indicateurTroisInitial,
      declaration: declarationInitial,
      ...restInitial
    } = stateComplete as AppState

    expect(indicateurTrois).toStrictEqual({
      ...indicateurTroisInitial,
      formValidated: "Valid",
    })

    expect(declaration).toStrictEqual(declarationInitial)

    expect(rest).toStrictEqual(restInitial)
  })
})

describe("validateIndicateurDeuxTrois", () => {
  const action: ActionType = {
    type: "validateIndicateurDeuxTrois",
    valid: "Valid",
  }

  test("nothing undefined state", () => {
    expect(appReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { indicateurDeuxTrois, declaration, ...rest } = appReducer(stateDefault, action) as AppState
    const {
      indicateurDeuxTrois: indicateurDeuxTroisInitial,
      declaration: declarationInitial,
      ...restInitial
    } = stateDefault as AppState

    expect(indicateurDeuxTrois).toStrictEqual({
      ...indicateurDeuxTroisInitial,
      formValidated: "Valid",
    })

    expect(declaration).toStrictEqual(declarationInitial)

    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { indicateurDeuxTrois, declaration, ...rest } = appReducer(stateComplete, action) as AppState
    const {
      indicateurDeuxTrois: indicateurDeuxTroisInitial,
      declaration: declarationInitial,
      ...restInitial
    } = stateComplete as AppState

    expect(indicateurDeuxTrois).toStrictEqual({
      ...indicateurDeuxTroisInitial,
      formValidated: "Valid",
    })

    expect(declaration).toStrictEqual(declarationInitial)

    expect(rest).toStrictEqual(restInitial)
  })
})

describe("validateIndicateurQuatre", () => {
  const action: ActionType = {
    type: "validateIndicateurQuatre",
    valid: "Valid",
  }

  test("nothing undefined state", () => {
    expect(appReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { indicateurQuatre, declaration, ...rest } = appReducer(stateDefault, action) as AppState
    const {
      indicateurQuatre: indicateurQuatreInitial,
      declaration: declarationInitial,
      ...restInitial
    } = stateDefault as AppState

    expect(indicateurQuatre).toStrictEqual({
      ...indicateurQuatreInitial,
      formValidated: "Valid",
    })

    expect(declaration).toStrictEqual(declarationInitial)

    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { indicateurQuatre, declaration, ...rest } = appReducer(stateComplete, action) as AppState
    const {
      indicateurQuatre: indicateurQuatreInitial,
      declaration: declarationInitial,
      ...restInitial
    } = stateComplete as AppState

    expect(indicateurQuatre).toStrictEqual({
      ...indicateurQuatreInitial,
      formValidated: "Valid",
    })

    expect(declaration).toStrictEqual(declarationInitial)

    expect(rest).toStrictEqual(restInitial)
  })
})

describe("validateIndicateurCinq", () => {
  const action: ActionType = {
    type: "validateIndicateurCinq",
    valid: "Valid",
  }

  test("nothing undefined state", () => {
    expect(appReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { indicateurCinq, declaration, ...rest } = appReducer(stateDefault, action) as AppState
    const {
      indicateurCinq: indicateurCinqInitial,
      declaration: declarationInitial,
      ...restInitial
    } = stateDefault as AppState

    expect(indicateurCinq).toStrictEqual({
      ...indicateurCinqInitial,
      formValidated: "Valid",
    })

    expect(declaration).toStrictEqual(declarationInitial)

    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { indicateurCinq, declaration, ...rest } = appReducer(stateComplete, action) as AppState
    const {
      indicateurCinq: indicateurCinqInitial,
      declaration: declarationInitial,
      ...restInitial
    } = stateComplete as AppState

    expect(indicateurCinq).toStrictEqual({
      ...indicateurCinqInitial,
      formValidated: "Valid",
    })

    expect(declaration).toStrictEqual(declarationInitial)

    expect(rest).toStrictEqual(restInitial)
  })
})

describe("validateInformationsEntreprise", () => {
  const action: ActionType = {
    type: "validateInformationsEntreprise",
    valid: "Valid",
  }

  test("nothing undefined state", () => {
    expect(appReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { informationsEntreprise, declaration, ...rest } = appReducer(stateDefault, action) as AppState
    const {
      informationsEntreprise: informationsEntrepriseInitial,
      declaration: declarationInitial,
      ...restInitial
    } = stateDefault as AppState

    expect(informationsEntreprise).toStrictEqual({
      ...informationsEntrepriseInitial,
      formValidated: "Valid",
    })

    expect(declaration).toStrictEqual(declarationInitial)

    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { informationsEntreprise, declaration, ...rest } = appReducer(stateComplete, action) as AppState
    const {
      informationsEntreprise: informationsEntrepriseInitial,
      declaration: declarationInitial,
      ...restInitial
    } = stateComplete as AppState

    expect(informationsEntreprise).toStrictEqual({
      ...informationsEntrepriseInitial,
      formValidated: "Valid",
    })

    expect(declaration).toStrictEqual(declarationInitial)

    expect(rest).toStrictEqual(restInitial)
  })
})

describe("validateInformationsDeclarant", () => {
  const action: ActionType = {
    type: "validateInformationsDeclarant",
    valid: "Valid",
  }

  test("nothing undefined state", () => {
    expect(appReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    const { informationsDeclarant, declaration, ...rest } = appReducer(stateDefault, action) as AppState
    const {
      informationsDeclarant: informationsDeclarantInitial,
      declaration: declarationInitial,
      ...restInitial
    } = stateDefault as AppState

    expect(informationsDeclarant).toStrictEqual({
      ...informationsDeclarantInitial,
      formValidated: "Valid",
    })

    expect(declaration).toStrictEqual(declarationInitial)

    expect(rest).toStrictEqual(restInitial)
  })

  test("change complete state", () => {
    const { informationsDeclarant, declaration, ...rest } = appReducer(stateComplete, action) as AppState
    const {
      informationsDeclarant: informationsDeclarantInitial,
      declaration: declarationInitial,
      ...restInitial
    } = stateComplete as AppState

    expect(informationsDeclarant).toStrictEqual({
      ...informationsDeclarantInitial,
      formValidated: "Valid",
    })

    expect(declaration).toStrictEqual(declarationInitial)

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
      coefficients: [],
      motifNonCalculable: "",
      nombreCoefficients: 6,
      noteFinale: 31,
      resultatFinal: 8.0,
      sexeSurRepresente: "femmes",
    },
    // @ts-ignore: see comment above
    indicateurDeuxData: {
      motifNonCalculable: "",
      resultatFinal: 5.0,
      sexeSurRepresente: "femmes",
      noteFinale: 10,
      mesuresCorrection: false,
    },
    // @ts-ignore: see comment above
    indicateurTroisData: {
      motifNonCalculable: "",
      resultatFinal: 3.0,
      sexeSurRepresente: "femmes",
      noteFinale: 15,
      mesuresCorrection: false,
    },
    // @ts-ignore: see comment above
    indicateurDeuxTroisData: {
      motifNonCalculable: "",
      resultatFinalEcart: 25,
      resultatFinalNombreSalaries: 5,
      sexeSurRepresente: "femmes",
      noteFinale: 25,
      mesuresCorrection: false,
    },
    // @ts-ignore: see comment above
    indicateurQuatreData: {
      motifNonCalculable: "",
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
    expect(appReducer(stateUndefined, action)).toStrictEqual(undefined)
  })

  test("change default state", () => {
    expect(appReducer(stateDefault, action)).toMatchSnapshot()
  })

  test("change complete state", () => {
    expect(appReducer(stateComplete, action)).toMatchSnapshot()
  })
})
