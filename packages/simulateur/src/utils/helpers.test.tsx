import { calendarYear, dateToFrString, parseDate, Year } from "./date"
import { displaySexeSurRepresente, messageEcartNombreEquivalentSalaries } from "./helpers"

describe("parseDate", () => {
  test("parses date as ISO format", () => {
    expect(dateToFrString(parseDate("2018-12-31"))).toEqual("31/12/2018")
    expect(parseDate("2018-12-31a")).toBe(undefined)
    expect(dateToFrString(parseDate("2018-12-31a"))).toEqual("")
    expect(parseDate("2018-31-12")).toBe(undefined)
    expect(dateToFrString(parseDate("2018-31-12"))).toEqual("")
  })

  test("parses date as french format", () => {
    expect(dateToFrString(parseDate("31/12/2018"))).toEqual("31/12/2018")
    expect(parseDate("31/12/2018a")).toBe(undefined)
    expect(dateToFrString(parseDate("31/12/2018a"))).toEqual("")
    expect(parseDate("12/31/2018")).toBe(undefined)
    expect(dateToFrString(parseDate("12/31/2018"))).toEqual("")
  })
})

describe("calendarYear", () => {
  test("adds a year", () => {
    expect(calendarYear("2018-12-31", Year.Add, 1)).toEqual("30/12/2019")
    expect(calendarYear("2019-01-01", Year.Add, 1)).toEqual("31/12/2019")
    expect(calendarYear("2019-01-02", Year.Add, 1)).toEqual("01/01/2020")
  })

  test("subtracts a year", () => {
    expect(calendarYear("2018-12-30", Year.Subtract, 1)).toEqual("31/12/2017")
    expect(calendarYear("2018-12-31", Year.Subtract, 1)).toEqual("01/01/2018")
    expect(calendarYear("2019-01-01", Year.Subtract, 1)).toEqual("02/01/2018")
  })

  test("adds more than one year", () => {
    expect(calendarYear("2018-12-31", Year.Add, 2)).toEqual("30/12/2020")
    expect(calendarYear("2019-01-01", Year.Add, 2)).toEqual("31/12/2020")
    expect(calendarYear("2019-01-02", Year.Add, 2)).toEqual("01/01/2021")
  })

  test("subtracts more than one year", () => {
    expect(calendarYear("2018-12-30", Year.Subtract, 2)).toEqual("31/12/2016")
    expect(calendarYear("2018-12-31", Year.Subtract, 2)).toEqual("01/01/2017")
    expect(calendarYear("2019-01-01", Year.Subtract, 2)).toEqual("02/01/2017")
  })
})

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
