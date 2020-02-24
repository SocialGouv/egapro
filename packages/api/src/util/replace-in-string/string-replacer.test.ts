import stringReplacer from "./string-replacer";

describe("string-replacer", () => {
  it("should replace templated strings with provided values", () => {
    const template = `Template {{firstValue}},
SecondLine {{secondValue}} {{firstValue}}`;
    const firstValue = "first-value";
    const secondValue = "second-value";
    expect(stringReplacer(template, { firstValue, secondValue }))
      .toBe(`Template first-value,
SecondLine second-value first-value`);
  });
});
