/* eslint-disable @typescript-eslint/ban-ts-comment */
import { CSP } from "@common/core-domain/domain/valueObjects/CSP";
import { AgeRange } from "@common/core-domain/domain/valueObjects/declaration/AgeRange";
import { CompanyWorkforceRange } from "@common/core-domain/domain/valueObjects/declaration/CompanyWorkforceRange";
import { RemunerationsMode } from "@common/core-domain/domain/valueObjects/declaration/indicators/RemunerationsMode";

import { computerHelper } from "../computerHelper";

describe("Test calculation", () => {
  it.each([
    {
      remunerations: [
        {
          name: CSP.Enum.OUVRIERS,
          category: {
            [AgeRange.Enum.LESS_THAN_30]: {
              womenSalary: 22434,
              menSalary: 22553,
              womenCount: 1245,
              menCount: 1680,
            },
            [AgeRange.Enum.FROM_30_TO_39]: {
              womenSalary: 23222,
              menSalary: 23131,
              womenCount: 1270,
              menCount: 1733,
            },
            [AgeRange.Enum.FROM_40_TO_49]: {
              womenSalary: 23138,
              menSalary: 22914,
              womenCount: 872,
              menCount: 852,
            },
            [AgeRange.Enum.FROM_50_TO_MORE]: {
              womenSalary: 22946,
              menSalary: 23159,
              womenCount: 351,
              menCount: 369,
            },
          },
        },
        {
          name: CSP.Enum.EMPLOYES,
          category: {
            [AgeRange.Enum.LESS_THAN_30]: {
              womenSalary: 33777,
              menSalary: 35204,
              womenCount: 13,
              menCount: 39,
            },
            [AgeRange.Enum.FROM_30_TO_39]: {
              womenSalary: 32075,
              menSalary: 33560,
              womenCount: 37,
              menCount: 110,
            },
            [AgeRange.Enum.FROM_40_TO_49]: {
              womenSalary: 33428,
              menSalary: 34517,
              womenCount: 14,
              menCount: 46,
            },
            [AgeRange.Enum.FROM_50_TO_MORE]: {
              womenSalary: 32466,
              menSalary: 34150,
              womenCount: 5,
              menCount: 16,
            },
          },
        },
        {
          name: CSP.Enum.TECHNICIENS_AGENTS_MAITRISES,
          category: {
            [AgeRange.Enum.LESS_THAN_30]: {
              womenSalary: 30794,
              menSalary: 34658,
              womenCount: 38,
              menCount: 92,
            },
            [AgeRange.Enum.FROM_30_TO_39]: {
              womenSalary: 31997,
              menSalary: 34500,
              womenCount: 40,
              menCount: 122,
            },
            [AgeRange.Enum.FROM_40_TO_49]: {
              womenSalary: 31724,
              menSalary: 35025,
              womenCount: 27,
              menCount: 60,
            },
            [AgeRange.Enum.FROM_50_TO_MORE]: {
              womenSalary: 35171,
              menSalary: 33728,
              womenCount: 9,
              menCount: 26,
            },
          },
        },
        {
          name: CSP.Enum.INGENIEURS_CADRES,
          category: {
            [AgeRange.Enum.LESS_THAN_30]: {
              womenSalary: 48526,
              menSalary: 52050,
              womenCount: 169,
              menCount: 196,
            },
            [AgeRange.Enum.FROM_30_TO_39]: {
              womenSalary: 61779,
              menSalary: 65804,
              womenCount: 99,
              menCount: 144,
            },
            [AgeRange.Enum.FROM_40_TO_49]: {
              womenSalary: 71629,
              menSalary: 83409,
              womenCount: 34,
              menCount: 63,
            },
            [AgeRange.Enum.FROM_50_TO_MORE]: {
              womenSalary: 85393,
              menSalary: 88480,
              womenCount: 8,
              menCount: 25,
            },
          },
        },
      ],
      expected: {
        favorablePopulation: "men",
        note: 39,
        resultRaw: "0.342",
      },
    },
    // TODO Ex 2
    // TODO Ex 3
    {
      remunerations: [
        {
          name: CSP.Enum.OUVRIERS,
          category: {
            [AgeRange.Enum.LESS_THAN_30]: {
              womenCount: 4,
              menCount: 0,
            },
            [AgeRange.Enum.FROM_30_TO_39]: {
              womenCount: 4,
              menCount: 1,
            },
            [AgeRange.Enum.FROM_40_TO_49]: {
              womenSalary: 2555.81,
              menSalary: 2249.36,
              womenCount: 6,
              menCount: 3,
            },
            [AgeRange.Enum.FROM_50_TO_MORE]: {
              womenSalary: 1920.05,
              menSalary: 2198.55,
              womenCount: 4,
              menCount: 11,
            },
          },
        },
        {
          name: CSP.Enum.EMPLOYES,
          category: {
            [AgeRange.Enum.LESS_THAN_30]: {
              womenSalary: 2123.95,
              menSalary: 2253.96,
              womenCount: 58,
              menCount: 11,
            },
            [AgeRange.Enum.FROM_30_TO_39]: {
              womenSalary: 1758.84,
              menSalary: 2297.85,
              womenCount: 82,
              menCount: 9,
            },
            [AgeRange.Enum.FROM_40_TO_49]: {
              womenSalary: 2203.81,
              menSalary: 1789.14,
              womenCount: 82,
              menCount: 7,
            },
            [AgeRange.Enum.FROM_50_TO_MORE]: {
              womenSalary: 2132.58,
              menSalary: 2275.37,
              womenCount: 88,
              menCount: 17,
            },
          },
        },
        {
          name: CSP.Enum.TECHNICIENS_AGENTS_MAITRISES,
          category: {
            [AgeRange.Enum.LESS_THAN_30]: {
              womenSalary: 2860.86,
              menSalary: 2200.69,
              womenCount: 15,
              menCount: 3,
            },
            [AgeRange.Enum.FROM_30_TO_39]: {
              womenSalary: 2662.51,
              menSalary: 2961.86,
              womenCount: 27,
              menCount: 4,
            },
            [AgeRange.Enum.FROM_40_TO_49]: {
              womenSalary: 2732.01,
              menSalary: 2467.94,
              womenCount: 20,
              menCount: 6,
            },
            [AgeRange.Enum.FROM_50_TO_MORE]: {
              womenSalary: 2489.21,
              menSalary: 1741.63,
              womenCount: 25,
              menCount: 3,
            },
          },
        },
        {
          name: CSP.Enum.INGENIEURS_CADRES,
          category: {
            [AgeRange.Enum.LESS_THAN_30]: {
              womenCount: 4,
              menCount: 0,
            },
            [AgeRange.Enum.FROM_30_TO_39]: {
              womenSalary: 4050.38,
              menSalary: 7397.23,
              womenCount: 12,
              menCount: 3,
            },
            [AgeRange.Enum.FROM_40_TO_49]: {
              womenSalary: 4154.09,
              menSalary: 3959.63,
              womenCount: 18,
              menCount: 6,
            },
            [AgeRange.Enum.FROM_50_TO_MORE]: {
              womenSalary: 5386.39,
              menSalary: 7351.85,
              womenCount: 16,
              menCount: 15,
            },
          },
        },
      ],
      expected: {
        favorablePopulation: "men",
        note: 39,
        resultRaw: "0.112",
      },
    },
    {
      remunerations: [
        {
          name: CSP.Enum.OUVRIERS,
          category: {
            [AgeRange.Enum.LESS_THAN_30]: {
              womenCount: 0,
              menCount: 0,
            },
            [AgeRange.Enum.FROM_30_TO_39]: {
              womenCount: 0,
              menCount: 0,
            },
            [AgeRange.Enum.FROM_40_TO_49]: {
              womenCount: 0,
              menCount: 0,
            },
            [AgeRange.Enum.FROM_50_TO_MORE]: {
              womenCount: 0,
              menCount: 0,
            },
          },
        },
        {
          name: CSP.Enum.EMPLOYES,
          category: {
            [AgeRange.Enum.LESS_THAN_30]: {
              womenSalary: 21871,
              menSalary: 22509,
              womenCount: 50,
              menCount: 39,
            },
            [AgeRange.Enum.FROM_30_TO_39]: {
              womenSalary: 22605,
              menSalary: 23633,
              womenCount: 41,
              menCount: 38,
            },
            [AgeRange.Enum.FROM_40_TO_49]: {
              womenSalary: 23056,
              menSalary: 23856,
              womenCount: 33,
              menCount: 16,
            },
            [AgeRange.Enum.FROM_50_TO_MORE]: {
              womenSalary: 22947,
              menSalary: 25380,
              womenCount: 21,
              menCount: 11,
            },
          },
        },
        {
          name: CSP.Enum.TECHNICIENS_AGENTS_MAITRISES,
          category: {
            [AgeRange.Enum.LESS_THAN_30]: {
              womenCount: 0,
              menCount: 2,
            },
            [AgeRange.Enum.FROM_30_TO_39]: {
              womenCount: 1,
              menCount: 6,
            },
            [AgeRange.Enum.FROM_40_TO_49]: {
              womenCount: 2,
              menCount: 4,
            },
            [AgeRange.Enum.FROM_50_TO_MORE]: {
              womenCount: 2,
              menCount: 7,
            },
          },
        },
        {
          name: CSP.Enum.INGENIEURS_CADRES,
          category: {
            [AgeRange.Enum.LESS_THAN_30]: {
              womenCount: 0,
              menCount: 1,
            },
            [AgeRange.Enum.FROM_30_TO_39]: {
              womenCount: 0,
              menCount: 2,
            },
            [AgeRange.Enum.FROM_40_TO_49]: {
              womenSalary: 86824,
              menSalary: 65577,
              womenCount: 3,
              menCount: 4,
            },
            [AgeRange.Enum.FROM_50_TO_MORE]: {
              womenCount: 0,
              menCount: 2,
            },
          },
        },
      ],
      expected: {
        favorablePopulation: "women",
        note: 39,
        resultRaw: "-0.176",
      },
    },
    // TODO Ex 6
    {
      remunerations: [
        {
          name: CSP.Enum.OUVRIERS,
          category: {
            [AgeRange.Enum.LESS_THAN_30]: {
              womenCount: 2,
              menCount: 40,
            },
            [AgeRange.Enum.FROM_30_TO_39]: {
              womenSalary: 24874,
              menSalary: 25058,
              womenCount: 13,
              menCount: 124,
            },
            [AgeRange.Enum.FROM_40_TO_49]: {
              womenSalary: 24951,
              menSalary: 25102,
              womenCount: 9,
              menCount: 89,
            },
            [AgeRange.Enum.FROM_50_TO_MORE]: {
              womenSalary: 25009,
              menSalary: 25168,
              womenCount: 4,
              menCount: 82,
            },
          },
        },
        {
          name: CSP.Enum.EMPLOYES,
          category: {
            [AgeRange.Enum.LESS_THAN_30]: {
              womenSalary: 23690,
              menSalary: 24267,
              womenCount: 6,
              menCount: 12,
            },
            [AgeRange.Enum.FROM_30_TO_39]: {
              womenSalary: 23861,
              menSalary: 26144,
              womenCount: 9,
              menCount: 24,
            },
            [AgeRange.Enum.FROM_40_TO_49]: {
              womenSalary: 26346,
              menSalary: 26936,
              womenCount: 6,
              menCount: 16,
            },
            [AgeRange.Enum.FROM_50_TO_MORE]: {
              womenSalary: 29244,
              menSalary: 25609,
              womenCount: 4,
              menCount: 11,
            },
          },
        },
        {
          name: CSP.Enum.TECHNICIENS_AGENTS_MAITRISES,
          category: {
            [AgeRange.Enum.LESS_THAN_30]: {
              womenCount: 4,
              menCount: 1,
            },
            [AgeRange.Enum.FROM_30_TO_39]: {
              womenCount: 0,
              menCount: 4,
            },
            [AgeRange.Enum.FROM_40_TO_49]: {
              womenCount: 1,
              menCount: 7,
            },
            [AgeRange.Enum.FROM_50_TO_MORE]: {
              womenSalary: 41192,
              menSalary: 42888,
              womenCount: 4,
              menCount: 9,
            },
          },
        },
        {
          name: CSP.Enum.INGENIEURS_CADRES,
          category: {
            [AgeRange.Enum.LESS_THAN_30]: {
              womenCount: 0,
              menCount: 0,
            },
            [AgeRange.Enum.FROM_30_TO_39]: {
              womenCount: 0,
              menCount: 0,
            },
            [AgeRange.Enum.FROM_40_TO_49]: {
              womenCount: 0,
              menCount: 0,
            },
            [AgeRange.Enum.FROM_50_TO_MORE]: {
              womenCount: 0,
              menCount: 0,
            },
          },
        },
      ],
      expected: {
        favorablePopulation: "equality",
        note: 40,
        resultRaw: "-0.035",
      },
    },
  ])("%#) Vérifier le calcul sur computerHelper", ({ remunerations, expected }) => {
    const result = computerHelper({
      effectifs: {
        workforceRange: CompanyWorkforceRange.Enum.FROM_251_TO_999,
        // @ts-ignore
        csp: remunerations.reduce((obj, item) => {
          return {
            ...obj,
            [item.name]: {
              ageRanges: {
                ":29": {
                  women: item.category[AgeRange.Enum.LESS_THAN_30]?.womenCount ?? "",
                  men: item.category[AgeRange.Enum.LESS_THAN_30]?.menCount ?? "",
                },
                "30:39": {
                  women: item.category[AgeRange.Enum.FROM_30_TO_39]?.womenCount ?? "",
                  men: item.category[AgeRange.Enum.FROM_30_TO_39]?.menCount ?? "",
                },
                "40:49": {
                  women: item.category[AgeRange.Enum.FROM_40_TO_49]?.womenCount ?? "",
                  men: item.category[AgeRange.Enum.FROM_40_TO_49]?.menCount ?? "",
                },
                "50:": {
                  women: item.category[AgeRange.Enum.FROM_50_TO_MORE]?.womenCount ?? "",
                  men: item.category[AgeRange.Enum.FROM_50_TO_MORE]?.menCount ?? "",
                },
              },
            },
          };
        }, {}),
      },
      indicateur1: {
        mode: RemunerationsMode.Enum.CSP,
        remunerations,
      },
      indicateur2: {
        calculable: "non",
      },
      indicateur3: {
        calculable: "non",
      },
      indicateur4: {
        calculable: false,
      },
      indicateur5: {
        women: 5,
        men: 5,
      },
    });
    expect(result.computerIndicateurUn?.computed?.favorablePopulation).toBe(expected.favorablePopulation);
    expect(result.computerIndicateurUn?.computed?.note).toBe(expected.note);
    expect(result.computerIndicateurUn?.computed?.resultRaw.toFixed(3)).toBe(expected.resultRaw);
  });
});
