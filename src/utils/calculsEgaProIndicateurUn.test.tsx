import {
  // Indicateur 1
  calculValiditeGroupe,
  calculEcartRemunerationMoyenne,
  calculEcartApresApplicationSeuilPertinenceCsp,
  calculEcartApresApplicationSeuilPertinenceCoef,
  calculIndicateurEcartRemuneration,
  calculNote,
} from "./calculsEgaProIndicateurUn"

//////////////////
// INDICATEUR 1 //
//////////////////

describe("calculValiditeGroupe", () => {
  test("incoherent data", () => {
    expect(calculValiditeGroupe(-1, -2)).toEqual(false)
    expect(calculValiditeGroupe(4, -2)).toEqual(false)
  })

  test("men or women are under 3", () => {
    expect(calculValiditeGroupe(0, 0)).toEqual(false)
    expect(calculValiditeGroupe(1, 1)).toEqual(false)
    expect(calculValiditeGroupe(2, 1)).toEqual(false)
    expect(calculValiditeGroupe(2, 3)).toEqual(false)
    expect(calculValiditeGroupe(4, 2)).toEqual(false)
  })

  test("valid groupe", () => {
    expect(calculValiditeGroupe(3, 3)).toEqual(true)
    expect(calculValiditeGroupe(4, 3)).toEqual(true)
    expect(calculValiditeGroupe(4, 21)).toEqual(true)
  })
})

describe("calculEcartRemunerationMoyenne", () => {
  test("remunerationAnnuelleBrut must be above 0", () => {
    expect(calculEcartRemunerationMoyenne(-1, -2)).toEqual(undefined)
    expect(calculEcartRemunerationMoyenne(4, -2)).toEqual(undefined)
    expect(calculEcartRemunerationMoyenne(0, 0)).toEqual(undefined)
  })

  test("test some data", () => {
    expect(calculEcartRemunerationMoyenne(12000, 12000)).toEqual(0)
    expect(calculEcartRemunerationMoyenne(12000, 19000)).toEqual(0.368421)
    expect(calculEcartRemunerationMoyenne(20000, 30000)).toEqual(0.333333)
    expect(calculEcartRemunerationMoyenne(28000, 21500)).toEqual(-0.302326)
    expect(calculEcartRemunerationMoyenne(25000, 50000)).toEqual(0.5)
  })
})

describe("calculEcartApresApplicationSeuilPertinenceCsp", () => {
  test("ecartRemunerationMoyenne must be a number", () => {
    expect(calculEcartApresApplicationSeuilPertinenceCsp(undefined)).toEqual(undefined)
  })

  test("test incoherent data", () => {
    expect(calculEcartApresApplicationSeuilPertinenceCsp(-0.3)).toEqual(-0.25)
  })

  test("test some valid data", () => {
    expect(calculEcartApresApplicationSeuilPertinenceCsp(0)).toEqual(0)
    expect(calculEcartApresApplicationSeuilPertinenceCsp(0.01)).toEqual(0)
    expect(calculEcartApresApplicationSeuilPertinenceCsp(0.032)).toEqual(0)
    expect(calculEcartApresApplicationSeuilPertinenceCsp(0.05)).toEqual(0)

    expect(calculEcartApresApplicationSeuilPertinenceCsp(0.051)).toEqual(0.001)
    expect(calculEcartApresApplicationSeuilPertinenceCsp(0.06)).toEqual(0.01)
    expect(calculEcartApresApplicationSeuilPertinenceCsp(0.067)).toEqual(0.017)
    expect(calculEcartApresApplicationSeuilPertinenceCsp(0.083)).toEqual(0.033)
    expect(calculEcartApresApplicationSeuilPertinenceCsp(0.09)).toEqual(0.04)
    expect(calculEcartApresApplicationSeuilPertinenceCsp(0.1)).toEqual(0.05)
    expect(calculEcartApresApplicationSeuilPertinenceCsp(0.101)).toEqual(0.051)
    expect(calculEcartApresApplicationSeuilPertinenceCsp(0.333)).toEqual(0.283)
    expect(calculEcartApresApplicationSeuilPertinenceCsp(0.368)).toEqual(0.318)
    expect(calculEcartApresApplicationSeuilPertinenceCsp(0.368794)).toEqual(0.318794)
  })
})

describe("calculEcartApresApplicationSeuilPertinenceCoef", () => {
  test("ecartRemunerationMoyenne must be a number", () => {
    expect(calculEcartApresApplicationSeuilPertinenceCoef(undefined)).toEqual(undefined)
  })

  test("test incoherent data", () => {
    expect(calculEcartApresApplicationSeuilPertinenceCoef(-0.3)).toEqual(-0.28)
  })

  test("test some valid data", () => {
    expect(calculEcartApresApplicationSeuilPertinenceCoef(0)).toEqual(0)
    expect(calculEcartApresApplicationSeuilPertinenceCoef(0.01)).toEqual(0)
    expect(calculEcartApresApplicationSeuilPertinenceCoef(0.02)).toEqual(0)
    expect(calculEcartApresApplicationSeuilPertinenceCoef(0.021)).toEqual(0.001)
    expect(calculEcartApresApplicationSeuilPertinenceCoef(0.032)).toEqual(0.012)
    expect(calculEcartApresApplicationSeuilPertinenceCoef(0.05)).toEqual(0.03)

    expect(calculEcartApresApplicationSeuilPertinenceCoef(0.051)).toEqual(0.031)
    expect(calculEcartApresApplicationSeuilPertinenceCoef(0.06)).toEqual(0.04)
    expect(calculEcartApresApplicationSeuilPertinenceCoef(0.067)).toEqual(0.047)
    expect(calculEcartApresApplicationSeuilPertinenceCoef(0.083)).toEqual(0.063)
    expect(calculEcartApresApplicationSeuilPertinenceCoef(0.09)).toEqual(0.07)
    expect(calculEcartApresApplicationSeuilPertinenceCoef(0.1)).toEqual(0.08)
    expect(calculEcartApresApplicationSeuilPertinenceCoef(0.101)).toEqual(0.081)
    expect(calculEcartApresApplicationSeuilPertinenceCoef(0.333)).toEqual(0.313)
    expect(calculEcartApresApplicationSeuilPertinenceCoef(0.368)).toEqual(0.348)
    expect(calculEcartApresApplicationSeuilPertinenceCoef(0.368794)).toEqual(0.348794)
  })
})

describe("calculIndicateurEcartRemuneration", () => {
  test("indicateur isnt calculable", () => {
    expect(calculIndicateurEcartRemuneration(false, undefined)).toEqual(undefined)
    expect(calculIndicateurEcartRemuneration(false, 0.01)).toEqual(undefined)
    expect(calculIndicateurEcartRemuneration(false, 0.022)).toEqual(undefined)
    expect(calculIndicateurEcartRemuneration(false, 0.505)).toEqual(undefined)
  })

  test("totalEcartPondere is undefined", () => {
    expect(calculIndicateurEcartRemuneration(true, undefined)).toEqual(undefined)
  })

  test("test some valid data", () => {
    expect(calculIndicateurEcartRemuneration(true, 0.01)).toEqual(1)
    expect(calculIndicateurEcartRemuneration(true, 0.022)).toEqual(2.2)
    expect(calculIndicateurEcartRemuneration(true, 0.505)).toEqual(50.5)
    expect(calculIndicateurEcartRemuneration(true, 0.03456789)).toEqual(3.456789)
  })
})

describe("calculNote", () => {
  test("cant calcul note", () => {
    expect(calculNote(undefined)).toEqual(undefined)
  })

  test("incoherent data", () => {
    expect(calculNote(-2)).toEqual(40)
    expect(calculNote(-0.5)).toEqual(40)
  })

  test("test some valid data", () => {
    expect(calculNote(0)).toEqual(40)
    expect(calculNote(0.1)).toEqual(39)
    expect(calculNote(0.5)).toEqual(39)
    expect(calculNote(1)).toEqual(39)
    expect(calculNote(2.2)).toEqual(37)
    expect(calculNote(7)).toEqual(33)
    expect(calculNote(7.1)).toEqual(31)
    expect(calculNote(8)).toEqual(31)
    expect(calculNote(13.2)).toEqual(19)
    expect(calculNote(50.5)).toEqual(0)
  })

  describe("test round to 1 number after comma", () => {
    test("round to 2.1", () => {
      expect(calculNote(2.1)).toEqual(37)
      expect(calculNote(2.09)).toEqual(37)
      expect(calculNote(2.06)).toEqual(37)
      expect(calculNote(2.05)).toEqual(37)
    })

    test("round to 2.0", () => {
      expect(calculNote(2.04)).toEqual(38)
      expect(calculNote(2.01)).toEqual(38)
      expect(calculNote(2.0)).toEqual(38)
    })
  })
})
