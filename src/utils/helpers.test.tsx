import { displaySexeSurRepresente, messageEcartNombreEquivalentSalaries } from "./helpers"

describe("displaySexeSurRepresente", () => {
  test("displays for 'hommes'", () => {
    expect(displaySexeSurRepresente("hommes")).toEqual("écart favorable aux hommes")
  })

  test("displays for 'femmes'", () => {
    expect(displaySexeSurRepresente("femmes")).toEqual("écart favorable aux femmes")
  })

  test("displays for undefined", () => {
    expect(displaySexeSurRepresente(undefined)).toEqual("les femmes et les hommes sont à égalité")
  })
})

describe("messageEcartNombreEquivalentSalaries", () => {
  describe("as many men as women in the company", () => {
    test("no favorites", () => {
      expect(messageEcartNombreEquivalentSalaries(undefined, undefined)).toEqual("")
    })
    test("women favorited", () => {
      expect(messageEcartNombreEquivalentSalaries("femmes", undefined)).toEqual(
        "* si ce nombre d'hommes supplémentaires avait bénéficié d'une augmentation, les taux d'augmentation seraient égaux entre hommes et femmes.",
      )
    })
    test("men favorited", () => {
      expect(messageEcartNombreEquivalentSalaries("hommes", undefined)).toEqual(
        "* si ce nombre de femmes supplémentaires avait bénéficié d'une augmentation, les taux d'augmentation seraient égaux entre hommes et femmes.",
      )
    })
  })

  describe("more men than women in the company", () => {
    test("no favorites", () => {
      expect(messageEcartNombreEquivalentSalaries(undefined, "femmes")).toEqual("")
    })
    test("women favorited", () => {
      expect(messageEcartNombreEquivalentSalaries("femmes", "femmes")).toEqual(
        "* si ce nombre de femmes n'avait pas reçu d'augmentation parmi les bénéficiaires, les taux d'augmentation seraient égaux entre hommes et femmes.",
      )
    })
    test("men favorited", () => {
      expect(messageEcartNombreEquivalentSalaries("hommes", "femmes")).toEqual(
        "* si ce nombre de femmes supplémentaires avait bénéficié d'une augmentation, les taux d'augmentation seraient égaux entre hommes et femmes.",
      )
    })
  })

  describe("more women than men in the company", () => {
    test("no favorites", () => {
      expect(messageEcartNombreEquivalentSalaries(undefined, "hommes")).toEqual("")
    })
    test("women favorited", () => {
      expect(messageEcartNombreEquivalentSalaries("femmes", "hommes")).toEqual(
        "* si ce nombre d'hommes supplémentaires avait bénéficié d'une augmentation, les taux d'augmentation seraient égaux entre hommes et femmes.",
      )
    })
    test("men favorited", () => {
      expect(messageEcartNombreEquivalentSalaries("hommes", "hommes")).toEqual(
        "* si ce nombre d'hommes n'avait pas reçu d'augmentation parmi les bénéficiaires, les taux d'augmentation seraient égaux entre hommes et femmes.",
      )
    })
  })
})
