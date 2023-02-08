import {
  // Indicateur 1
  calculerValiditeGroupe,
  calculerEcartRemunerationMoyenne,
  calculerEcartApresApplicationSeuilPertinenceCsp,
  calculerEcartApresApplicationSeuilPertinenceCoef,
  calculerEcartRemuneration,
  calculerNote,
} from "../utils/calculsEgaProIndicateurUn"

//////////////////
// INDICATEUR 1 //
//////////////////

describe("calculValiditeGroupe", () => {
  test("incoherent data", () => {
    expect(calculerValiditeGroupe(-1, -2)).toEqual(false)
    expect(calculerValiditeGroupe(4, -2)).toEqual(false)
  })

  test("men or women are under 3", () => {
    expect(calculerValiditeGroupe(0, 0)).toEqual(false)
    expect(calculerValiditeGroupe(1, 1)).toEqual(false)
    expect(calculerValiditeGroupe(2, 1)).toEqual(false)
    expect(calculerValiditeGroupe(2, 3)).toEqual(false)
    expect(calculerValiditeGroupe(4, 2)).toEqual(false)
  })

  test("valid groupe", () => {
    expect(calculerValiditeGroupe(3, 3)).toEqual(true)
    expect(calculerValiditeGroupe(4, 3)).toEqual(true)
    expect(calculerValiditeGroupe(4, 21)).toEqual(true)
  })
})

describe("calculEcartRemunerationMoyenne", () => {
  test("remunerationAnnuelleBrut must be above 0", () => {
    expect(calculerEcartRemunerationMoyenne(-1, -2)).toEqual(undefined)
    expect(calculerEcartRemunerationMoyenne(4, -2)).toEqual(undefined)
    expect(calculerEcartRemunerationMoyenne(0, 0)).toEqual(undefined)
  })

  test("test some data", () => {
    expect(calculerEcartRemunerationMoyenne(12000, 12000)).toEqual(0)
    expect(calculerEcartRemunerationMoyenne(12000, 19000)).toEqual(0.368421)
    expect(calculerEcartRemunerationMoyenne(20000, 30000)).toEqual(0.333333)
    expect(calculerEcartRemunerationMoyenne(28000, 21500)).toEqual(-0.302326)
    expect(calculerEcartRemunerationMoyenne(25000, 50000)).toEqual(0.5)
  })
})

describe("calculEcartApresApplicationSeuilPertinenceCsp", () => {
  test("ecartRemunerationMoyenne must be a number", () => {
    expect(calculerEcartApresApplicationSeuilPertinenceCsp(undefined)).toEqual(undefined)
  })

  test("test incoherent data", () => {
    expect(calculerEcartApresApplicationSeuilPertinenceCsp(-0.3)).toEqual(-0.25)
  })

  test("test some valid data", () => {
    expect(calculerEcartApresApplicationSeuilPertinenceCsp(0)).toEqual(0)
    expect(calculerEcartApresApplicationSeuilPertinenceCsp(0.01)).toEqual(0)
    expect(calculerEcartApresApplicationSeuilPertinenceCsp(0.032)).toEqual(0)
    expect(calculerEcartApresApplicationSeuilPertinenceCsp(0.05)).toEqual(0)

    expect(calculerEcartApresApplicationSeuilPertinenceCsp(0.051)).toEqual(0.001)
    expect(calculerEcartApresApplicationSeuilPertinenceCsp(0.06)).toEqual(0.01)
    expect(calculerEcartApresApplicationSeuilPertinenceCsp(0.067)).toEqual(0.017)
    expect(calculerEcartApresApplicationSeuilPertinenceCsp(0.083)).toEqual(0.033)
    expect(calculerEcartApresApplicationSeuilPertinenceCsp(0.09)).toEqual(0.04)
    expect(calculerEcartApresApplicationSeuilPertinenceCsp(0.1)).toEqual(0.05)
    expect(calculerEcartApresApplicationSeuilPertinenceCsp(0.101)).toEqual(0.051)
    expect(calculerEcartApresApplicationSeuilPertinenceCsp(0.333)).toEqual(0.283)
    expect(calculerEcartApresApplicationSeuilPertinenceCsp(0.368)).toEqual(0.318)
    expect(calculerEcartApresApplicationSeuilPertinenceCsp(0.368794)).toEqual(0.318794)
  })
})

describe("calculEcartApresApplicationSeuilPertinenceCoef", () => {
  test("ecartRemunerationMoyenne must be a number", () => {
    expect(calculerEcartApresApplicationSeuilPertinenceCoef(undefined)).toEqual(undefined)
  })

  test("test incoherent data", () => {
    expect(calculerEcartApresApplicationSeuilPertinenceCoef(-0.3)).toEqual(-0.28)
  })

  test("test some valid data", () => {
    expect(calculerEcartApresApplicationSeuilPertinenceCoef(0)).toEqual(0)
    expect(calculerEcartApresApplicationSeuilPertinenceCoef(0.01)).toEqual(0)
    expect(calculerEcartApresApplicationSeuilPertinenceCoef(0.02)).toEqual(0)
    expect(calculerEcartApresApplicationSeuilPertinenceCoef(0.021)).toEqual(0.001)
    expect(calculerEcartApresApplicationSeuilPertinenceCoef(0.032)).toEqual(0.012)
    expect(calculerEcartApresApplicationSeuilPertinenceCoef(0.05)).toEqual(0.03)

    expect(calculerEcartApresApplicationSeuilPertinenceCoef(0.051)).toEqual(0.031)
    expect(calculerEcartApresApplicationSeuilPertinenceCoef(0.06)).toEqual(0.04)
    expect(calculerEcartApresApplicationSeuilPertinenceCoef(0.067)).toEqual(0.047)
    expect(calculerEcartApresApplicationSeuilPertinenceCoef(0.083)).toEqual(0.063)
    expect(calculerEcartApresApplicationSeuilPertinenceCoef(0.09)).toEqual(0.07)
    expect(calculerEcartApresApplicationSeuilPertinenceCoef(0.1)).toEqual(0.08)
    expect(calculerEcartApresApplicationSeuilPertinenceCoef(0.101)).toEqual(0.081)
    expect(calculerEcartApresApplicationSeuilPertinenceCoef(0.333)).toEqual(0.313)
    expect(calculerEcartApresApplicationSeuilPertinenceCoef(0.368)).toEqual(0.348)
    expect(calculerEcartApresApplicationSeuilPertinenceCoef(0.368794)).toEqual(0.348794)
  })
})

describe("calculIndicateurEcartRemuneration", () => {
  test("indicateur isnt calculable", () => {
    expect(calculerEcartRemuneration(false, undefined)).toEqual(undefined)
    expect(calculerEcartRemuneration(false, 0.01)).toEqual(undefined)
    expect(calculerEcartRemuneration(false, 0.022)).toEqual(undefined)
    expect(calculerEcartRemuneration(false, 0.505)).toEqual(undefined)
  })

  test("totalEcartPondere is undefined", () => {
    expect(calculerEcartRemuneration(true, undefined)).toEqual(undefined)
  })

  test("test some valid data", () => {
    expect(calculerEcartRemuneration(true, 0.01)).toEqual(1)
    expect(calculerEcartRemuneration(true, 0.022)).toEqual(2.2)
    expect(calculerEcartRemuneration(true, 0.505)).toEqual(50.5)
    expect(calculerEcartRemuneration(true, 0.03456789)).toEqual(3.456789)
  })
})

describe("calculNote", () => {
  test("cant calcul note", () => {
    expect(calculerNote(undefined)).toEqual(undefined)
  })

  test("incoherent data", () => {
    expect(calculerNote(-2)).toEqual(40)
    expect(calculerNote(-0.5)).toEqual(40)
  })

  test("test some valid data", () => {
    expect(calculerNote(0)).toEqual(40)
    expect(calculerNote(0.1)).toEqual(39)
    expect(calculerNote(0.5)).toEqual(39)
    expect(calculerNote(1)).toEqual(39)
    expect(calculerNote(2.2)).toEqual(37)
    expect(calculerNote(7)).toEqual(33)
    expect(calculerNote(7.1)).toEqual(31)
    expect(calculerNote(8)).toEqual(31)
    expect(calculerNote(13.2)).toEqual(19)
    expect(calculerNote(50.5)).toEqual(0)
  })

  describe("test round to 1 number after comma", () => {
    test("round to 2.1", () => {
      expect(calculerNote(2.1)).toEqual(37)
      expect(calculerNote(2.09)).toEqual(37)
      expect(calculerNote(2.06)).toEqual(37)
      expect(calculerNote(2.05)).toEqual(37)
    })

    test("round to 2.0", () => {
      expect(calculerNote(2.04)).toEqual(38)
      expect(calculerNote(2.01)).toEqual(38)
      expect(calculerNote(2.0)).toEqual(38)
    })
  })
})
