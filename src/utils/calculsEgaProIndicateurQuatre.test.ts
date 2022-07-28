import {
  calculIndicateurCalculable,
  calculIndicateurEcartNombreSalarieesAugmentees,
  calculNote,
} from "./calculsEgaProIndicateurQuatre"

//////////////////
// INDICATEUR 4 //
//////////////////

describe("calculIndicateurCalculable", () => {
  test("presenceCongeMat must be true", () => {
    expect(calculIndicateurCalculable(false, undefined)).toEqual(false)
    expect(calculIndicateurCalculable(false, 10)).toEqual(false)
  })

  test("nombreSalarieesPeriodeAugmentation sould be above 0", () => {
    expect(calculIndicateurCalculable(true, undefined)).toEqual(false)
    expect(calculIndicateurCalculable(true, -1)).toEqual(false)
    expect(calculIndicateurCalculable(true, 0)).toEqual(false)
  })

  test("test some data", () => {
    expect(calculIndicateurCalculable(true, 1)).toEqual(true)
    expect(calculIndicateurCalculable(true, 10)).toEqual(true)
  })
})

describe("calculIndicateurEcartNombreSalarieesAugmentees", () => {
  test("indicateurCalculable must be true", () => {
    expect(calculIndicateurEcartNombreSalarieesAugmentees(false, undefined, undefined)).toEqual(undefined)
    expect(calculIndicateurEcartNombreSalarieesAugmentees(false, 12, undefined)).toEqual(undefined)
    expect(calculIndicateurEcartNombreSalarieesAugmentees(false, undefined, 6)).toEqual(undefined)
    expect(calculIndicateurEcartNombreSalarieesAugmentees(false, 12, 6)).toEqual(undefined)
  })

  test("nombreSalarieesPeriodeAugmentation and nombreSalarieesAugmentees cant be undefined", () => {
    expect(calculIndicateurEcartNombreSalarieesAugmentees(true, undefined, 6)).toEqual(undefined)
    expect(calculIndicateurEcartNombreSalarieesAugmentees(true, 6, undefined)).toEqual(undefined)
    expect(calculIndicateurEcartNombreSalarieesAugmentees(true, undefined, undefined)).toEqual(undefined)
  })

  test("nombreSalarieesPeriodeAugmentationcant be under nombreSalarieesAugmentees", () => {
    expect(calculIndicateurEcartNombreSalarieesAugmentees(true, 10, 11)).toEqual(undefined)
    expect(calculIndicateurEcartNombreSalarieesAugmentees(true, 2, 4)).toEqual(undefined)
  })

  test("test some valid data", () => {
    expect(calculIndicateurEcartNombreSalarieesAugmentees(true, 12, 6)).toEqual(50)
    expect(calculIndicateurEcartNombreSalarieesAugmentees(true, 20, 15)).toEqual(75)
    expect(calculIndicateurEcartNombreSalarieesAugmentees(true, 5, 5)).toEqual(100)
    expect(calculIndicateurEcartNombreSalarieesAugmentees(true, 5, 0)).toEqual(0)
  })
})

describe("calculNote", () => {
  test("indicateurEcartNombreSalarieesAugmentees cant be undefined", () => {
    expect(calculNote(undefined)).toEqual(undefined)
  })

  test("test some valid data", () => {
    expect(calculNote(0)).toEqual(0)
    expect(calculNote(10)).toEqual(0)
    expect(calculNote(23)).toEqual(0)
    expect(calculNote(99)).toEqual(0)
    expect(calculNote(100)).toEqual(15)
  })
})
