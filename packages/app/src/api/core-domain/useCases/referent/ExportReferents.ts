import type { ReferentDTO } from "@common/core-domain/dtos/ReferentDTO";
import { referentMap } from "@common/core-domain/mappers/referentMap";
import { COUNTIES, REGIONS } from "@common/dict";
import type { UseCase } from "@common/shared-domain";
import { AppError } from "@common/shared-domain";
import { Object } from "@common/utils/overload";
import type { SimpleObject } from "@common/utils/types";
import { AsyncParser } from "@json2csv/node";
// eslint-disable-next-line import/no-duplicates
import { format } from "date-fns";
// eslint-disable-next-line import/no-duplicates
import { fr } from "date-fns/locale";
import JS_XLSX from "js-xlsx";
import _ from "lodash";
import path from "path";
import { Readable } from "stream";
import XLSX from "xlsx";

import type { IReferentRepo } from "../../repo/IReferentRepo";

export const EXPORT_MIME = {
  json: "application/json",
  csv: "text/csv",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  //   xlsx: "application/json",
};
export const EXPORT_EXT = Object.keys(EXPORT_MIME);
export type ValidExportExtension = typeof EXPORT_EXT[number];

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
          return this.streamAsXLSX(json);
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
          value: "name",
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
          value: "value",
        },
        {
          label: "Nom Suppléant",
          value: (record: ReferentDTO) => record.substitute?.name || "",
        },
        {
          label: "Email Suppléant",
          value: (record: ReferentDTO) => record.substitute?.email || "",
        },
      ],
    });
    return parser.parse(json);
  }

  private streamAsXLSX(json: ReferentDTO[]): Readable {
    // XLSX;
    // const wbref = JS_XLSX.readFile(path.resolve(process.cwd(), "referents_egalite_professionnelle.xlsx"), {
    //   cellStyles: true,
    //   cellHTML: false,
    //   cellNF: false,
    // });
    // console.log(wbref.vbaraw);
    // return Readable.from("coucou");
    path;
    const workbook = XLSX.utils.book_new();
    workbook.Props = {
      Author: "Egapro",
      CreatedDate: new Date(),
      Company: "Ministère du Travail",
    };
    const worksheet = convertToWorksheet(json);
    console.log(worksheet["!merges"]);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Référents EgaPro");

    JS_XLSX;
    const buf: Buffer = JS_XLSX.write(workbook, { type: "buffer" });
    return Readable.from(buf);
  }
}

export class ExportReferentsError extends AppError {}

const REGION_REF_NAME: SimpleObject<string> = {
  "01": "DEETS GUADELOUPE",
  "03": "DGCOPOP GUYANE",
  "04": "DEETS LA REUNION",
  "02": "DEETS MARTINIQUE",
  "06": "DEETS MAYOTTE",
};

const borderStyle = {
  border: {
    left: { style: "medium", color: {} },
    top: { style: "medium", color: {} },
    bottom: { style: "medium", color: {} },
    right: { style: "medium", color: {} },
  },
};

const fontStyle = {
  font: { sz: "11", name: "Calibri", color: { rgb: "000000" } },
  fill: {
    patternType: "solid",
    fgColor: { rgb: "FFFFFF" },
  },
  alignment: { vertical: "center", wrapText: "1" },
};
const fontBoldStyle = {
  ...fontStyle,
  font: {
    ...fontStyle.font,
    bold: true,
  },
};
const fontLinkStyle = {
  font: {
    ...fontStyle.font,
    underline: true,
    color: { rgb: "0000FF" },
  },
};

const regionTitleFullStyle = {
  fill: {
    patternType: "solid",
    // fgColor: { rgb: "FF000000" },
    // fgColor: { theme: 0, rgb: "000000" },
    fgColor: { rgb: "FFD8D8D8" },
    // bgColor: { indexed: 64 },
  },
  font: {
    ...fontBoldStyle.font,
    name: "Arial",
  },
  alignment: { vertical: "center", horizontal: "center" },
  ...borderStyle,
};

const emptyBorderCell: XLSX.CellObject = {
  t: "z",
  v: "",
  s: {
    ...borderStyle,
  },
};

type ReferentWithLabels = ReferentDTO & {
  countyName: string;
  regionName: string;
};
const A_LETTER = 65;
const address = (addr: string): XLSX.CellAddress => {
  const [col, row] = addr.split("");
  return { c: col.charCodeAt(0) - A_LETTER, r: parseInt(row) - 1 };
};

function convertToWorksheet(data: ReferentDTO[]): XLSX.WorkSheet {
  const augmented = data.map<ReferentWithLabels>(item => ({
    ...item,
    regionName: REGIONS[item.region],
    countyName: item.county ? COUNTIES[item.county] : "",
  }));

  const sorted = _.orderBy(augmented, ["regionName", "county"], ["asc", "asc"]);
  const grouped = _.groupBy(sorted, "regionName");
  const sheet: XLSX.StrictWS = {};
  const meta: XLSX.WorkSheet = {
    "!merges": [],
  };

  const mergeCells = (merges: typeof meta["!merges"], s: string, e: string) =>
    merges?.push({
      s: address(s),
      e: address(e),
    });

  sheet["C1"] = {
    v: `LISTE DES RÉFÉRENTS ÉGALITÉ PROFESSIONNELLE AU ${format(Date.now(), "dd MMMM yyyy", {
      locale: fr,
    }).toLocaleUpperCase()}`,
    t: "s",
    s: {
      font: {
        ...fontBoldStyle,
        sz: "14",
      },
      alignment: { vertical: "center", horizontal: "center" },
    },
  };

  mergeCells(meta["!merges"], "C1", "E1");
  //   mergeCells("C1", "C2");

  let line = 2;
  for (const [regionName, region] of Object.entries(grouped)) {
    line++;
    // sheet[`A${line}`] = emptyBorderCell; // left side empty
    // mergeCells(`A${line}`, `B${line}`);

    const [[coordRegionnale], restRegion] = _.partition(region, item => !item.county);
    const regionId = coordRegionnale?.region || restRegion[0]?.region;
    //
    sheet[`C${line}`] = {
      t: "s",
      v: REGION_REF_NAME[regionId] ?? `DREETS ${regionName.toLocaleUpperCase()}`,
      s: regionTitleFullStyle,
    };
    mergeCells(meta["!merges"], `C${line}`, `E${line}`); // merge region title

    if (coordRegionnale) {
      line++;
      const subCoordName = coordRegionnale.substitute?.name ? `\n${coordRegionnale.substitute?.name}` : "";
      const subCoordEmail = coordRegionnale.substitute?.email ? `\n${coordRegionnale.substitute?.email}` : "";
      sheet[`A${line}`] = {
        t: "n",
        v: coordRegionnale.region,
        s: {
          ...fontStyle,
          ...borderStyle,
        },
      };
      sheet[`B${line}`] = emptyBorderCell;
      sheet[`C${line}`] = {
        t: "s",
        v: "Coordination régionnale",
        s: {
          ...fontBoldStyle,
          ...borderStyle,
        },
      };
      sheet[`D${line}`] = {
        t: "s",
        v: coordRegionnale.name + subCoordName,
        s: {
          ...fontBoldStyle,
          ...borderStyle,
        },
      };
      sheet[`E${line}`] = {
        t: "s",
        v: coordRegionnale.value + subCoordEmail,
        s: {
          ...fontLinkStyle,
          ...borderStyle,
        },
      };
    }

    for (const referent of restRegion) {
      line++;
      const subName = referent.substitute?.name ? `\n${referent.substitute?.name}` : "";
      const subEmail = referent.substitute?.email ? `\n${referent.substitute?.email}` : "";
      sheet[`A${line}`] = {
        t: "n",
        v: referent.region,
        s: {
          ...fontStyle,
          ...borderStyle,
        },
      };
      sheet[`B${line}`] = {
        t: "n",
        v: referent.county,
        s: {
          ...fontStyle,
          ...borderStyle,
        },
      };
      sheet[`C${line}`] = {
        t: "s",
        v: referent.countyName,
        s: {
          ...fontStyle,
          ...borderStyle,
        },
      };
      sheet[`D${line}`] = {
        t: "s",
        v: referent.name + subName,
        s: {
          ...fontBoldStyle,
          ...borderStyle,
          alignment: {
            wrapText: true,
          },
        },
      };
      sheet[`E${line}`] = {
        t: "s",
        v: referent.value + subEmail,
        s: {
          ...fontLinkStyle,
          ...borderStyle,
        },
      };
    }
  }

  meta["!ref"] = `A1:E${line}`;
  meta["!cols"] = [{ wpx: 50 }, { wpx: 80 }, { wpx: 170 }, { wpx: 260 }, { wpx: 420 }];

  return {
    ...meta,
    ...sheet,
  };
}
