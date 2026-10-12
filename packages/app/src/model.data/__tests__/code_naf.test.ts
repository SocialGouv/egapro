import codeNafSchema from "../code_naf.json";

describe("code_naf schema", () => {
  const codePattern = new RegExp(codeNafSchema.pattern);

  it.each(["62.01Z", "03.11Y", "10.51G", "99.99Z"])("accepts a NAF code such as %s", code => {
    expect(codePattern.test(code)).toBe(true);
  });

  it.each([
    "",
    " ",
    "toto",
    "<script>",
    "[NON-DIFFUSIBLE]",
    "62.01",
    "123.45Z",
    "6201Z",
    "62.01z",
    "６２.０１Z",
    "62.01Z\n",
    "62.01Z\r\n",
    "62.01Z ",
    " 62.01Z",
  ])("rejects values outside the NAF code format: %s", code => {
    expect(codePattern.test(code)).toBe(false);
  });
});
