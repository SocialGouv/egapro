import {
  nombreEffectifsValides,
  calculEcartPondere,
  calculerTotalEcartPondere,
  effectifEstCalculable,
} from "../utils/calculsEgaPro"

//////////////////
// COMMON ////////
//////////////////

describe("calculEffectifsValides", () => {
  test("invalid groupe with incoherent data", () => {
    expect(nombreEffectifsValides(false, -1, -2)).toEqual(0)
    expect(nombreEffectifsValides(false, 4, -2)).toEqual(0)
  })

  test("invalid groupe", () => {
    expect(nombreEffectifsValides(false, 0, 0)).toEqual(0)
    expect(nombreEffectifsValides(false, 1, 1)).toEqual(0)
    expect(nombreEffectifsValides(false, 2, 1)).toEqual(0)
    expect(nombreEffectifsValides(false, 2, 3)).toEqual(0)
    expect(nombreEffectifsValides(false, 4, 2)).toEqual(0)
  })

  test("valid groupe", () => {
    expect(nombreEffectifsValides(true, 3, 3)).toEqual(6)
    expect(nombreEffectifsValides(true, 4, 3)).toEqual(7)
    expect(nombreEffectifsValides(true, 4, 21)).toEqual(25)
  })
})

describe("calculEcartPondere", () => {
  test("no effectifsValides", () => {
    expect(calculEcartPondere(0.318, 0, 300)).toEqual(0) // impossible case ?
    expect(calculEcartPondere(0.318, 0, 0)).toEqual(undefined)
  })

  test("ecartPourcentage undefined with no effectifsValides", () => {
    expect(calculEcartPondere(undefined, 0, 300)).toEqual(undefined)
    expect(calculEcartPondere(undefined, 0, 0)).toEqual(undefined)
  })

  test("ecartPourcentage undefined", () => {
    expect(calculEcartPondere(undefined, 10, 300)).toEqual(undefined)
    expect(calculEcartPondere(undefined, 20, 300)).toEqual(undefined)
    expect(calculEcartPondere(undefined, 23, 321)).toEqual(undefined)
  })

  test("correct data", () => {
    expect(calculEcartPondere(0.05, 10, 250)).toEqual(0.002)
    expect(calculEcartPondere(0.05, 20, 400)).toEqual(0.0025)
    expect(calculEcartPondere(0.12, 23, 321)).toEqual(0.008598)
  })
})

describe("calculTotalEcartPondere", () => {
  test("no total if empty or one entry is undefined", () => {
    expect(calculerTotalEcartPondere([])).toEqual(undefined)
    expect(calculerTotalEcartPondere([undefined])).toEqual(undefined)
    expect(calculerTotalEcartPondere([undefined, undefined])).toEqual(undefined)
    expect(calculerTotalEcartPondere([undefined, 0])).toEqual(undefined)
    expect(calculerTotalEcartPondere([0, undefined])).toEqual(undefined)
    expect(calculerTotalEcartPondere([1, undefined])).toEqual(undefined)
    expect(calculerTotalEcartPondere([1.5, undefined])).toEqual(undefined)
    expect(calculerTotalEcartPondere([undefined, 2.2, 1.1])).toEqual(undefined)
    expect(calculerTotalEcartPondere([0.3, undefined, 1.9])).toEqual(undefined)
  })

  test("correct data", () => {
    expect(calculerTotalEcartPondere([0, 0])).toEqual(0)
    expect(calculerTotalEcartPondere([0, 2.2])).toEqual(2.2)
    expect(calculerTotalEcartPondere([1.1, 2.2])).toEqual(3.3)
    expect(calculerTotalEcartPondere([1.1, 0, 2.2, 0])).toEqual(3.3)
  })
})

describe("calculEffectifsIndicateurCalculable", () => {
  test("less than 40%", () => {
    expect(effectifEstCalculable(100, 39)).toEqual(false)
    expect(effectifEstCalculable(500, 199)).toEqual(false)
    expect(effectifEstCalculable(600, 200)).toEqual(false)
  })

  test("more than 40%", () => {
    expect(effectifEstCalculable(100, 40)).toEqual(true)
    expect(effectifEstCalculable(1000, 400)).toEqual(true)
    expect(effectifEstCalculable(700, 350)).toEqual(true)
  })
})
