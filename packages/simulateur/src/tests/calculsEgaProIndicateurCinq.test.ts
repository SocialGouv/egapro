import {
  calculerSexeSousRepresente,
  calculerNbSalariesSexeSousRepresente,
  calculerNote,
} from "../utils/calculsEgaProIndicateurCinq"

describe("calculIndicateurSexeSousRepresente", () => {
  test("men and women shoulnt be undefined", () => {
    expect(calculerSexeSousRepresente(undefined, undefined)).toEqual(undefined)
    expect(calculerSexeSousRepresente(1, undefined)).toEqual(undefined)
    expect(calculerSexeSousRepresente(undefined, 1)).toEqual(undefined)
  })

  test("test some incoherent data", () => {
    expect(calculerSexeSousRepresente(-2, -2)).toEqual("egalite")
    expect(calculerSexeSousRepresente(1, 1)).toEqual("egalite")
    expect(calculerSexeSousRepresente(10, 10)).toEqual("egalite")
  })

  test("test some valid data", () => {
    expect(calculerSexeSousRepresente(5, 5)).toEqual("egalite")
    expect(calculerSexeSousRepresente(0, 10)).toEqual("hommes")
    expect(calculerSexeSousRepresente(10, 0)).toEqual("femmes")
    expect(calculerSexeSousRepresente(4, 6)).toEqual("hommes")
    expect(calculerSexeSousRepresente(6, 4)).toEqual("femmes")
    expect(calculerSexeSousRepresente(1, 9)).toEqual("hommes")
    expect(calculerSexeSousRepresente(9, 1)).toEqual("femmes")
  })
})

describe("calculIndicateurNombreSalariesSexeSousRepresente", () => {
  test("men and women shoulnt be undefined", () => {
    expect(calculerNbSalariesSexeSousRepresente(undefined, undefined)).toEqual(undefined)
    expect(calculerNbSalariesSexeSousRepresente(1, undefined)).toEqual(undefined)
    expect(calculerNbSalariesSexeSousRepresente(undefined, 1)).toEqual(undefined)
  })

  test("test some incoherent data", () => {
    expect(calculerNbSalariesSexeSousRepresente(-2, -2)).toEqual(-2)
    expect(calculerNbSalariesSexeSousRepresente(1, 1)).toEqual(1)
    expect(calculerNbSalariesSexeSousRepresente(10, 10)).toEqual(10)
  })

  test("test some valid data", () => {
    expect(calculerNbSalariesSexeSousRepresente(5, 5)).toEqual(5)
    expect(calculerNbSalariesSexeSousRepresente(0, 10)).toEqual(0)
    expect(calculerNbSalariesSexeSousRepresente(10, 0)).toEqual(0)
    expect(calculerNbSalariesSexeSousRepresente(4, 6)).toEqual(4)
    expect(calculerNbSalariesSexeSousRepresente(6, 4)).toEqual(4)
    expect(calculerNbSalariesSexeSousRepresente(1, 9)).toEqual(1)
    expect(calculerNbSalariesSexeSousRepresente(9, 1)).toEqual(1)
  })
})

describe("calculNote", () => {
  test("indicateurNombreSalariesSexeSousRepresente shouldnt be undefined", () => {
    expect(calculerNote(undefined)).toEqual(undefined)
  })

  test("test some incoherent data", () => {
    expect(calculerNote(-1)).toEqual(0)
    expect(calculerNote(6)).toEqual(10)
  })

  test("test some valid data", () => {
    expect(calculerNote(0)).toEqual(0)
    expect(calculerNote(1)).toEqual(0)
    expect(calculerNote(2)).toEqual(5)
    expect(calculerNote(3)).toEqual(5)
    expect(calculerNote(4)).toEqual(10)
    expect(calculerNote(5)).toEqual(10)
  })
})
