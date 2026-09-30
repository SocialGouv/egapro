import { type ReferentDTO } from "@common/core-domain/dtos/ReferentDTO";
import { referentMap } from "@common/core-domain/mappers/referentMap";
import { COUNTIES, REGIONS } from "@common/dict";
import { AppError, type UseCase } from "@common/shared-domain";
import { Object } from "@common/utils/overload";
import { type SimpleObject } from "@common/utils/types";
import { AsyncParser } from "@json2csv/node";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import ExcelJS from "exceljs";
import { groupBy, orderBy, partition } from "lodash";
import { Readable } from "stream";

import { type IReferentRepo } from "../../repo/IReferentRepo";

export const EXPORT_MIME = {
  json: "application/json",
  csv: "text/csv",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};
export const EXPORT_EXT = Object.keys(EXPORT_MIME);
export type ValidExportExtension = (typeof EXPORT_EXT)[number];

/**
 * The CSV export is public and opened in spreadsheets: a cell starting with = + - @ (or a tab / carriage
 * return) would be evaluated as a formula (CSV injection). Prefix it with a quote so it stays text.
 */
export const neutralizeFormula = (value: string | null | undefined) =>
  value && /^[=+\-@\t\r]/.test(value) ? `'${value}` : value ?? "";

export class ExportReferents implements UseCase<ValidExportExtension, Readable> {
  constructor(private readonly referentRepo: IReferentRepo) {}

  public async execute(ext: ValidExportExtension): Promise<Readable> {
    try {
      const referents = await this.referentRepo.getAll();
      const json = referents.map(referentMap.toDTO);

      switch (ext) {
        case "csv":
          return this.streamAsCSV(json);
        case "xlsx":
          return await this.streamAsXLSX(json);
        case "json":
        default:
          return this.streamAsJSON(json);
      }
    } catch (error: unknown) {
      console.error(error);
      throw new ExportReferentsError("Cannot export referents", error as Error);
    }
  }

  private streamAsJSON(json: ReferentDTO[]): Readable {
    return Readable.from(JSON.stringify(json), { encoding: "utf-8" });
  }

  private streamAsCSV(json: ReferentDTO[]): Readable {
    const parser = new AsyncParser({
      withBOM: true,
      fields: [
        {
          value: "principal",
          label: "Principal",
          default: "false",
        },
        {
          value: (record: ReferentDTO) => neutralizeFormula(record.name),
          label: "Nom",
        },
        {
          value: (record: ReferentDTO) => REGIONS[record.region],
          label: "Région",
        },
        {
          value: (record: ReferentDTO) => (record.county ? COUNTIES[record.county] : ""),
          label: "Département",
        },
        {
          label: "Contact",
          value: (record: ReferentDTO) => neutralizeFormula(record.value),
        },
        {
          label: "Nom Suppléant",
          value: (record: ReferentDTO) => neutralizeFormula(record.substitute?.name),
        },
        {
          label: "Email Suppléant",
          value: (record: ReferentDTO) => neutralizeFormula(record.substitute?.email),
        },
      ],
    });
    return parser.parse(json);
  }

  private async streamAsXLSX(json: ReferentDTO[]): Promise<Readable> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Egapro";
    workbook.company = "Ministère du Travail";
    workbook.created = new Date();
    fillWorksheet(workbook.addWorksheet("Référents EgaPro"), json);

    const buf = await workbook.xlsx.writeBuffer();
    return Readable.from(Buffer.from(buf));
  }
}

export class ExportReferentsError extends AppError {}

/** Specific region referent name */
const REGION_REF_NAME: SimpleObject<string> = {
  "01": "DEETS GUADELOUPE",
  "03": "DGCOPOP GUYANE",
  "04": "DEETS LA REUNION",
  "02": "DEETS MARTINIQUE",
  "06": "DEETS MAYOTTE",
};

// CELL STYLE UTILS
const mediumBorder: Partial<ExcelJS.Border> = { style: "medium" };
const borderStyle: Partial<ExcelJS.Style> = {
  border: { left: mediumBorder, top: mediumBorder, bottom: mediumBorder, right: mediumBorder },
};

const whiteFill: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
const baseFont: Partial<ExcelJS.Font> = { size: 11, name: "Calibri", color: { argb: "FF000000" } };

const fontStyle: Partial<ExcelJS.Style> = {
  font: baseFont,
  fill: whiteFill,
  alignment: { vertical: "middle", wrapText: true },
};
const fontBoldStyle: Partial<ExcelJS.Style> = {
  ...fontStyle,
  font: { ...baseFont, bold: true },
};
const fontLinkStyle: Partial<ExcelJS.Style> = {
  ...fontStyle,
  font: { ...baseFont, underline: true, color: { argb: "FF0000FF" } },
};

const regionTitleFullStyle: Partial<ExcelJS.Style> = {
  fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFD8D8D8" } },
  font: { ...baseFont, bold: true, name: "Arial" },
  alignment: { vertical: "middle", horizontal: "center" },
  ...borderStyle,
};

// ---

type ReferentWithLabels = ReferentDTO & {
  countyName: string;
  regionName: string;
};

/** Region and county codes are numbers, except Corsica ("2A", "2B"): keep those as text. */
const code = (value?: string) => (value && /^\d+$/.test(value) ? Number(value) : value ?? null);

function fillWorksheet(worksheet: ExcelJS.Worksheet, data: ReferentDTO[]) {
  const setCell = (address: string, value: ExcelJS.CellValue, style: Partial<ExcelJS.Style>) => {
    const cell = worksheet.getCell(address);
    cell.value = value;
    cell.style = style;
  };

  // add region name and country name
  const augmented = data.map<ReferentWithLabels>(item => ({
    ...item,
    regionName: REGIONS[item.region],
    countyName: item.county ? COUNTIES[item.county] : "",
  }));

  // sort alpha by regionname and county number
  const sorted = orderBy(augmented, ["regionName", "county"], ["asc", "asc"]);
  const grouped = groupBy(sorted, "regionName");

  // main title, on two lines
  setCell(
    "C1",
    `LISTE DES RÉFÉRENTS ÉGALITÉ PROFESSIONNELLE AU ${format(Date.now(), "dd MMMM yyyy", {
      locale: fr,
    }).toLocaleUpperCase()}`,
    {
      font: { ...baseFont, bold: true, size: 14 },
      alignment: { vertical: "middle", horizontal: "center" },
    },
  );
  worksheet.mergeCells("C1:E2");

  // start after title
  let line = 2;
  for (const [regionName, region] of Object.entries(grouped)) {
    line++;
    setCell(`A${line}`, null, borderStyle); // left side empty
    worksheet.mergeCells(`A${line}:B${line}`);

    const [[coordRegionnale], restRegion] = partition(region, item => !item.county);
    const regionId = coordRegionnale?.region || restRegion[0]?.region;

    setCell(`C${line}`, REGION_REF_NAME[regionId] ?? `DREETS ${regionName.toLocaleUpperCase()}`, regionTitleFullStyle);
    worksheet.mergeCells(`C${line}:E${line}`); // merge region title

    if (coordRegionnale) {
      line++;
      const subCoordName = coordRegionnale.substitute?.name ? `\n${coordRegionnale.substitute?.name}` : "";
      const subCoordEmail = coordRegionnale.substitute?.email ? `\n${coordRegionnale.substitute?.email}` : "";
      setCell(`A${line}`, code(coordRegionnale.region), { ...fontStyle, ...borderStyle });
      setCell(`B${line}`, null, borderStyle);
      setCell(`C${line}`, "Coordination régionale", { ...fontBoldStyle, ...borderStyle });
      setCell(`D${line}`, coordRegionnale.name + subCoordName, { ...fontBoldStyle, ...borderStyle });
      setCell(`E${line}`, coordRegionnale.value + subCoordEmail, { ...fontLinkStyle, ...borderStyle });
    }

    for (const referent of restRegion) {
      line++;
      const subName = referent.substitute?.name ? `\n${referent.substitute?.name}` : "";
      const subEmail = referent.substitute?.email ? `\n${referent.substitute?.email}` : "";
      setCell(`A${line}`, code(referent.region), { ...fontStyle, ...borderStyle });
      setCell(`B${line}`, code(referent.county), { ...fontStyle, ...borderStyle });
      setCell(`C${line}`, referent.countyName, { ...fontStyle, ...borderStyle });
      setCell(`D${line}`, referent.name + subName, { ...fontStyle, ...borderStyle });
      setCell(`E${line}`, referent.value + subEmail, { ...fontLinkStyle, ...borderStyle });
    }
  }

  // Same widths as before (50, 80, 170, 260 and 420 px), in characters.
  worksheet.columns = [{ width: 7 }, { width: 11 }, { width: 24 }, { width: 37 }, { width: 60 }];
}
