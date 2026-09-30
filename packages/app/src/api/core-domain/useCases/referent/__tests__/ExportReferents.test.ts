/**
 * @jest-environment node
 */
import { ExportReferents, neutralizeFormula } from "../ExportReferents";

jest.mock("@common/core-domain/mappers/referentMap", () => ({ referentMap: { toDTO: (r: unknown) => r } }));

const streamToString = async (stream: NodeJS.ReadableStream) => {
  let out = "";
  for await (const chunk of stream) out += chunk.toString();
  return out;
};

describe("ExportReferents", () => {
  it.each(['=HYPERLINK("http://evil")', "+1+1", "-2+3", "@SUM(A1)", "\tcmd", "\rcmd"])(
    "neutralizes formula-like value %p",
    value => {
      expect(neutralizeFormula(value)).toBe(`'${value}`);
    },
  );

  it("keeps regular values untouched", () => {
    expect(neutralizeFormula("Jean Dupont")).toBe("Jean Dupont");
    expect(neutralizeFormula("jean@travail.gouv.fr")).toBe("jean@travail.gouv.fr");
    expect(neutralizeFormula(undefined)).toBe("");
  });

  it("never emits a cell starting with a formula character in the CSV export", async () => {
    const referentRepo = {
      getAll: jest.fn().mockResolvedValue([
        {
          name: '=HYPERLINK("http://evil.test","clic")',
          value: "+33123456789",
          region: "11",
          county: "75",
          principal: true,
          substitute: { name: "@evil", email: "-x@y.fr" },
        },
      ]),
    };

    const csv = await streamToString(await new ExportReferents(referentRepo as never).execute("csv"));

    expect(csv).toContain(`"'=HYPERLINK(""http://evil.test"",""clic"")"`);
    expect(csv).toContain(`"'+33123456789"`);
    expect(csv).toContain(`"'@evil"`);
    expect(csv).toContain(`"'-x@y.fr"`);
  });
});
