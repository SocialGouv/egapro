/**
 * @jest-environment node
 */
import ExcelJS from "exceljs";

import { ExportReferents, neutralizeFormula } from "../ExportReferents";

jest.mock("@common/core-domain/mappers/referentMap", () => ({ referentMap: { toDTO: (r: unknown) => r } }));

const streamToBuffer = async (stream: NodeJS.ReadableStream) => {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
};

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

  it("writes the styled XLSX export, with text cells never turned into formulas", async () => {
    const referentRepo = {
      getAll: jest.fn().mockResolvedValue([
        { name: "Coordination IDF", value: "idf@travail.gouv.fr", region: "11", principal: true },
        {
          name: '=HYPERLINK("http://evil.test")',
          value: "paris@travail.gouv.fr",
          region: "11",
          county: "75",
          principal: false,
          substitute: { name: "Suppléant", email: "sup@travail.gouv.fr" },
        },
        { name: "Corse-du-Sud", value: "corse@travail.gouv.fr", region: "94", county: "2A", principal: false },
      ]),
    };

    const buffer = await streamToBuffer(await new ExportReferents(referentRepo as never).execute("xlsx"));
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const sheet = workbook.getWorksheet("Référents EgaPro")!;

    expect(String(sheet.getCell("C1").value)).toMatch(/^LISTE DES RÉFÉRENTS ÉGALITÉ PROFESSIONNELLE AU /);
    expect(sheet.getCell("C1").isMerged).toBe(true);
    const cells = sheet.getSheetValues().flat().filter(Boolean).map(String);
    expect(cells).toContain("Coordination régionale");
    expect(cells).toContain("Coordination IDF");
    expect(cells).toContain('=HYPERLINK("http://evil.test")\nSuppléant');
    expect(cells).toContain("2A");

    const injected = sheet.getColumn("D").values.find(v => String(v).startsWith("=HYPERLINK"));
    expect(typeof injected).toBe("string"); // a plain string cell, not a { formula } cell
  });
});
