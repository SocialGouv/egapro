import { estCalculable, calculerEcartNbSalarieesAugmentees, calculerNote } from "../utils/calculsEgaProIndicateurQuatre"

//////////////////
// INDICATEUR 4 //
//////////////////

describe("calculIndicateurCalculable", () => {
  test("presenceCongeMat must be true", () => {
    expect(estCalculable(false, undefined)).toEqual(false)
    expect(estCalculable(false, 10)).toEqual(false)
  })

  test("nombreSalarieesPeriodeAugmentation sould be above 0", () => {
    expect(estCalculable(true, undefined)).toEqual(false)
    expect(estCalculable(true, -1)).toEqual(false)
    expect(estCalculable(true, 0)).toEqual(false)
  })

  test("test some data", () => {
    expect(estCalculable(true, 1)).toEqual(true)
    expect(estCalculable(true, 10)).toEqual(true)
  })
})

describe("calculIndicateurEcartNombreSalarieesAugmentees", () => {
  test("indicateurCalculable must be true", () => {
    expect(calculerEcartNbSalarieesAugmentees(false, undefined, undefined)).toEqual(undefined)
    expect(calculerEcartNbSalarieesAugmentees(false, 12, undefined)).toEqual(undefined)
    expect(calculerEcartNbSalarieesAugmentees(false, undefined, 6)).toEqual(undefined)
    expect(calculerEcartNbSalarieesAugmentees(false, 12, 6)).toEqual(undefined)
  })

  test("nombreSalarieesPeriodeAugmentation and nombreSalarieesAugmentees cant be undefined", () => {
    expect(calculerEcartNbSalarieesAugmentees(true, undefined, 6)).toEqual(undefined)
    expect(calculerEcartNbSalarieesAugmentees(true, 6, undefined)).toEqual(undefined)
    expect(calculerEcartNbSalarieesAugmentees(true, undefined, undefined)).toEqual(undefined)
  })

  test("nombreSalarieesPeriodeAugmentationcant be under nombreSalarieesAugmentees", () => {
    expect(calculerEcartNbSalarieesAugmentees(true, 10, 11)).toEqual(undefined)
    expect(calculerEcartNbSalarieesAugmentees(true, 2, 4)).toEqual(undefined)
  })

  test("test some valid data", () => {
    expect(calculerEcartNbSalarieesAugmentees(true, 12, 6)).toEqual(50)
    expect(calculerEcartNbSalarieesAugmentees(true, 20, 15)).toEqual(75)
    expect(calculerEcartNbSalarieesAugmentees(true, 5, 5)).toEqual(100)
    expect(calculerEcartNbSalarieesAugmentees(true, 5, 0)).toEqual(0)
  })
})

describe("calculNote", () => {
  test("indicateurEcartNombreSalarieesAugmentees cant be undefined", () => {
    expect(calculerNote(undefined)).toEqual(undefined)
  })

  test("test some valid data", () => {
    expect(calculerNote(0)).toEqual(0)
    expect(calculerNote(10)).toEqual(0)
    expect(calculerNote(23)).toEqual(0)
    expect(calculerNote(99)).toEqual(0)
    expect(calculerNote(100)).toEqual(15)
  })
})
