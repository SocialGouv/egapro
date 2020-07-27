import { mustBeDate } from "./formHelpers";

describe("mustBeDate", () => {
  test("parses date as ISO format", () => {
    expect(mustBeDate("2018-12-31")).toBe(false);
    expect(mustBeDate("2018-12-31a")).toBe(true);
    expect(mustBeDate("2018-31-12")).toBe(true);
  });

  test("parses date as french format", () => {
    expect(mustBeDate("31/12/2018")).toBe(false);
    expect(mustBeDate("31/12/2018a")).toBe(true);
    expect(mustBeDate("12/31/2018")).toBe(true);
  });
});
