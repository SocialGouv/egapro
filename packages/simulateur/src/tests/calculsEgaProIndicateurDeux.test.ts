import {
  calculerValiditeGroupe,
  calculerEcartTauxAugmentation,
  estCalculable,
  ecartAugmentation,
  sexeSurRepresente,
  calculerNote,
} from "../utils/calculsEgaProIndicateurDeux"

//////////////////
// INDICATEUR 2 //
//////////////////

describe("calculValiditeGroupe", () => {
  test("incoherent data", () => {
    expect(calculerValiditeGroupe(-1, -2)).toEqual(false)
    expect(calculerValiditeGroupe(4, -2)).toEqual(false)
  })

  test("men or women are under 10", () => {
    expect(calculerValiditeGroupe(0, 0)).toEqual(false)
    expect(calculerValiditeGroupe(1, 1)).toEqual(false)
    expect(calculerValiditeGroupe(4, 6)).toEqual(false)
    expect(calculerValiditeGroupe(9, 10)).toEqual(false)
    expect(calculerValiditeGroupe(11, 8)).toEqual(false)
  })

  test("valid groupe", () => {
    expect(calculerValiditeGroupe(10, 10)).toEqual(true)
    expect(calculerValiditeGroupe(11, 10)).toEqual(true)
    expect(calculerValiditeGroupe(11, 21)).toEqual(true)
  })
})

describe("calculEcartTauxAugmentation", () => {
  test("tauxAugmentation must be positive number", () => {
    expect(calculerEcartTauxAugmentation(undefined, 3)).toEqual(undefined)
    expect(calculerEcartTauxAugmentation(1, undefined)).toEqual(undefined)
    expect(calculerEcartTauxAugmentation(-1, 2)).toEqual(undefined)
    expect(calculerEcartTauxAugmentation(4, -2)).toEqual(undefined)
  })

  test("test some data", () => {
    expect(calculerEcartTauxAugmentation(0, 0)).toEqual(0)
    expect(calculerEcartTauxAugmentation(0.12, 0.12)).toEqual(0)
    expect(calculerEcartTauxAugmentation(0.12, 0.19)).toEqual(0.07)
    expect(calculerEcartTauxAugmentation(0.2, 0.3)).toEqual(0.1)
    expect(calculerEcartTauxAugmentation(0.28, 0.215)).toEqual(-0.065)
    expect(calculerEcartTauxAugmentation(0.25, 0.5)).toEqual(0.25)
  })
})

describe("calculIndicateurCalculable", () => {
  test("presenceAugmentation must be true", () => {
    expect(estCalculable(false, 100, 40, 0, 0.23)).toEqual(false)
  })

  test("calculEffectifsIndicateurCalculable must be true", () => {
    expect(estCalculable(true, 100, 39, 0.12, 0.23)).toEqual(false)
    expect(estCalculable(true, 100, 39, 0, 0.23)).toEqual(false)
    expect(estCalculable(true, 500, 199, 0.12, 0.23)).toEqual(false)
    expect(estCalculable(true, 500, 199, 0.12, 0)).toEqual(false)
    expect(estCalculable(true, 600, 200, 0.12, 0.23)).toEqual(false)
  })

  test("totalTauxAugmentation men or women should be above 0", () => {
    expect(estCalculable(true, 600, 200, 0, 0)).toEqual(false)
    expect(estCalculable(true, 700, 350, 0, 0)).toEqual(false)
  })

  test("test some data", () => {
    expect(estCalculable(true, 100, 40, 0, 0.23)).toEqual(true)
    expect(estCalculable(true, 100, 40, 0.12, 0.23)).toEqual(true)
    expect(estCalculable(true, 500, 400, 0.12, 0)).toEqual(true)
    expect(estCalculable(true, 1000, 400, 0.12, 0.23)).toEqual(true)
    expect(estCalculable(true, 700, 350, 0.12, 0.23)).toEqual(true)
  })
})

describe("calculIndicateurEcartAugmentation", () => {
  test("indicateur isnt calculable", () => {
    expect(ecartAugmentation(false, undefined)).toEqual(undefined)
    expect(ecartAugmentation(false, 0.01)).toEqual(undefined)
    expect(ecartAugmentation(false, 0.022)).toEqual(undefined)
    expect(ecartAugmentation(false, 0.505)).toEqual(undefined)
  })

  test("totalEcartPondere is undefined", () => {
    expect(ecartAugmentation(true, undefined)).toEqual(undefined)
  })

  test("test some valid data", () => {
    expect(ecartAugmentation(true, 0.01)).toEqual(1)
    expect(ecartAugmentation(true, 0.022)).toEqual(2.2)
    expect(ecartAugmentation(true, 0.505)).toEqual(50.5)
  })
})

describe("calculIndicateurSexeSurRepresente", () => {
  test("ecart is undefined", () => {
    expect(sexeSurRepresente(undefined)).toEqual(undefined)
  })

  test("ecart is in favor of men", () => {
    expect(sexeSurRepresente(12)).toEqual("hommes")
  })

  test("ecart is in favor of women", () => {
    expect(sexeSurRepresente(-12)).toEqual("femmes")
  })

  test("ecart is 0", () => {
    expect(sexeSurRepresente(0)).toEqual(undefined)
  })
})

describe("calculNote", () => {
  test("cant calcul note", () => {
    expect(calculerNote(undefined, undefined, undefined, undefined)).toEqual({
      note: undefined,
      mesureCorrection: false,
    })
  })

  test("test some valid data", () => {
    expect(calculerNote(-2, undefined, undefined, undefined)).toEqual({
      note: 20,
      mesureCorrection: false,
    })
    expect(calculerNote(-0.5, undefined, undefined, undefined)).toEqual({
      note: 20,
      mesureCorrection: false,
    })
    expect(calculerNote(0, undefined, undefined, undefined)).toEqual({
      note: 20,
      mesureCorrection: false,
    })
    expect(calculerNote(0.1, undefined, undefined, undefined)).toEqual({
      note: 20,
      mesureCorrection: false,
    })
    expect(calculerNote(0.5, undefined, undefined, undefined)).toEqual({
      note: 20,
      mesureCorrection: false,
    })
    expect(calculerNote(1, undefined, undefined, undefined)).toEqual({
      note: 20,
      mesureCorrection: false,
    })
    expect(calculerNote(2, undefined, undefined, undefined)).toEqual({
      note: 20,
      mesureCorrection: false,
    })
    expect(calculerNote(2.1, undefined, undefined, undefined)).toEqual({
      note: 10,
      mesureCorrection: false,
    })
    expect(calculerNote(3.2, undefined, undefined, undefined)).toEqual({
      note: 10,
      mesureCorrection: false,
    })
    expect(calculerNote(4, undefined, undefined, undefined)).toEqual({
      note: 10,
      mesureCorrection: false,
    })
    expect(calculerNote(5, undefined, undefined, undefined)).toEqual({
      note: 10,
      mesureCorrection: false,
    })
    expect(calculerNote(5.1, undefined, undefined, undefined)).toEqual({
      note: 5,
      mesureCorrection: false,
    })
    expect(calculerNote(7, undefined, undefined, undefined)).toEqual({
      note: 5,
      mesureCorrection: false,
    })
    expect(calculerNote(7.1, undefined, undefined, undefined)).toEqual({
      note: 5,
      mesureCorrection: false,
    })
    expect(calculerNote(8, undefined, undefined, undefined)).toEqual({
      note: 5,
      mesureCorrection: false,
    })
    expect(calculerNote(10, undefined, undefined, undefined)).toEqual({
      note: 5,
      mesureCorrection: false,
    })
    expect(calculerNote(10.1, undefined, undefined, undefined)).toEqual({
      note: 0,
      mesureCorrection: false,
    })
    expect(calculerNote(13.2, undefined, undefined, undefined)).toEqual({
      note: 0,
      mesureCorrection: false,
    })
    expect(calculerNote(50.5, undefined, undefined, undefined)).toEqual({
      note: 0,
      mesureCorrection: false,
    })
  })

  describe("test round to 1 number after comma", () => {
    test("round to 2.1", () => {
      expect(calculerNote(2.1, undefined, undefined, undefined)).toEqual({
        note: 10,
        mesureCorrection: false,
      })
      expect(calculerNote(2.09, undefined, undefined, undefined)).toEqual({
        note: 10,
        mesureCorrection: false,
      })
      expect(calculerNote(2.06, undefined, undefined, undefined)).toEqual({
        note: 10,
        mesureCorrection: false,
      })
      expect(calculerNote(2.05, undefined, undefined, undefined)).toEqual({
        note: 10,
        mesureCorrection: false,
      })
    })

    test("round to 2.0", () => {
      expect(calculerNote(2.04, undefined, undefined, undefined)).toEqual({
        note: 20,
        mesureCorrection: false,
      })
      expect(calculerNote(2.01, undefined, undefined, undefined)).toEqual({
        note: 20,
        mesureCorrection: false,
      })
      expect(calculerNote(2.0, undefined, undefined, undefined)).toEqual({
        note: 20,
        mesureCorrection: false,
      })
    })
  })

  describe("correction measure from indicateur 1", () => {
    test("note indicator 1 is 40 so not correction measure", () => {
      expect(calculerNote(2.1, 40, "femmes", "hommes")).toEqual({
        note: 10,
        mesureCorrection: false,
      })
    })

    test("overrepresented sex is same on indicator 1 & 2 so not correction measure", () => {
      expect(calculerNote(8.1, 36, "hommes", "hommes")).toEqual({
        note: 5,
        mesureCorrection: false,
      })
    })

    test("correction measure for men", () => {
      expect(calculerNote(2.1, 39, "femmes", "hommes")).toEqual({
        note: 20,
        mesureCorrection: true,
      })
    })

    test("correction measure for women", () => {
      expect(calculerNote(8.1, 36, "hommes", "femmes")).toEqual({
        note: 20,
        mesureCorrection: true,
      })
    })

    test("note indicator 1 is 0", () => {
      expect(calculerNote(8.1, 0, "hommes", "femmes")).toEqual({
        note: 20,
        mesureCorrection: true,
      })
    })
  })
})
