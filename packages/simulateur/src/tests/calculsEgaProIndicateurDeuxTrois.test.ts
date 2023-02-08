import stateComplete from "../__fixtures__/stateComplete"
import { calculerBareme, calculerNote } from "../utils/calculsEgaProIndicateurDeuxTrois"
import calculerIndicateurDeuxTrois from "../utils/calculsEgaProIndicateurDeuxTrois"
import { AppState, PeriodeDeclaration } from "../globals"

///////////////////////
// INDICATEUR 2 et 3 //
///////////////////////

describe("calculBarem", () => {
  test("test barem", () => {
    expect(calculerBareme(0)).toEqual(35)
    expect(calculerBareme(2)).toEqual(35)
    expect(calculerBareme(2.1)).toEqual(25)
    expect(calculerBareme(5)).toEqual(25)
    expect(calculerBareme(5.1)).toEqual(15)
    expect(calculerBareme(10)).toEqual(15)
    expect(calculerBareme(10.1)).toEqual(0)
    expect(calculerBareme(100)).toEqual(0)
  })
})

describe("calculNote", () => {
  test("can't calcul note", () => {
    expect(calculerNote(undefined, undefined, undefined, undefined, undefined)).toEqual({
      node: undefined,
      correctionMeasure: false,
    })
    expect(calculerNote(1, undefined, undefined, undefined, undefined)).toEqual({
      note: undefined,
      correctionMeasure: false,
      noteEcartTaux: 35,
      noteEcartNombreSalaries: undefined,
    })
    expect(calculerNote(undefined, 1, undefined, undefined, undefined)).toEqual({
      note: undefined,
      correctionMeasure: false,
      noteEcartTaux: undefined,
      noteEcartNombreSalaries: 35,
    })
  })

  test("test max of both notes", () => {
    expect(calculerNote(15, 0, undefined, undefined, undefined)).toEqual({
      note: 35,
      correctionMeasure: false,
      noteEcartTaux: 0,
      noteEcartNombreSalaries: 35,
    })
    expect(calculerNote(0, 15, undefined, undefined, undefined)).toEqual({
      note: 35,
      correctionMeasure: false,
      noteEcartTaux: 35,
      noteEcartNombreSalaries: 0,
    })
  })

  describe("correction measure from indicateur 1", () => {
    test("note indicator 1 is 40 so no correction measure", () => {
      expect(calculerNote(2.1, 2.1, 40, "femmes", "hommes")).toEqual({
        note: 25,
        correctionMeasure: false,
        noteEcartTaux: 25,
        noteEcartNombreSalaries: 25,
      })
    })

    test("overrepresented sex is same on indicator 1 & 2et3 so no correction measure", () => {
      expect(calculerNote(8.1, 8.1, 36, "hommes", "hommes")).toEqual({
        note: 15,
        correctionMeasure: false,
        noteEcartTaux: 15,
        noteEcartNombreSalaries: 15,
      })
    })

    test("correction measure for men", () => {
      expect(calculerNote(2.1, 2.1, 39, "femmes", "hommes")).toEqual({
        note: 35,
        correctionMeasure: true,
        noteEcartTaux: 25,
        noteEcartNombreSalaries: 25,
      })
    })

    test("correction measure for women", () => {
      expect(calculerNote(8.1, 8.1, 36, "hommes", "femmes")).toEqual({
        note: 35,
        correctionMeasure: true,
        noteEcartTaux: 15,
        noteEcartNombreSalaries: 15,
      })
    })

    test("note indicator 1 is 0", () => {
      expect(calculerNote(8.1, 8.1, 0, "hommes", "femmes")).toEqual({
        note: 35,
        correctionMeasure: true,
        noteEcartTaux: 15,
        noteEcartNombreSalaries: 15,
      })
    })
  })
})

describe("test calculIndicateurDeuxTrois", () => {
  const state = {
    ...stateComplete,
    effectif: {
      formValidated: "Valid",
      nombreSalaries: [
        {
          categorieSocioPro: 0,
          tranchesAges: [
            {
              nombreSalariesFemmes: 0,
              nombreSalariesHommes: 2,
              trancheAge: 0,
            },
            {
              nombreSalariesFemmes: 0,
              nombreSalariesHommes: 1,
              trancheAge: 1,
            },
            {
              nombreSalariesFemmes: 0,
              nombreSalariesHommes: 0,
              trancheAge: 2,
            },
            {
              nombreSalariesFemmes: 0,
              nombreSalariesHommes: 1,
              trancheAge: 3,
            },
          ],
        },
        {
          categorieSocioPro: 1,
          tranchesAges: [
            {
              nombreSalariesFemmes: 9,
              nombreSalariesHommes: 4,
              trancheAge: 0,
            },
            {
              nombreSalariesFemmes: 8,
              nombreSalariesHommes: 3,
              trancheAge: 1,
            },
            {
              nombreSalariesFemmes: 4,
              nombreSalariesHommes: 3,
              trancheAge: 2,
            },
            {
              nombreSalariesFemmes: 2,
              nombreSalariesHommes: 1,
              trancheAge: 3,
            },
          ],
        },
        {
          categorieSocioPro: 2,
          tranchesAges: [
            {
              nombreSalariesFemmes: 2,
              nombreSalariesHommes: 1,
              trancheAge: 0,
            },
            {
              nombreSalariesFemmes: 2,
              nombreSalariesHommes: 2,
              trancheAge: 1,
            },
            {
              nombreSalariesFemmes: 3,
              nombreSalariesHommes: 6,
              trancheAge: 2,
            },
            {
              nombreSalariesFemmes: 0,
              nombreSalariesHommes: 2,
              trancheAge: 3,
            },
          ],
        },
        {
          categorieSocioPro: 3,
          tranchesAges: [
            {
              nombreSalariesFemmes: 0,
              nombreSalariesHommes: 1,
              trancheAge: 0,
            },
            {
              nombreSalariesFemmes: 0,
              nombreSalariesHommes: 1,
              trancheAge: 1,
            },
            {
              nombreSalariesFemmes: 0,
              nombreSalariesHommes: 0,
              trancheAge: 2,
            },
            {
              nombreSalariesFemmes: 0,
              nombreSalariesHommes: 0,
              trancheAge: 3,
            },
          ],
        },
      ],
    },
    indicateurDeuxTrois: {
      formValidated: "Valid",
      periodeDeclaration: "unePeriodeReference" as PeriodeDeclaration,
      nombreAugmentationPromotionFemmes: 2,
      nombreAugmentationPromotionHommes: 5,
      presenceAugmentationPromotion: true,
    },
  } as AppState
  test("test data", () => {
    expect(calculerIndicateurDeuxTrois(state)).toMatchSnapshot()
  })
})
