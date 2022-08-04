import { mustBeDate } from "./formHelpers"

describe("mustBeDate", () => {
  test("parses date as ISO format", () => {
    expect(mustBeDate("2018-12-31")).toBe(undefined)
    expect(mustBeDate("2018-12-31a")).toBe("Ce champ doit contenir une date au format jj/mm/aaaa")
    expect(mustBeDate("2018-31-12")).toBe("Ce champ doit contenir une date au format jj/mm/aaaa")
  })

  test("parses date as french format", () => {
    expect(mustBeDate("31/12/2018")).toBe(undefined)
    expect(mustBeDate("31/12/2018a")).toBe("Ce champ doit contenir une date au format jj/mm/aaaa")
    expect(mustBeDate("12/31/2018")).toBe("Ce champ doit contenir une date au format jj/mm/aaaa")
  })
})
