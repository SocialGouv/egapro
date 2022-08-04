import {
  calculIndicateurSexeSousRepresente,
  calculIndicateurNombreSalariesSexeSousRepresente,
  calculNote,
} from "../utils/calculsEgaProIndicateurCinq"

describe("calculIndicateurSexeSousRepresente", () => {
  test("men and women shoulnt be undefined", () => {
    expect(calculIndicateurSexeSousRepresente(undefined, undefined)).toEqual(undefined)
    expect(calculIndicateurSexeSousRepresente(1, undefined)).toEqual(undefined)
    expect(calculIndicateurSexeSousRepresente(undefined, 1)).toEqual(undefined)
  })

  test("test some incoherent data", () => {
    expect(calculIndicateurSexeSousRepresente(-2, -2)).toEqual("egalite")
    expect(calculIndicateurSexeSousRepresente(1, 1)).toEqual("egalite")
    expect(calculIndicateurSexeSousRepresente(10, 10)).toEqual("egalite")
  })

  test("test some valid data", () => {
    expect(calculIndicateurSexeSousRepresente(5, 5)).toEqual("egalite")
    expect(calculIndicateurSexeSousRepresente(0, 10)).toEqual("hommes")
    expect(calculIndicateurSexeSousRepresente(10, 0)).toEqual("femmes")
    expect(calculIndicateurSexeSousRepresente(4, 6)).toEqual("hommes")
    expect(calculIndicateurSexeSousRepresente(6, 4)).toEqual("femmes")
    expect(calculIndicateurSexeSousRepresente(1, 9)).toEqual("hommes")
    expect(calculIndicateurSexeSousRepresente(9, 1)).toEqual("femmes")
  })
})

describe("calculIndicateurNombreSalariesSexeSousRepresente", () => {
  test("men and women shoulnt be undefined", () => {
    expect(calculIndicateurNombreSalariesSexeSousRepresente(undefined, undefined)).toEqual(undefined)
    expect(calculIndicateurNombreSalariesSexeSousRepresente(1, undefined)).toEqual(undefined)
    expect(calculIndicateurNombreSalariesSexeSousRepresente(undefined, 1)).toEqual(undefined)
  })

  test("test some incoherent data", () => {
    expect(calculIndicateurNombreSalariesSexeSousRepresente(-2, -2)).toEqual(-2)
    expect(calculIndicateurNombreSalariesSexeSousRepresente(1, 1)).toEqual(1)
    expect(calculIndicateurNombreSalariesSexeSousRepresente(10, 10)).toEqual(10)
  })

  test("test some valid data", () => {
    expect(calculIndicateurNombreSalariesSexeSousRepresente(5, 5)).toEqual(5)
    expect(calculIndicateurNombreSalariesSexeSousRepresente(0, 10)).toEqual(0)
    expect(calculIndicateurNombreSalariesSexeSousRepresente(10, 0)).toEqual(0)
    expect(calculIndicateurNombreSalariesSexeSousRepresente(4, 6)).toEqual(4)
    expect(calculIndicateurNombreSalariesSexeSousRepresente(6, 4)).toEqual(4)
    expect(calculIndicateurNombreSalariesSexeSousRepresente(1, 9)).toEqual(1)
    expect(calculIndicateurNombreSalariesSexeSousRepresente(9, 1)).toEqual(1)
  })
})

describe("calculNote", () => {
  test("indicateurNombreSalariesSexeSousRepresente shouldnt be undefined", () => {
    expect(calculNote(undefined)).toEqual(undefined)
  })

  test("test some incoherent data", () => {
    expect(calculNote(-1)).toEqual(0)
    expect(calculNote(6)).toEqual(10)
  })

  test("test some valid data", () => {
    expect(calculNote(0)).toEqual(0)
    expect(calculNote(1)).toEqual(0)
    expect(calculNote(2)).toEqual(5)
    expect(calculNote(3)).toEqual(5)
    expect(calculNote(4)).toEqual(10)
    expect(calculNote(5)).toEqual(10)
  })
})
