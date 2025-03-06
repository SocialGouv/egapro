/* eslint-disable @typescript-eslint/ban-ts-comment */
import { CSP } from "@common/core-domain/domain/valueObjects/CSP";
import { AgeRange } from "@common/core-domain/domain/valueObjects/declaration/AgeRange";
import { CompanyWorkforceRange } from "@common/core-domain/domain/valueObjects/declaration/CompanyWorkforceRange";
import { RemunerationsMode } from "@common/core-domain/domain/valueObjects/declaration/indicators/RemunerationsMode";

import { computerHelper } from "../computerHelper";

describe("Test calculation", () => {
  it.each([
    // Ex 1
    {
      effectifs: {
        workforceRange: CompanyWorkforceRange.Enum.FROM_251_TO_999,
        csp: {
          [CSP.Enum.OUVRIERS]: {
            ageRanges: {
              [AgeRange.Enum.LESS_THAN_30]: {
                women: 1245,
                men: 1680,
              },
              [AgeRange.Enum.FROM_30_TO_39]: {
                women: 1270,
                men: 1733,
              },
              [AgeRange.Enum.FROM_40_TO_49]: {
                women: 872,
                men: 852,
              },
              [AgeRange.Enum.FROM_50_TO_MORE]: {
                women: 351,
                men: 369,
              },
            },
          },
          [CSP.Enum.EMPLOYES]: {
            ageRanges: {
              [AgeRange.Enum.LESS_THAN_30]: {
                women: 13,
                men: 39,
              },
              [AgeRange.Enum.FROM_30_TO_39]: {
                women: 37,
                men: 110,
              },
              [AgeRange.Enum.FROM_40_TO_49]: {
                women: 14,
                men: 46,
              },
              [AgeRange.Enum.FROM_50_TO_MORE]: {
                women: 5,
                men: 16,
              },
            },
          },
          [CSP.Enum.TECHNICIENS_AGENTS_MAITRISES]: {
            ageRanges: {
              [AgeRange.Enum.LESS_THAN_30]: {
                women: 38,
                men: 92,
              },
              [AgeRange.Enum.FROM_30_TO_39]: {
                women: 40,
                men: 122,
              },
              [AgeRange.Enum.FROM_40_TO_49]: {
                women: 27,
                men: 60,
              },
              [AgeRange.Enum.FROM_50_TO_MORE]: {
                women: 9,
                men: 26,
              },
            },
          },
          [CSP.Enum.INGENIEURS_CADRES]: {
            ageRanges: {
              [AgeRange.Enum.LESS_THAN_30]: {
                women: 169,
                men: 196,
              },
              [AgeRange.Enum.FROM_30_TO_39]: {
                women: 99,
                men: 144,
              },
              [AgeRange.Enum.FROM_40_TO_49]: {
                women: 34,
                men: 63,
              },
              [AgeRange.Enum.FROM_50_TO_MORE]: {
                women: 8,
                men: 25,
              },
            },
          },
        },
      },
      indicateur1: {
        mode: RemunerationsMode.Enum.CSP,
        remunerations: [
          {
            name: CSP.Enum.OUVRIERS,
            category: {
              [AgeRange.Enum.LESS_THAN_30]: {
                womenSalary: 22434,
                menSalary: 22553,
              },
              [AgeRange.Enum.FROM_30_TO_39]: {
                womenSalary: 23222,
                menSalary: 23131,
              },
              [AgeRange.Enum.FROM_40_TO_49]: {
                womenSalary: 23138,
                menSalary: 22914,
              },
              [AgeRange.Enum.FROM_50_TO_MORE]: {
                womenSalary: 23323,
                menSalary: 23159,
              },
            },
          },
          {
            name: CSP.Enum.EMPLOYES,
            category: {
              [AgeRange.Enum.LESS_THAN_30]: {
                womenSalary: 33777,
                menSalary: 35204,
              },
              [AgeRange.Enum.FROM_30_TO_39]: {
                womenSalary: 32075,
                menSalary: 33560,
              },
              [AgeRange.Enum.FROM_40_TO_49]: {
                womenSalary: 33428,
                menSalary: 34517,
              },
              [AgeRange.Enum.FROM_50_TO_MORE]: {
                womenSalary: 32466,
                menSalary: 34150,
              },
            },
          },
          {
            name: CSP.Enum.TECHNICIENS_AGENTS_MAITRISES,
            category: {
              [AgeRange.Enum.LESS_THAN_30]: {
                womenSalary: 30794,
                menSalary: 34658,
              },
              [AgeRange.Enum.FROM_30_TO_39]: {
                womenSalary: 34658,
                menSalary: 34500,
              },
              [AgeRange.Enum.FROM_40_TO_49]: {
                womenSalary: 31724,
                menSalary: 35025,
              },
              [AgeRange.Enum.FROM_50_TO_MORE]: {
                womenSalary: 35171,
                menSalary: 33728,
              },
            },
          },
          {
            name: CSP.Enum.INGENIEURS_CADRES,
            category: {
              [AgeRange.Enum.LESS_THAN_30]: {
                womenSalary: 48526,
                menSalary: 52050,
              },
              [AgeRange.Enum.FROM_30_TO_39]: {
                womenSalary: 61779,
                menSalary: 65804,
              },
              [AgeRange.Enum.FROM_40_TO_49]: {
                womenSalary: 71629,
                menSalary: 83409,
              },
              [AgeRange.Enum.FROM_50_TO_MORE]: {
                womenSalary: 85393,
                menSalary: 88480,
              },
            },
          },
        ],
      },
      indicateur2: {
        calculable: "oui",
        pourcentages: {
          [CSP.Enum.OUVRIERS]: {
            women: 97.5,
            men: 97.4,
          },
          [CSP.Enum.EMPLOYES]: {
            women: 92.8,
            men: 92.4,
          },
          [CSP.Enum.TECHNICIENS_AGENTS_MAITRISES]: {
            women: 95.6,
            men: 93,
          },
          [CSP.Enum.INGENIEURS_CADRES]: {
            women: 49.7,
            men: 59.6,
          },
        },
      },
      indicateur3: {
        calculable: "oui",
        pourcentages: {
          [CSP.Enum.OUVRIERS]: {
            women: 1.8,
            men: 2.4,
          },
          [CSP.Enum.EMPLOYES]: {
            women: 0,
            men: 6.2,
          },
          [CSP.Enum.TECHNICIENS_AGENTS_MAITRISES]: {
            women: 1.8,
            men: 2.7,
          },
          [CSP.Enum.INGENIEURS_CADRES]: {
            women: 20.6,
            men: 21.7,
          },
        },
      },
      indicateur4: {
        calculable: true,
        count: {
          total: 286,
          raised: 286,
        },
      },
      indicateur5: {
        women: 2,
        men: 8,
      },
      resultIndicateur1: {
        favorablePopulation: "men",
        note: 39,
        result: 0.3,
      },
      resultIndicateur2: {
        favorablePopulation: "men",
        note: 20,
        result: 0.5,
      },
      resultIndicateur3: {
        favorablePopulation: "men",
        note: 15,
        result: 0.8,
      },
      resultIndicateur4: {
        favorablePopulation: "women",
        note: 15,
        result: 1,
      },
      resultIndicateur5: {
        favorablePopulation: "men",
        note: 5,
        result: 2,
      },
      result: {
        favorablePopulation: "equality",
        note: 94,
      },
    },
    // Ex 2
    {
      effectifs: {
        workforceRange: "251:999",
        csp: {
          ouv: {
            ageRanges: {
              ":29": {
                women: 0,
                men: 0,
              },
              "30:39": {
                women: 0,
                men: 0,
              },
              "40:49": {
                women: 0,
                men: 0,
              },
              "50:": {
                women: 0,
                men: 0,
              },
            },
          },
          emp: {
            ageRanges: {
              ":29": {
                women: 1,
                men: 2,
              },
              "30:39": {
                women: 0,
                men: 2,
              },
              "40:49": {
                women: 1,
                men: 1,
              },
              "50:": {
                women: 0,
                men: 0,
              },
            },
          },
          tam: {
            ageRanges: {
              ":29": {
                women: 0,
                men: 1,
              },
              "30:39": {
                women: 0,
                men: 0,
              },
              "40:49": {
                women: 0,
                men: 0,
              },
              "50:": {
                women: 0,
                men: 0,
              },
            },
          },
          ic: {
            ageRanges: {
              ":29": {
                women: 67,
                men: 101,
              },
              "30:39": {
                women: 109,
                men: 257,
              },
              "40:49": {
                women: 33,
                men: 130,
              },
              "50:": {
                women: 15,
                men: 43,
              },
            },
          },
        },
      },
      indicateur1: {
        mode: "niveau_branche",
        remunerations: [
          {
            name: "95",
            category: {
              ":29": {
                womenCount: 0,
                menCount: 2,
              },
              "30:39": {
                womenCount: 0,
                menCount: 2,
              },
              "40:49": {
                womenCount: 0,
                menCount: 0,
              },
              "50:": {
                womenCount: 0,
                menCount: 0,
              },
            },
          },
          {
            name: "100",
            category: {
              ":29": {
                womenCount: 9,
                menCount: 22,
                womenSalary: 36895,
                menSalary: 37611,
              },
              "30:39": {
                womenCount: 4,
                menCount: 4,
                womenSalary: 41497,
                menSalary: 36276,
              },
              "40:49": {
                womenCount: 0,
                menCount: 1,
              },
              "50:": {
                womenCount: 0,
                menCount: 0,
              },
            },
          },
          {
            name: "105",
            category: {
              ":29": {
                womenCount: 12,
                menCount: 8,
                womenSalary: 41019,
                menSalary: 40839,
              },
              "30:39": {
                womenCount: 0,
                menCount: 0,
              },
              "40:49": {
                womenCount: 0,
                menCount: 0,
              },
              "50:": {
                womenCount: 0,
                menCount: 0,
              },
            },
          },
          {
            name: "115",
            category: {
              ":29": {
                womenCount: 28,
                menCount: 38,
                womenSalary: 42020,
                menSalary: 40320,
              },
              "30:39": {
                womenCount: 17,
                menCount: 37,
                womenSalary: 43788,
                menSalary: 41784,
              },
              "40:49": {
                womenCount: 0,
                menCount: 2,
              },
              "50:": {
                womenCount: 2,
                menCount: 0,
              },
            },
          },
          {
            name: "130",
            category: {
              ":29": {
                womenCount: 16,
                menCount: 29,
                womenSalary: 47952,
                menSalary: 45861,
              },
              "30:39": {
                womenCount: 43,
                menCount: 85,
                womenSalary: 50611,
                menSalary: 49531,
              },
              "40:49": {
                womenCount: 6,
                menCount: 20,
                womenSalary: 49961,
                menSalary: 47088,
              },
              "50:": {
                womenCount: 3,
                menCount: 3,
                womenSalary: 46233,
                menSalary: 52704,
              },
            },
          },
          {
            name: "150",
            category: {
              ":29": {
                womenCount: 2,
                menCount: 2,
              },
              "30:39": {
                womenCount: 35,
                menCount: 91,
                womenSalary: 57770,
                menSalary: 58655,
              },
              "40:49": {
                womenCount: 13,
                menCount: 51,
                womenSalary: 59822,
                menSalary: 56332,
              },
              "50:": {
                womenCount: 5,
                menCount: 13,
                womenSalary: 67194,
                menSalary: 56588,
              },
            },
          },
          {
            name: "170",
            category: {
              ":29": {
                womenCount: 0,
                menCount: 0,
              },
              "30:39": {
                womenCount: 9,
                menCount: 33,
                womenSalary: 67639,
                menSalary: 71242,
              },
              "40:49": {
                womenCount: 9,
                menCount: 39,
                womenSalary: 70872,
                menSalary: 73402,
              },
              "50:": {
                womenCount: 5,
                menCount: 21,
                womenSalary: 91193,
                menSalary: 76232,
              },
            },
          },
          {
            name: "210",
            category: {
              ":29": {
                womenCount: 0,
                menCount: 0,
              },
              "30:39": {
                womenCount: 1,
                menCount: 5,
              },
              "40:49": {
                womenCount: 5,
                menCount: 13,
                womenSalary: 100858,
                menSalary: 111745,
              },
              "50:": {
                womenCount: 0,
                menCount: 6,
              },
            },
          },
          {
            name: "270",
            category: {
              ":29": {
                womenCount: 0,
                menCount: 0,
              },
              "30:39": {
                womenCount: 0,
                menCount: 0,
              },
              "40:49": {
                womenCount: 0,
                menCount: 4,
              },
              "50:": {
                womenCount: 0,
                menCount: 0,
              },
            },
          },
          {
            name: "310",
            category: {
              ":29": {
                womenCount: 1,
                menCount: 0,
              },
              "30:39": {
                womenCount: 0,
                menCount: 0,
              },
              "40:49": {
                womenCount: 0,
                menCount: 0,
              },
              "50:": {
                womenCount: 0,
                menCount: 0,
              },
            },
          },
          {
            name: "355",
            category: {
              ":29": {
                womenCount: 0,
                menCount: 3,
              },
              "30:39": {
                womenCount: 0,
                menCount: 2,
              },
              "40:49": {
                womenCount: 1,
                menCount: 1,
              },
              "50:": {
                womenCount: 0,
                menCount: 0,
              },
            },
          },
        ],
      },
      indicateur2: {
        calculable: "oui",
        pourcentages: {
          ic: {
            women: 76,
            men: 80,
          },
        },
      },
      indicateur3: {
        calculable: "oui",
        pourcentages: {
          ic: {
            women: 19,
            men: 18,
          },
        },
      },
      indicateur4: {
        calculable: true,
        count: {
          total: 10,
          raised: 10,
        },
      },
      indicateur5: {
        women: 1,
        men: 9,
      },
      resultIndicateur1: {
        favorablePopulation: "women",
        note: 38,
        result: 1.8,
      },
      resultIndicateur2: {
        favorablePopulation: "men",
        note: 20,
        result: 4.0,
      },
      resultIndicateur3: {
        favorablePopulation: "women",
        note: 15,
        result: 1.0,
      },
      resultIndicateur4: {
        favorablePopulation: "women",
        note: 15,
        result: 1,
      },
      resultIndicateur5: {
        favorablePopulation: "men",
        note: 0,
        result: 1,
      },
      result: {
        favorablePopulation: "equality",
        note: 88,
      },
    },
    // Ex 3
    {
      effectifs: {
        workforceRange: "251:999",
        csp: {
          ouv: {
            ageRanges: {
              ":29": {
                women: 0,
                men: 0,
              },
              "30:39": {
                women: 0,
                men: 0,
              },
              "40:49": {
                women: 0,
                men: 0,
              },
              "50:": {
                women: 0,
                men: 0,
              },
            },
          },
          emp: {
            ageRanges: {
              ":29": {
                women: 5,
                men: 1,
              },
              "30:39": {
                women: 29,
                men: 0,
              },
              "40:49": {
                women: 36,
                men: 1,
              },
              "50:": {
                women: 40,
                men: 7,
              },
            },
          },
          tam: {
            ageRanges: {
              ":29": {
                women: 8,
                men: 7,
              },
              "30:39": {
                women: 27,
                men: 11,
              },
              "40:49": {
                women: 17,
                men: 2,
              },
              "50:": {
                women: 17,
                men: 1,
              },
            },
          },
          ic: {
            ageRanges: {
              ":29": {
                women: 3,
                men: 0,
              },
              "30:39": {
                women: 20,
                men: 9,
              },
              "40:49": {
                women: 23,
                men: 11,
              },
              "50:": {
                women: 43,
                men: 13,
              },
            },
          },
        },
      },
      indicateur1: {
        mode: "niveau_branche",
        remunerations: [
          {
            name: "NON CADRES ADMINISTRATIF",
            category: {
              ":29": {
                womenCount: 1,
                menCount: 1,
              },
              "30:39": {
                womenCount: 5,
                menCount: 0,
              },
              "40:49": {
                womenCount: 7,
                menCount: 0,
              },
              "50:": {
                womenCount: 5,
                menCount: 6,
                womenSalary: 27321,
                menSalary: 27247,
              },
            },
          },
          {
            name: "NON CADRES MÉDICO TECHNIQUE",
            category: {
              ":29": {
                womenCount: 4,
                menCount: 0,
              },
              "30:39": {
                womenCount: 24,
                menCount: 0,
              },
              "40:49": {
                womenCount: 29,
                menCount: 1,
              },
              "50:": {
                womenCount: 35,
                menCount: 1,
              },
            },
          },
          {
            name: "TECHNICIENS ET AGENTS DE MAITRISE ADMINISTRATIFS",
            category: {
              ":29": {
                womenCount: 0,
                menCount: 0,
              },
              "30:39": {
                womenCount: 0,
                menCount: 0,
              },
              "40:49": {
                womenCount: 1,
                menCount: 0,
              },
              "50:": {
                womenCount: 0,
                menCount: 0,
              },
            },
          },
          {
            name: "TECHNICIENS ET AGENTS DE MAITRISE MÉDICO TECHNIQUE",
            category: {
              ":29": {
                womenCount: 8,
                menCount: 7,
                womenSalary: 29902,
                menSalary: 32641,
              },
              "30:39": {
                womenCount: 27,
                menCount: 11,
                womenSalary: 32997,
                menSalary: 35052,
              },
              "40:49": {
                womenCount: 16,
                menCount: 2,
              },
              "50:": {
                womenCount: 17,
                menCount: 1,
              },
            },
          },
          {
            name: "CADRES ADMINISTRATIF",
            category: {
              ":29": {
                womenCount: 1,
                menCount: 0,
              },
              "30:39": {
                womenCount: 3,
                menCount: 4,
                womenSalary: 44255,
                menSalary: 42177,
              },
              "40:49": {
                womenCount: 7,
                menCount: 7,
                womenSalary: 40334,
                menSalary: 53408,
              },
              "50:": {
                womenCount: 10,
                menCount: 1,
              },
            },
          },
          {
            name: "CADRES MÉDICO TECHNIQUE",
            category: {
              ":29": {
                womenCount: 2,
                menCount: 0,
              },
              "30:39": {
                womenCount: 17,
                menCount: 5,
                womenSalary: 78297,
                menSalary: 70556,
              },
              "40:49": {
                womenCount: 16,
                menCount: 4,
                womenSalary: 88386,
                menSalary: 68883,
              },
              "50:": {
                womenCount: 33,
                menCount: 12,
                womenSalary: 99665,
                menSalary: 95980,
              },
            },
          },
        ],
      },
      indicateur2: {
        calculable: "oui",
        pourcentages: {
          ic: {
            women: 6.7,
            men: 21.2,
          },
        },
      },
      indicateur3: {
        calculable: "oui",
        pourcentages: {
          tam: {
            women: 13,
            men: 23.8,
          },
          ic: {
            women: 18,
            men: 24.2,
          },
        },
      },
      indicateur4: {
        calculable: true,
        count: {
          total: 7,
          raised: 7,
        },
      },
      indicateur5: {
        women: 5,
        men: 5,
      },
      resultIndicateur1: {
        favorablePopulation: "women",
        note: 38,
        result: 1.6,
      },
      resultIndicateur2: {
        favorablePopulation: "men",
        note: 20,
        result: 8.3,
      },
      resultIndicateur3: {
        favorablePopulation: "men",
        note: 15,
        result: 8.2,
      },
      resultIndicateur4: {
        favorablePopulation: "women",
        note: 15,
        result: 1,
      },
      resultIndicateur5: {
        favorablePopulation: "equality",
        note: 10,
        result: 5,
      },
      result: {
        favorablePopulation: "equality",
        note: 98,
      },
    },
    // Ex 4
    {
      effectifs: {
        workforceRange: "251:999",
        csp: {
          ouv: {
            ageRanges: {
              ":29": {
                women: 4,
                men: 0,
              },
              "30:39": {
                women: 4,
                men: 1,
              },
              "40:49": {
                women: 6,
                men: 3,
              },
              "50:": {
                women: 4,
                men: 11,
              },
            },
          },
          emp: {
            ageRanges: {
              ":29": {
                women: 58,
                men: 11,
              },
              "30:39": {
                women: 82,
                men: 9,
              },
              "40:49": {
                women: 82,
                men: 7,
              },
              "50:": {
                women: 88,
                men: 17,
              },
            },
          },
          tam: {
            ageRanges: {
              ":29": {
                women: 15,
                men: 3,
              },
              "30:39": {
                women: 27,
                men: 4,
              },
              "40:49": {
                women: 20,
                men: 6,
              },
              "50:": {
                women: 25,
                men: 3,
              },
            },
          },
          ic: {
            ageRanges: {
              ":29": {
                women: 4,
                men: 0,
              },
              "30:39": {
                women: 12,
                men: 3,
              },
              "40:49": {
                women: 18,
                men: 6,
              },
              "50:": {
                women: 16,
                men: 15,
              },
            },
          },
        },
      },
      indicateur1: {
        mode: "csp",
        remunerations: [
          {
            name: "ouv",
            category: {
              "40:49": {
                womenSalary: 2555.81,
                menSalary: 2249.36,
              },
              "50:": {
                womenSalary: 1920.05,
                menSalary: 2198.55,
              },
            },
          },
          {
            name: "emp",
            category: {
              ":29": {
                womenSalary: 2123.95,
                menSalary: 2253.96,
              },
              "30:39": {
                womenSalary: 1758.84,
                menSalary: 2297.85,
              },
              "40:49": {
                womenSalary: 2203.81,
                menSalary: 1789.14,
              },
              "50:": {
                womenSalary: 2132.58,
                menSalary: 2275.37,
              },
            },
          },
          {
            name: "tam",
            category: {
              ":29": {
                womenSalary: 2860.86,
                menSalary: 2200.69,
              },
              "30:39": {
                womenSalary: 2662.51,
                menSalary: 2961.86,
              },
              "40:49": {
                womenSalary: 2732.01,
                menSalary: 2467.94,
              },
              "50:": {
                womenSalary: 2489.21,
                menSalary: 1741.63,
              },
            },
          },
          {
            name: "ic",
            category: {
              "30:39": {
                womenSalary: 4050.38,
                menSalary: 7397.23,
              },
              "40:49": {
                womenSalary: 4154.09,
                menSalary: 3959.63,
              },
              "50:": {
                womenSalary: 5386.39,
                menSalary: 7351.85,
              },
            },
          },
        ],
      },
      indicateur2: {
        calculable: "oui",
        pourcentages: {
          ouv: {
            women: 100,
            men: 100,
          },
          emp: {
            women: 100,
            men: 100,
          },
          tam: {
            women: 98,
            men: 99,
          },
          ic: {
            women: 99.14,
            men: 96.97,
          },
        },
      },
      indicateur3: {
        calculable: "non",
      },
      indicateur4: {
        calculable: true,
        count: {
          total: 1,
          raised: 1,
        },
      },
      indicateur5: {
        women: 1,
        men: 9,
      },
      resultIndicateur1: {
        favorablePopulation: "men",
        note: 39,
        result: 0.1,
      },
      resultIndicateur2: {
        favorablePopulation: "women",
        note: 20,
        result: 0.1,
        resultRaw: -0.10209219858156049,
        remunerationsCompensated: true,
      },
      resultIndicateur3: false,
      resultIndicateur4: {
        favorablePopulation: "women",
        note: 15,
        result: 1,
        resultRaw: 1,
      },
      resultIndicateur5: {
        favorablePopulation: "men",
        note: 0,
        result: 1,
        resultRaw: 1,
      },
      result: {
        favorablePopulation: "equality",
        resultRaw: 74,
        result: 87.05882352941177,
        note: 87,
      },
    },
    // Ex 5
    {
      effectifs: {
        workforceRange: "251:999",
        csp: {
          ouv: {
            ageRanges: {
              ":29": {
                women: 0,
                men: 0,
              },
              "30:39": {
                women: 0,
                men: 0,
              },
              "40:49": {
                women: 0,
                men: 0,
              },
              "50:": {
                women: 0,
                men: 0,
              },
            },
          },
          emp: {
            ageRanges: {
              ":29": {
                women: 50,
                men: 39,
              },
              "30:39": {
                women: 41,
                men: 38,
              },
              "40:49": {
                women: 33,
                men: 16,
              },
              "50:": {
                women: 21,
                men: 11,
              },
            },
          },
          tam: {
            ageRanges: {
              ":29": {
                women: 0,
                men: 2,
              },
              "30:39": {
                women: 1,
                men: 6,
              },
              "40:49": {
                women: 2,
                men: 4,
              },
              "50:": {
                women: 2,
                men: 7,
              },
            },
          },
          ic: {
            ageRanges: {
              ":29": {
                women: 0,
                men: 1,
              },
              "30:39": {
                women: 0,
                men: 2,
              },
              "40:49": {
                women: 3,
                men: 4,
              },
              "50:": {
                women: 0,
                men: 2,
              },
            },
          },
        },
      },
      indicateur1: {
        mode: "csp",
        remunerations: [
          {
            name: "ouv",
          },
          {
            name: "emp",
            category: {
              ":29": {
                womenSalary: 21871,
                menSalary: 22509,
              },
              "30:39": {
                womenSalary: 22605,
                menSalary: 23633,
              },
              "40:49": {
                womenSalary: 23056,
                menSalary: 23856,
              },
              "50:": {
                womenSalary: 22947,
                menSalary: 25380,
              },
            },
          },
          {
            name: "tam",
          },
          {
            name: "ic",
            category: {
              "40:49": {
                womenSalary: 86824,
                menSalary: 65577,
              },
            },
          },
        ],
      },
      indicateur2: {
        calculable: "non",
      },
      indicateur3: {
        calculable: "oui",
        pourcentages: {
          emp: {
            women: 2,
            men: 6,
          },
        },
      },
      indicateur4: {
        calculable: true,
        count: {
          total: 7,
          raised: 7,
        },
      },
      indicateur5: {
        women: 3,
        men: 7,
      },
      resultIndicateur1: {
        favorablePopulation: "women",
        note: 39,
        result: 0.2,
        resultRaw: -0.17593486624313226,
      },
      resultIndicateur2: false,
      resultIndicateur3: {
        favorablePopulation: "men",
        note: 15,
        result: 4,
        resultRaw: 4,
        remunerationsCompensated: true,
      },
      resultIndicateur4: {
        favorablePopulation: "women",
        note: 15,
        result: 1,
        resultRaw: 1,
      },
      resultIndicateur5: {
        favorablePopulation: "men",
        note: 5,
        result: 3,
        resultRaw: 3,
      },
      result: {
        favorablePopulation: "equality",
        resultRaw: 74,
        result: 92.5,
        note: 93,
      },
    },
    // Ex 6
    {
      effectifs: {
        workforceRange: "251:999",
        csp: {
          ouv: {
            ageRanges: {
              ":29": {
                women: 0,
                men: 0,
              },
              "30:39": {
                women: 0,
                men: 0,
              },
              "40:49": {
                women: 0,
                men: 0,
              },
              "50:": {
                women: 0,
                men: 0,
              },
            },
          },
          emp: {
            ageRanges: {
              ":29": {
                women: 11,
                men: 54,
              },
              "30:39": {
                women: 4,
                men: 89,
              },
              "40:49": {
                women: 9,
                men: 122,
              },
              "50:": {
                women: 5,
                men: 122,
              },
            },
          },
          tam: {
            ageRanges: {
              ":29": {
                women: 0,
                men: 1,
              },
              "30:39": {
                women: 0,
                men: 3,
              },
              "40:49": {
                women: 0,
                men: 5,
              },
              "50:": {
                women: 0,
                men: 4,
              },
            },
          },
          ic: {
            ageRanges: {
              ":29": {
                women: 0,
                men: 0,
              },
              "30:39": {
                women: 0,
                men: 2,
              },
              "40:49": {
                women: 1,
                men: 4,
              },
              "50:": {
                women: 0,
                men: 4,
              },
            },
          },
        },
      },
      indicateur1: {
        mode: "niveau_branche",
        remunerations: [
          {
            name: "COEF AE 130",
            category: {
              ":29": {
                womenCount: 1,
                menCount: 4,
                womenSalary: "",
                menSalary: "",
              },
              "30:39": {
                womenCount: 0,
                menCount: 6,
                womenSalary: "",
                menSalary: "",
              },
              "40:49": {
                womenCount: 1,
                menCount: 13,
                womenSalary: "",
                menSalary: "",
              },
              "50:": {
                womenCount: 1,
                menCount: 10,
                womenSalary: "",
                menSalary: "",
              },
            },
          },
          {
            name: "COEF AE 140",
            category: {
              ":29": {
                womenCount: 10,
                menCount: 49,
                womenSalary: 20679,
                menSalary: 20679,
              },
              "30:39": {
                womenCount: 4,
                menCount: 81,
                womenSalary: 20679,
                menSalary: 20679,
              },
              "40:49": {
                womenCount: 8,
                menCount: 103,
                womenSalary: 20679,
                menSalary: 20679,
              },
              "50:": {
                womenCount: 4,
                menCount: 109,
                womenSalary: 20679,
                menSalary: 20679,
              },
            },
          },
          {
            name: "COEF AE 150",
            category: {
              ":29": {
                womenCount: 0,
                menCount: 1,
              },
              "30:39": {
                womenCount: 0,
                menCount: 2,
              },
              "40:49": {
                womenCount: 0,
                menCount: 3,
              },
              "50:": {
                womenCount: 0,
                menCount: 4,
              },
            },
          },
          {
            name: "COEF AE 160",
            category: {
              ":29": {
                womenCount: 0,
                menCount: 0,
              },
              "30:39": {
                womenCount: 0,
                menCount: 0,
              },
              "40:49": {
                womenCount: 0,
                menCount: 1,
              },
              "50:": {
                womenCount: 0,
                menCount: 0,
              },
            },
          },
          {
            name: "COEF AE 175",
            category: {
              ":29": {
                womenCount: 0,
                menCount: 1,
              },
              "30:39": {
                womenCount: 0,
                menCount: 0,
              },
              "40:49": {
                womenCount: 0,
                menCount: 1,
              },
              "50:": {
                womenCount: 0,
                menCount: 0,
              },
            },
          },
          {
            name: "COEF AM 150",
            category: {
              ":29": {
                womenCount: 0,
                menCount: 0,
              },
              "30:39": {
                womenCount: 0,
                menCount: 3,
              },
              "40:49": {
                womenCount: 0,
                menCount: 5,
              },
              "50:": {
                womenCount: 0,
                menCount: 4,
              },
            },
          },
          {
            name: "CADRE",
            category: {
              ":29": {
                womenCount: 0,
                menCount: 0,
              },
              "30:39": {
                womenCount: 0,
                menCount: 2,
              },
              "40:49": {
                womenCount: 1,
                menCount: 4,
              },
              "50:": {
                womenCount: 0,
                menCount: 4,
              },
            },
          },
        ],
      },
      indicateur2: {
        calculable: "oui",
        pourcentages: {
          emp: {
            women: 2.8,
            men: 1.6,
          },
        },
      },
      indicateur3: {
        calculable: "oui",
        pourcentages: {
          emp: {
            women: 1.6,
            men: 2.9,
          },
        },
      },
      indicateur4: {
        calculable: true,
        count: {
          total: 0,
          raised: 0,
        },
      },
      indicateur5: {
        women: 2,
        men: 8,
      },
      resultIndicateur1: {
        favorablePopulation: "equality",
        note: 40,
        result: 0,
        resultRaw: 0,
      },
      resultIndicateur2: {
        favorablePopulation: "women",
        note: 20,
        result: 1.2,
        resultRaw: -1.1999999999999997,
        remunerationsCompensated: false,
      },
      resultIndicateur3: {
        favorablePopulation: "men",
        note: 15,
        result: 1.3,
        resultRaw: 1.2999999999999998,
        remunerationsCompensated: false,
      },
      resultIndicateur4: {
        favorablePopulation: "women",
        note: 0,
        result: 0,
        resultRaw: 0,
      },
      resultIndicateur5: {
        favorablePopulation: "men",
        note: 5,
        result: 2,
        resultRaw: 2,
      },
      result: {
        favorablePopulation: "equality",
        resultRaw: 80,
        result: 94.11764705882354,
        note: 94,
      },
    },
    // Ex 6b
    {
      effectifs: {
        workforceRange: "251:999",
        csp: {
          ouv: {
            ageRanges: {
              ":29": {
                women: 2,
                men: 40,
              },
              "30:39": {
                women: 13,
                men: 124,
              },
              "40:49": {
                women: 9,
                men: 89,
              },
              "50:": {
                women: 4,
                men: 82,
              },
            },
          },
          emp: {
            ageRanges: {
              ":29": {
                women: 6,
                men: 12,
              },
              "30:39": {
                women: 9,
                men: 24,
              },
              "40:49": {
                women: 6,
                men: 16,
              },
              "50:": {
                women: 4,
                men: 11,
              },
            },
          },
          tam: {
            ageRanges: {
              ":29": {
                women: 4,
                men: 1,
              },
              "30:39": {
                women: 0,
                men: 4,
              },
              "40:49": {
                women: 1,
                men: 7,
              },
              "50:": {
                women: 4,
                men: 9,
              },
            },
          },
          ic: {
            ageRanges: {
              ":29": {
                women: 0,
                men: 0,
              },
              "30:39": {
                women: 0,
                men: 0,
              },
              "40:49": {
                women: 0,
                men: 0,
              },
              "50:": {
                women: 0,
                men: 0,
              },
            },
          },
        },
      },
      indicateur1: {
        mode: "csp",
        remunerations: [
          {
            name: "ouv",
            category: {
              "30:39": {
                womenSalary: 24874,
                menSalary: 25058,
              },
              "40:49": {
                womenSalary: 24951,
                menSalary: 25102,
              },
              "50:": {
                womenSalary: 25009,
                menSalary: 25168,
              },
            },
          },
          {
            name: "emp",
            category: {
              ":29": {
                womenSalary: 23690,
                menSalary: 24267,
              },
              "30:39": {
                womenSalary: 23861,
                menSalary: 26144,
              },
              "40:49": {
                womenSalary: 26346,
                menSalary: 26936,
              },
              "50:": {
                womenSalary: 29244,
                menSalary: 25609,
              },
            },
          },
          {
            name: "tam",
            category: {
              "50:": {
                womenSalary: 41192,
                menSalary: 42888,
              },
            },
          },
          {
            name: "ic",
          },
        ],
      },
      indicateur2: {
        calculable: "oui",
        pourcentages: {
          ouv: {
            women: 4,
            men: 4,
          },
          emp: {
            women: 16,
            men: 10,
          },
        },
      },
      indicateur3: {
        calculable: "oui",
        pourcentages: {
          ouv: {
            women: 0,
            men: 1,
          },
          emp: {
            women: 0,
            men: 3,
          },
        },
      },
      indicateur4: {
        calculable: true,
        count: {
          total: 0,
          raised: 0,
        },
      },
      indicateur5: {
        women: 2,
        men: 8,
      },
      resultIndicateur1: {
        favorablePopulation: "equality",
        note: 40,
        result: 0,
        resultRaw: -0.03493852897540067,
      },
      resultIndicateur2: {
        favorablePopulation: "women",
        note: 20,
        result: 1.2,
        resultRaw: -1.170731707317073,
        remunerationsCompensated: false,
      },
      resultIndicateur3: {
        favorablePopulation: "men",
        note: 15,
        result: 1.4,
        resultRaw: 1.3902439024390243,
        remunerationsCompensated: false,
      },
      resultIndicateur4: {
        favorablePopulation: "women",
        note: 0,
        result: 0,
        resultRaw: 0,
      },
      resultIndicateur5: {
        favorablePopulation: "men",
        note: 5,
        result: 2,
        resultRaw: 2,
      },
      result: {
        favorablePopulation: "equality",
        resultRaw: 80,
        result: 94.11764705882354,
        note: 94,
      },
    },
    // Ex 7
    {
      effectifs: {
        workforceRange: "251:999",
        csp: {
          ouv: {
            ageRanges: {
              ":29": {
                women: 0,
                men: 0,
              },
              "30:39": {
                women: 0,
                men: 0,
              },
              "40:49": {
                women: 0,
                men: 0,
              },
              "50:": {
                women: 0,
                men: 0,
              },
            },
          },
          emp: {
            ageRanges: {
              ":29": {
                women: 34,
                men: 115,
              },
              "30:39": {
                women: 37,
                men: 153,
              },
              "40:49": {
                women: 96,
                men: 150,
              },
              "50:": {
                women: 279,
                men: 193,
              },
            },
          },
          tam: {
            ageRanges: {
              ":29": {
                women: 38,
                men: 82,
              },
              "30:39": {
                women: 34,
                men: 78,
              },
              "40:49": {
                women: 41,
                men: 101,
              },
              "50:": {
                women: 64,
                men: 143,
              },
            },
          },
          ic: {
            ageRanges: {
              ":29": {
                women: 0,
                men: 0,
              },
              "30:39": {
                women: 2,
                men: 3,
              },
              "40:49": {
                women: 1,
                men: 23,
              },
              "50:": {
                women: 7,
                men: 44,
              },
            },
          },
        },
      },
      indicateur1: {
        mode: "csp",
        remunerations: [
          {
            name: "ouv",
          },
          {
            name: "emp",
            category: {
              ":29": {
                womenSalary: 22827,
                menSalary: 23623,
              },
              "30:39": {
                womenSalary: 24441,
                menSalary: 24276,
              },
              "40:49": {
                womenSalary: 24315,
                menSalary: 25179,
              },
              "50:": {
                womenSalary: 24505,
                menSalary: 25610,
              },
            },
          },
          {
            name: "tam",
            category: {
              ":29": {
                womenSalary: 26717,
                menSalary: 27014,
              },
              "30:39": {
                womenSalary: 27875,
                menSalary: 28886,
              },
              "40:49": {
                womenSalary: 31588,
                menSalary: 30387,
              },
              "50:": {
                womenSalary: 31944,
                menSalary: 30598,
              },
            },
          },
          {
            name: "ic",
            category: {
              "50:": {
                womenSalary: 67853,
                menSalary: 70951,
              },
            },
          },
        ],
      },
      indicateur2: {
        calculable: "oui",
        pourcentages: {
          emp: {
            women: 100,
            men: 100,
          },
          tam: {
            women: 100,
            men: 100,
          },
          ic: {
            women: 100,
            men: 100,
          },
        },
      },
      indicateur3: {
        calculable: "oui",
        pourcentages: {
          emp: {
            women: 2,
            men: 1.5,
          },
          tam: {
            women: 7.3,
            men: 12.9,
          },
          ic: {
            women: 10,
            men: 12.9,
          },
        },
      },
      indicateur4: {
        calculable: true,
        count: {
          total: 12,
          raised: 12,
        },
      },
      indicateur5: {
        women: 2,
        men: 8,
      },
      resultIndicateur1: {
        favorablePopulation: "equality",
        note: 40,
        result: 0,
        resultRaw: 0,
      },
      resultIndicateur2: {
        favorablePopulation: "equality",
        note: 20,
        result: 0,
        resultRaw: 0,
        remunerationsCompensated: false,
      },
      resultIndicateur3: {
        favorablePopulation: "men",
        note: 15,
        result: 1.7,
        resultRaw: 1.721245634458673,
        remunerationsCompensated: false,
      },
      resultIndicateur4: {
        favorablePopulation: "women",
        note: 15,
        result: 1,
        resultRaw: 1,
      },
      resultIndicateur5: {
        favorablePopulation: "men",
        note: 5,
        result: 2,
        resultRaw: 2,
      },
      result: {
        favorablePopulation: "equality",
        resultRaw: 95,
        result: 95,
        note: 95,
      },
    },
    // Ex 7b
  ])(
    "%#) Vérifier le calcul sur computerHelper",
    ({
      effectifs,
      indicateur1,
      indicateur2,
      indicateur3,
      indicateur4,
      indicateur5,
      resultIndicateur1,
      resultIndicateur2,
      resultIndicateur3,
      resultIndicateur4,
      resultIndicateur5,
      result,
    }) => {
      const computerHelperResult = computerHelper({
        // @ts-ignore
        effectifs,
        // @ts-ignore
        indicateur1,
        // @ts-ignore
        indicateur2,
        // @ts-ignore
        indicateur3,
        // @ts-ignore
        indicateur4,
        indicateur5,
      });

      const {
        resultIndicateurUn,
        resultIndicateurDeux,
        resultIndicateurTrois,
        resultIndicateurQuatre,
        resultIndicateurCinq,
        resultIndex,
      } = computerHelperResult;

      expect(resultIndicateurUn.favorablePopulation).toEqual(resultIndicateur1.favorablePopulation);
      expect(resultIndicateurUn.note).toEqual(resultIndicateur1.note);
      expect(resultIndicateurUn.result).toEqual(resultIndicateur1.result);

      if (typeof resultIndicateur2 !== "boolean" && resultIndicateurDeux) {
        expect(resultIndicateurDeux.favorablePopulation).toEqual(resultIndicateur2.favorablePopulation);
        expect(resultIndicateurDeux.note).toEqual(resultIndicateur2.note);
        expect(resultIndicateurDeux.result).toEqual(resultIndicateur2.result);
      }

      if (typeof resultIndicateur3 !== "boolean" && resultIndicateurTrois) {
        expect(resultIndicateurTrois.favorablePopulation).toEqual(resultIndicateur3.favorablePopulation);
        expect(resultIndicateurTrois.note).toEqual(resultIndicateur3.note);
        expect(resultIndicateurTrois.result).toEqual(resultIndicateur3.result);
      }

      if (typeof resultIndicateur4 !== "boolean" && resultIndicateurQuatre) {
        expect(resultIndicateurQuatre.favorablePopulation).toEqual(resultIndicateur4.favorablePopulation);
        expect(resultIndicateurQuatre.note).toEqual(resultIndicateur4.note);
        expect(resultIndicateurQuatre.result).toEqual(resultIndicateur4.result);
      }

      expect(resultIndicateurCinq.favorablePopulation).toEqual(resultIndicateur5.favorablePopulation);
      expect(resultIndicateurCinq.note).toEqual(resultIndicateur5.note);
      expect(resultIndicateurCinq.result).toEqual(resultIndicateur5.result);

      expect(resultIndex.favorablePopulation).toEqual(result.favorablePopulation);
      expect(resultIndex.note).toEqual(result.note);
    },
  );
});
