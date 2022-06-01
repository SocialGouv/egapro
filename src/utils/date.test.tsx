import { calendarYear, dateToString, Year, parseDate } from "./date"

describe("parseDate", () => {
  test("parses date as ISO format", () => {
    expect(dateToString(parseDate("2018-12-31"))).toEqual("31/12/2018")
    expect(parseDate("2018-12-31a")).toBe(undefined)
    expect(dateToString(parseDate("2018-12-31a"))).toEqual("")
    expect(parseDate("2018-31-12")).toBe(undefined)
    expect(dateToString(parseDate("2018-31-12"))).toEqual("")
  })

  test("parses date as french format", () => {
    expect(dateToString(parseDate("31/12/2018"))).toEqual("31/12/2018")
    expect(parseDate("31/12/2018a")).toBe(undefined)
    expect(dateToString(parseDate("31/12/2018a"))).toEqual("")
    expect(parseDate("12/31/2018")).toBe(undefined)
    expect(dateToString(parseDate("12/31/2018"))).toEqual("")
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
