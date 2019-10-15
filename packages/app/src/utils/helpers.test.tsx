import { calendarYear, Year } from "./helpers";

describe("calendarYear", () => {
  test("adds a year", () => {
    expect(calendarYear("2018-12-31", Year.Add)).toEqual("2019-12-30");
    expect(calendarYear("2019-01-01", Year.Add)).toEqual("2019-12-31");
    expect(calendarYear("2019-01-02", Year.Add)).toEqual("2020-01-01");
  });

  test("subtracts a year", () => {
    expect(calendarYear("2018-12-30", Year.Subtract)).toEqual("2017-12-31");
    expect(calendarYear("2018-12-31", Year.Subtract)).toEqual("2018-01-01");
    expect(calendarYear("2019-01-01", Year.Subtract)).toEqual("2018-01-02");
  });
});
