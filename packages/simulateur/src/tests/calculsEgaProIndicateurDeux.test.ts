import {
  calculValiditeGroupe,
  calculEcartTauxAugmentation,
  calculIndicateurCalculable,
  calculIndicateurEcartAugmentation,
  calculIndicateurSexeSurRepresente,
  calculNote,
} from "../utils/calculsEgaProIndicateurDeux"

//////////////////
// INDICATEUR 2 //
//////////////////

describe("calculValiditeGroupe", () => {
  test("incoherent data", () => {
    expect(calculValiditeGroupe(-1, -2)).toEqual(false)
    expect(calculValiditeGroupe(4, -2)).toEqual(false)
  })

  test("men or women are under 10", () => {
    expect(calculValiditeGroupe(0, 0)).toEqual(false)
    expect(calculValiditeGroupe(1, 1)).toEqual(false)
    expect(calculValiditeGroupe(4, 6)).toEqual(false)
    expect(calculValiditeGroupe(9, 10)).toEqual(false)
    expect(calculValiditeGroupe(11, 8)).toEqual(false)
  })

  test("valid groupe", () => {
    expect(calculValiditeGroupe(10, 10)).toEqual(true)
    expect(calculValiditeGroupe(11, 10)).toEqual(true)
    expect(calculValiditeGroupe(11, 21)).toEqual(true)
  })
})

describe("calculEcartTauxAugmentation", () => {
  test("tauxAugmentation must be positive number", () => {
    expect(calculEcartTauxAugmentation(undefined, 3)).toEqual(undefined)
    expect(calculEcartTauxAugmentation(1, undefined)).toEqual(undefined)
    expect(calculEcartTauxAugmentation(-1, 2)).toEqual(undefined)
    expect(calculEcartTauxAugmentation(4, -2)).toEqual(undefined)
  })

  test("test some data", () => {
    expect(calculEcartTauxAugmentation(0, 0)).toEqual(0)
    expect(calculEcartTauxAugmentation(0.12, 0.12)).toEqual(0)
    expect(calculEcartTauxAugmentation(0.12, 0.19)).toEqual(0.07)
    expect(calculEcartTauxAugmentation(0.2, 0.3)).toEqual(0.1)
    expect(calculEcartTauxAugmentation(0.28, 0.215)).toEqual(-0.065)
    expect(calculEcartTauxAugmentation(0.25, 0.5)).toEqual(0.25)
  })
})

describe("calculIndicateurCalculable", () => {
  test("presenceAugmentation must be true", () => {
    expect(calculIndicateurCalculable(false, 100, 40, 0, 0.23)).toEqual(false)
  })

  test("calculEffectifsIndicateurCalculable must be true", () => {
    expect(calculIndicateurCalculable(true, 100, 39, 0.12, 0.23)).toEqual(false)
    expect(calculIndicateurCalculable(true, 100, 39, 0, 0.23)).toEqual(false)
    expect(calculIndicateurCalculable(true, 500, 199, 0.12, 0.23)).toEqual(false)
    expect(calculIndicateurCalculable(true, 500, 199, 0.12, 0)).toEqual(false)
    expect(calculIndicateurCalculable(true, 600, 200, 0.12, 0.23)).toEqual(false)
  })

  test("totalTauxAugmentation men or women should be above 0", () => {
    expect(calculIndicateurCalculable(true, 600, 200, 0, 0)).toEqual(false)
    expect(calculIndicateurCalculable(true, 700, 350, 0, 0)).toEqual(false)
  })

  test("test some data", () => {
    expect(calculIndicateurCalculable(true, 100, 40, 0, 0.23)).toEqual(true)
    expect(calculIndicateurCalculable(true, 100, 40, 0.12, 0.23)).toEqual(true)
    expect(calculIndicateurCalculable(true, 500, 400, 0.12, 0)).toEqual(true)
    expect(calculIndicateurCalculable(true, 1000, 400, 0.12, 0.23)).toEqual(true)
    expect(calculIndicateurCalculable(true, 700, 350, 0.12, 0.23)).toEqual(true)
  })
})

describe("calculIndicateurEcartAugmentation", () => {
  test("indicateur isnt calculable", () => {
    expect(calculIndicateurEcartAugmentation(false, undefined)).toEqual(undefined)
    expect(calculIndicateurEcartAugmentation(false, 0.01)).toEqual(undefined)
    expect(calculIndicateurEcartAugmentation(false, 0.022)).toEqual(undefined)
    expect(calculIndicateurEcartAugmentation(false, 0.505)).toEqual(undefined)
  })

  test("totalEcartPondere is undefined", () => {
    expect(calculIndicateurEcartAugmentation(true, undefined)).toEqual(undefined)
  })

  test("test some valid data", () => {
    expect(calculIndicateurEcartAugmentation(true, 0.01)).toEqual(1)
    expect(calculIndicateurEcartAugmentation(true, 0.022)).toEqual(2.2)
    expect(calculIndicateurEcartAugmentation(true, 0.505)).toEqual(50.5)
  })
})

describe("calculIndicateurSexeSurRepresente", () => {
  test("ecart is undefined", () => {
    expect(calculIndicateurSexeSurRepresente(undefined)).toEqual(undefined)
  })

  test("ecart is in favor of men", () => {
    expect(calculIndicateurSexeSurRepresente(12)).toEqual("hommes")
  })

  test("ecart is in favor of women", () => {
    expect(calculIndicateurSexeSurRepresente(-12)).toEqual("femmes")
  })

  test("ecart is 0", () => {
    expect(calculIndicateurSexeSurRepresente(0)).toEqual(undefined)
  })
})

describe("calculNote", () => {
  test("cant calcul note", () => {
    expect(calculNote(undefined, undefined, undefined, undefined)).toEqual({
      note: undefined,
      correctionMeasure: false,
    })
  })

  test("test some valid data", () => {
    expect(calculNote(-2, undefined, undefined, undefined)).toEqual({
      note: 20,
      correctionMeasure: false,
    })
    expect(calculNote(-0.5, undefined, undefined, undefined)).toEqual({
      note: 20,
      correctionMeasure: false,
    })
    expect(calculNote(0, undefined, undefined, undefined)).toEqual({
      note: 20,
      correctionMeasure: false,
    })
    expect(calculNote(0.1, undefined, undefined, undefined)).toEqual({
      note: 20,
      correctionMeasure: false,
    })
    expect(calculNote(0.5, undefined, undefined, undefined)).toEqual({
      note: 20,
      correctionMeasure: false,
    })
    expect(calculNote(1, undefined, undefined, undefined)).toEqual({
      note: 20,
      correctionMeasure: false,
    })
    expect(calculNote(2, undefined, undefined, undefined)).toEqual({
      note: 20,
      correctionMeasure: false,
    })
    expect(calculNote(2.1, undefined, undefined, undefined)).toEqual({
      note: 10,
      correctionMeasure: false,
    })
    expect(calculNote(3.2, undefined, undefined, undefined)).toEqual({
      note: 10,
      correctionMeasure: false,
    })
    expect(calculNote(4, undefined, undefined, undefined)).toEqual({
      note: 10,
      correctionMeasure: false,
    })
    expect(calculNote(5, undefined, undefined, undefined)).toEqual({
      note: 10,
      correctionMeasure: false,
    })
    expect(calculNote(5.1, undefined, undefined, undefined)).toEqual({
      note: 5,
      correctionMeasure: false,
    })
    expect(calculNote(7, undefined, undefined, undefined)).toEqual({
      note: 5,
      correctionMeasure: false,
    })
    expect(calculNote(7.1, undefined, undefined, undefined)).toEqual({
      note: 5,
      correctionMeasure: false,
    })
    expect(calculNote(8, undefined, undefined, undefined)).toEqual({
      note: 5,
      correctionMeasure: false,
    })
    expect(calculNote(10, undefined, undefined, undefined)).toEqual({
      note: 5,
      correctionMeasure: false,
    })
    expect(calculNote(10.1, undefined, undefined, undefined)).toEqual({
      note: 0,
      correctionMeasure: false,
    })
    expect(calculNote(13.2, undefined, undefined, undefined)).toEqual({
      note: 0,
      correctionMeasure: false,
    })
    expect(calculNote(50.5, undefined, undefined, undefined)).toEqual({
      note: 0,
      correctionMeasure: false,
    })
  })

  describe("test round to 1 number after comma", () => {
    test("round to 2.1", () => {
      expect(calculNote(2.1, undefined, undefined, undefined)).toEqual({
        note: 10,
        correctionMeasure: false,
      })
      expect(calculNote(2.09, undefined, undefined, undefined)).toEqual({
        note: 10,
        correctionMeasure: false,
      })
      expect(calculNote(2.06, undefined, undefined, undefined)).toEqual({
        note: 10,
        correctionMeasure: false,
      })
      expect(calculNote(2.05, undefined, undefined, undefined)).toEqual({
        note: 10,
        correctionMeasure: false,
      })
    })

    test("round to 2.0", () => {
      expect(calculNote(2.04, undefined, undefined, undefined)).toEqual({
        note: 20,
        correctionMeasure: false,
      })
      expect(calculNote(2.01, undefined, undefined, undefined)).toEqual({
        note: 20,
        correctionMeasure: false,
      })
      expect(calculNote(2.0, undefined, undefined, undefined)).toEqual({
        note: 20,
        correctionMeasure: false,
      })
    })
  })

  describe("correction measure from indicateur 1", () => {
    test("note indicator 1 is 40 so not correction measure", () => {
      expect(calculNote(2.1, 40, "femmes", "hommes")).toEqual({
        note: 10,
        correctionMeasure: false,
      })
    })

    test("overrepresented sex is same on indicator 1 & 2 so not correction measure", () => {
      expect(calculNote(8.1, 36, "hommes", "hommes")).toEqual({
        note: 5,
        correctionMeasure: false,
      })
    })

    test("correction measure for men", () => {
      expect(calculNote(2.1, 39, "femmes", "hommes")).toEqual({
        note: 20,
        correctionMeasure: true,
      })
    })

    test("correction measure for women", () => {
      expect(calculNote(8.1, 36, "hommes", "femmes")).toEqual({
        note: 20,
        correctionMeasure: true,
      })
    })

    test("note indicator 1 is 0", () => {
      expect(calculNote(8.1, 0, "hommes", "femmes")).toEqual({
        note: 20,
        correctionMeasure: true,
      })
    })
  })
})
