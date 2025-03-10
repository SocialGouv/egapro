/* eslint-disable @typescript-eslint/ban-ts-comment */
import { CSP } from "@common/core-domain/domain/valueObjects/CSP";
import { AgeRange } from "@common/core-domain/domain/valueObjects/declaration/AgeRange";
import { CompanyWorkforceRange } from "@common/core-domain/domain/valueObjects/declaration/CompanyWorkforceRange";
import { RemunerationsMode } from "@common/core-domain/domain/valueObjects/declaration/indicators/RemunerationsMode";

import { computerHelper } from "../computerHelper";

describe("Test des calculs avec plus de 250 employés dans l'entreprise", () => {
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
            women: 4.15,
            men: 4.12,
          },
          emp: {
            women: 10.21,
            men: 10.11,
          },
        },
      },
      indicateur3: {
        calculable: "oui",
        pourcentages: {
          ouv: {
            women: 1.35,
            men: 1.31,
          },
          emp: {
            women: 3.12,
            men: 3.25,
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
        favorablePopulation: "equality",
        note: 20,
        result: 0,
        resultRaw: -0.04365853658536633,
        remunerationsCompensated: false,
      },
      resultIndicateur3: {
        favorablePopulation: "equality",
        note: 15,
        result: 0,
        resultRaw: -0.0068292682926829745,
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
    // Ex 7bb
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
                women: 0,
                men: 0,
              },
              "30:39": {
                women: 3,
                men: 3,
              },
              "40:49": {
                women: 0,
                men: 7,
              },
              "50:": {
                women: 7,
                men: 3,
              },
            },
          },
          tam: {
            ageRanges: {
              ":29": {
                women: 28,
                men: 8,
              },
              "30:39": {
                women: 48,
                men: 26,
              },
              "40:49": {
                women: 46,
                men: 37,
              },
              "50:": {
                women: 130,
                men: 96,
              },
            },
          },
          ic: {
            ageRanges: {
              ":29": {
                women: 35,
                men: 36,
              },
              "30:39": {
                women: 139,
                men: 132,
              },
              "40:49": {
                women: 148,
                men: 174,
              },
              "50:": {
                women: 309,
                men: 488,
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
              "30:39": {
                womenSalary: 29449,
                menSalary: 26313,
              },
              "50:": {
                womenSalary: 30654,
                menSalary: 34752,
              },
            },
          },
          {
            name: "tam",
            category: {
              ":29": {
                womenSalary: 30486,
                menSalary: 29877,
              },
              "30:39": {
                womenSalary: 31946,
                menSalary: 32142,
              },
              "40:49": {
                womenSalary: 38193,
                menSalary: 34726,
              },
              "50:": {
                womenSalary: 47843,
                menSalary: 39653,
              },
            },
          },
          {
            name: "ic",
            category: {
              ":29": {
                womenSalary: 32342,
                menSalary: 32742,
              },
              "30:39": {
                womenSalary: 44774,
                menSalary: 39624,
              },
              "40:49": {
                womenSalary: 49523,
                menSalary: 50494,
              },
              "50:": {
                womenSalary: 62384,
                menSalary: 71503,
              },
            },
          },
        ],
      },
      indicateur2: {
        calculable: "oui",
        pourcentages: {
          emp: {
            women: 30.85,
            men: 31,
          },
          tam: {
            women: 52.13,
            men: 52.13,
          },
          ic: {
            women: 65.6,
            men: 65.65,
          },
        },
      },
      indicateur3: {
        calculable: "oui",
        pourcentages: {
          emp: {
            women: 5.34,
            men: 5.3,
          },
          tam: {
            women: 8.12,
            men: 8.13,
          },
          ic: {
            women: 10.36,
            men: 10.38,
          },
        },
      },
      indicateur4: {
        calculable: true,
        count: {
          total: 26,
          raised: 26,
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
        resultRaw: 0.045919163308680844,
      },
      resultIndicateur2: {
        favorablePopulation: "equality",
        note: 20,
        result: 0,
        resultRaw: 0.040199684708363936,
        remunerationsCompensated: false,
      },
      resultIndicateur3: {
        favorablePopulation: "equality",
        note: 15,
        result: 0,
        resultRaw: 0.017073042564373427,
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
    // Ex 8
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
                women: 30,
                men: 250,
              },
              "30:39": {
                women: 44,
                men: 735,
              },
              "40:49": {
                women: 67,
                men: 967,
              },
              "50:": {
                women: 37,
                men: 995,
              },
            },
          },
          tam: {
            ageRanges: {
              ":29": {
                women: 4,
                men: 18,
              },
              "30:39": {
                women: 10,
                men: 92,
              },
              "40:49": {
                women: 4,
                men: 140,
              },
              "50:": {
                women: 5,
                men: 94,
              },
            },
          },
          ic: {
            ageRanges: {
              ":29": {
                women: 1,
                men: 2,
              },
              "30:39": {
                women: 3,
                men: 18,
              },
              "40:49": {
                women: 3,
                men: 22,
              },
              "50:": {
                women: 1,
                men: 12,
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
            category: {},
          },
          {
            name: "emp",
            category: {
              ":29": {
                womenSalary: 21966,
                menSalary: 21456,
              },
              "30:39": {
                womenSalary: 21471,
                menSalary: 21371,
              },
              "40:49": {
                womenSalary: 21272,
                menSalary: 21159,
              },
              "50:": {
                womenSalary: 21145,
                menSalary: 21010,
              },
            },
          },
          {
            name: "tam",
            category: {
              ":29": {
                womenSalary: 25048,
                menSalary: 25874,
              },
              "30:39": {
                womenSalary: 27881,
                menSalary: 26218,
              },
              "40:49": {
                womenSalary: 24985,
                menSalary: 25867,
              },
              "50:": {
                womenSalary: 25753,
                menSalary: 25013,
              },
            },
          },
          {
            name: "ic",
            category: {
              "30:39": {
                womenSalary: 45342,
                menSalary: 36521,
              },
              "40:49": {
                womenSalary: 39947,
                menSalary: 43928,
              },
            },
          },
        ],
      },
      indicateur2: {
        calculable: "oui",
        pourcentages: {
          emp: {
            women: 0,
            men: 0,
          },
          tam: {
            women: 17.4,
            men: 1.7,
          },
        },
      },
      indicateur3: {
        calculable: "oui",
        pourcentages: {
          emp: {
            women: 6.2,
            men: 5.4,
          },
          tam: {
            women: 13,
            men: 16,
          },
        },
      },
      indicateur4: {
        calculable: true,
        count: {
          total: 5,
          raised: 0,
        },
      },
      indicateur5: {
        women: 2,
        men: 8,
      },
      resultIndicateur1: {
        favorablePopulation: "women",
        note: 39,
        result: 0.1,
        resultRaw: -0.12369610828859001,
      },
      resultIndicateur2: {
        favorablePopulation: "women",
        note: 20,
        result: 1.7,
        resultRaw: -1.650028636884307,
        remunerationsCompensated: false,
      },
      resultIndicateur3: {
        favorablePopulation: "women",
        note: 15,
        result: 0.4,
        resultRaw: -0.40063001145475363,
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
        resultRaw: 79,
        result: 79,
        note: 79,
      },
    },
    // Ex 9
    {
      effectifs: {
        workforceRange: "251:999",
        csp: {
          ouv: {
            ageRanges: {
              ":29": {
                women: 12,
                men: 16,
              },
              "30:39": {
                women: 30,
                men: 27,
              },
              "40:49": {
                women: 36,
                men: 34,
              },
              "50:": {
                women: 61,
                men: 27,
              },
            },
          },
          emp: {
            ageRanges: {
              ":29": {
                women: 3,
                men: 3,
              },
              "30:39": {
                women: 5,
                men: 1,
              },
              "40:49": {
                women: 9,
                men: 0,
              },
              "50:": {
                women: 5,
                men: 0,
              },
            },
          },
          tam: {
            ageRanges: {
              ":29": {
                women: 24,
                men: 30,
              },
              "30:39": {
                women: 27,
                men: 35,
              },
              "40:49": {
                women: 26,
                men: 14,
              },
              "50:": {
                women: 9,
                men: 22,
              },
            },
          },
          ic: {
            ageRanges: {
              ":29": {
                women: 2,
                men: 3,
              },
              "30:39": {
                women: 17,
                men: 21,
              },
              "40:49": {
                women: 5,
                men: 7,
              },
              "50:": {
                women: 5,
                men: 19,
              },
            },
          },
        },
      },
      indicateur1: {
        mode: "niveau_branche",
        remunerations: [
          {
            name: "NIVEAU 1 - ECHELON 1",
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
            name: "NIVEAU 1 - ECHELON 2",
            category: {
              ":29": {
                womenCount: 0,
                menCount: 0,
              },
              "30:39": {
                womenCount: 0,
                menCount: 1,
              },
              "40:49": {
                womenCount: 1,
                menCount: 2,
              },
              "50:": {
                womenCount: 3,
                menCount: 0,
              },
            },
          },
          {
            name: "NIVEAU 1 - ECHELON 3",
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
                womenCount: 9,
                menCount: 0,
              },
            },
          },
          {
            name: "NIVEAU 2 - ECHELON 1",
            category: {
              ":29": {
                womenCount: 1,
                menCount: 1,
              },
              "30:39": {
                womenCount: 3,
                menCount: 0,
              },
              "40:49": {
                womenCount: 0,
                menCount: 0,
              },
              "50:": {
                womenCount: 2,
                menCount: 1,
              },
            },
          },
          {
            name: "NIVEAU 2 - ECHELON 2",
            category: {
              ":29": {
                womenCount: 1,
                menCount: 1,
              },
              "30:39": {
                womenCount: 1,
                menCount: 3,
              },
              "40:49": {
                womenCount: 5,
                menCount: 6,
                womenSalary: 22765,
                menSalary: 25246,
              },
              "50:": {
                womenCount: 7,
                menCount: 4,
                womenSalary: 22272,
                menSalary: 23466,
              },
            },
          },
          {
            name: "NIVEAU 2 - ECHELON 3",
            category: {
              ":29": {
                womenCount: 1,
                menCount: 3,
              },
              "30:39": {
                womenCount: 9,
                menCount: 5,
                womenSalary: 22932,
                menSalary: 23003,
              },
              "40:49": {
                womenCount: 8,
                menCount: 5,
                womenSalary: 23004,
                menSalary: 23115,
              },
              "50:": {
                womenCount: 7,
                menCount: 9,
                womenSalary: 22692,
                menSalary: 22977,
              },
            },
          },
          {
            name: "NIVEAU 3 - ECHELON 1",
            category: {
              ":29": {
                womenCount: 2,
                menCount: 4,
              },
              "30:39": {
                womenCount: 4,
                menCount: 11,
                womenSalary: 23921,
                menSalary: 23375,
              },
              "40:49": {
                womenCount: 6,
                menCount: 12,
                womenSalary: 23442,
                menSalary: 23620,
              },
              "50:": {
                womenCount: 17,
                menCount: 8,
                womenSalary: 23524,
                menSalary: 23684,
              },
            },
          },
          {
            name: "NIVEAU 3 - ECHELON 2",
            category: {
              ":29": {
                womenCount: 8,
                menCount: 5,
                womenSalary: 24576,
                menSalary: 25098,
              },
              "30:39": {
                womenCount: 7,
                menCount: 2,
              },
              "40:49": {
                womenCount: 11,
                menCount: 2,
              },
              "50:": {
                womenCount: 14,
                menCount: 1,
              },
            },
          },
          {
            name: "NIVEAU 3 - ECHELON 3",
            category: {
              ":29": {
                womenCount: 1,
                menCount: 4,
              },
              "30:39": {
                womenCount: 6,
                menCount: 6,
                womenSalary: 24069,
                menSalary: 24416,
              },
              "40:49": {
                womenCount: 6,
                menCount: 7,
                womenSalary: 25312,
                menSalary: 24097,
              },
              "50:": {
                womenCount: 7,
                menCount: 4,
                womenSalary: 24693,
                menSalary: 24084,
              },
            },
          },
          {
            name: "NIVEAU 4 - ECHELON 1",
            category: {
              ":29": {
                womenCount: 1,
                menCount: 5,
              },
              "30:39": {
                womenCount: 3,
                menCount: 7,
                womenSalary: 26212,
                menSalary: 30752,
              },
              "40:49": {
                womenCount: 4,
                menCount: 0,
              },
              "50:": {
                womenCount: 2,
                menCount: 2,
              },
            },
          },
          {
            name: "NIVEAU 4 - ECHELON 2",
            category: {
              ":29": {
                womenCount: 13,
                menCount: 16,
                womenSalary: 28357,
                menSalary: 30140,
              },
              "30:39": {
                womenCount: 7,
                menCount: 8,
                womenSalary: 30414,
                menSalary: 29109,
              },
              "40:49": {
                womenCount: 9,
                menCount: 5,
                womenSalary: 26458,
                menSalary: 29898,
              },
              "50:": {
                womenCount: 2,
                menCount: 6,
              },
            },
          },
          {
            name: "NIVEAU 5 - ECHELON 1",
            category: {
              ":29": {
                womenCount: 1,
                menCount: 4,
              },
              "30:39": {
                womenCount: 2,
                menCount: 6,
              },
              "40:49": {
                womenCount: 5,
                menCount: 2,
              },
              "50:": {
                womenCount: 1,
                menCount: 6,
              },
            },
          },
          {
            name: "NIVEAU 5 - ECHELON 2",
            category: {
              ":29": {
                womenCount: 8,
                menCount: 2,
              },
              "30:39": {
                womenCount: 8,
                menCount: 6,
                womenSalary: 30845,
                menSalary: 31603,
              },
              "40:49": {
                womenCount: 2,
                menCount: 4,
              },
              "50:": {
                womenCount: 3,
                menCount: 1,
              },
            },
          },
          {
            name: "NIVEAU 6 - ECHELON 1",
            category: {
              ":29": {
                womenCount: 1,
                menCount: 3,
              },
              "30:39": {
                womenCount: 7,
                menCount: 7,
                womenSalary: 35098,
                menSalary: 33052,
              },
              "40:49": {
                womenCount: 6,
                menCount: 2,
              },
              "50:": {
                womenCount: 1,
                menCount: 4,
              },
            },
          },
          {
            name: "NIVEAU 6 - ECHELON 2",
            category: {
              ":29": {
                womenCount: 0,
                menCount: 0,
              },
              "30:39": {
                womenCount: 0,
                menCount: 1,
              },
              "40:49": {
                womenCount: 0,
                menCount: 1,
              },
              "50:": {
                womenCount: 0,
                menCount: 3,
              },
            },
          },
          {
            name: "NIVEAU 7 - ECHELON 1",
            category: {
              ":29": {
                womenCount: 2,
                menCount: 3,
              },
              "30:39": {
                womenCount: 7,
                menCount: 13,
                womenSalary: 42990,
                menSalary: 40022,
              },
              "40:49": {
                womenCount: 3,
                menCount: 2,
              },
              "50:": {
                womenCount: 3,
                menCount: 2,
              },
            },
          },
          {
            name: "NIVEAU 7 - ECHELON 2",
            category: {
              ":29": {
                womenCount: 0,
                menCount: 0,
              },
              "30:39": {
                womenCount: 2,
                menCount: 0,
              },
              "40:49": {
                womenCount: 1,
                menCount: 1,
              },
              "50:": {
                womenCount: 0,
                menCount: 2,
              },
            },
          },
          {
            name: "NIVEAU 8 - ECHELON 1",
            category: {
              ":29": {
                womenCount: 0,
                menCount: 0,
              },
              "30:39": {
                womenCount: 7,
                menCount: 4,
                womenSalary: 49839,
                menSalary: 49435,
              },
              "40:49": {
                womenCount: 1,
                menCount: 3,
              },
              "50:": {
                womenCount: 1,
                menCount: 4,
              },
            },
          },
          {
            name: "NIVEAU 8 - ECHELON 2",
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
                menCount: 0,
              },
              "50:": {
                womenCount: 1,
                menCount: 9,
              },
            },
          },
          {
            name: "NIVEAU 9 - ECHELON 1",
            category: {
              ":29": {
                womenCount: 0,
                menCount: 0,
              },
              "30:39": {
                womenCount: 1,
                menCount: 1,
              },
              "40:49": {
                womenCount: 0,
                menCount: 1,
              },
              "50:": {
                womenCount: 0,
                menCount: 2,
              },
            },
          },
        ],
      },
      indicateur2: {
        calculable: "oui",
        pourcentages: {
          ouv: {
            women: 0.4,
            men: 0,
          },
          tam: {
            women: 9.1,
            men: 2.1,
          },
          ic: {
            women: 17.7,
            men: 32.9,
          },
        },
      },
      indicateur3: {
        calculable: "oui",
        pourcentages: {
          ouv: {
            women: 3.3,
            men: 2.9,
          },
          tam: {
            women: 8,
            men: 21.4,
          },
          ic: {
            women: 2.5,
            men: 7.6,
          },
        },
      },
      indicateur4: {
        calculable: true,
        count: {
          total: 8,
          raised: 8,
        },
      },
      indicateur5: {
        women: 2,
        men: 8,
      },
      resultIndicateur1: {
        favorablePopulation: "men",
        note: 39,
        result: 0.8,
        resultRaw: 0.8238402120565493,
      },
      resultIndicateur2: {
        favorablePopulation: "women",
        note: 20,
        result: 0.4,
        resultRaw: -0.4035363457760317,
        remunerationsCompensated: true,
      },
      resultIndicateur3: {
        favorablePopulation: "men",
        note: 5,
        result: 5.5,
        resultRaw: 5.523575638506876,
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
        resultRaw: 84,
        result: 84,
        note: 84,
      },
    },
    // Ex 10
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
                women: 10,
                men: 1,
              },
              "30:39": {
                women: 13,
                men: 1,
              },
              "40:49": {
                women: 10,
                men: 0,
              },
              "50:": {
                women: 20,
                men: 3,
              },
            },
          },
          tam: {
            ageRanges: {
              ":29": {
                women: 149,
                men: 24,
              },
              "30:39": {
                women: 200,
                men: 35,
              },
              "40:49": {
                women: 149,
                men: 21,
              },
              "50:": {
                women: 155,
                men: 33,
              },
            },
          },
          ic: {
            ageRanges: {
              ":29": {
                women: 4,
                men: 4,
              },
              "30:39": {
                women: 42,
                men: 33,
              },
              "40:49": {
                women: 48,
                men: 31,
              },
              "50:": {
                women: 51,
                men: 33,
              },
            },
          },
        },
      },
      indicateur1: {
        mode: "niveau_branche",
        remunerations: [
          {
            name: "Non cadre",
            category: {
              ":29": {
                womenCount: 159,
                menCount: 25,
                womenSalary: 26986,
                menSalary: 26515,
              },
              "30:39": {
                womenCount: 213,
                menCount: 36,
                womenSalary: 30467,
                menSalary: 29492,
              },
              "40:49": {
                womenCount: 159,
                menCount: 21,
                womenSalary: 28666,
                menSalary: 27510,
              },
              "50:": {
                womenCount: 175,
                menCount: 36,
                womenSalary: 29526,
                menSalary: 26975,
              },
            },
          },
          {
            name: "Cadre",
            category: {
              ":29": {
                womenCount: 2,
                menCount: 1,
              },
              "30:39": {
                womenCount: 17,
                menCount: 15,
                womenSalary: 42998,
                menSalary: 44095,
              },
              "40:49": {
                womenCount: 22,
                menCount: 20,
                womenSalary: 44725,
                menSalary: 55336,
              },
              "50:": {
                womenCount: 28,
                menCount: 12,
                womenSalary: 50921,
                menSalary: 61672,
              },
            },
          },
          {
            name: "Medecin",
            category: {
              ":29": {
                womenCount: 2,
                menCount: 3,
              },
              "30:39": {
                womenCount: 25,
                menCount: 18,
                womenSalary: 58243,
                menSalary: 51717,
              },
              "40:49": {
                womenCount: 26,
                menCount: 11,
                womenSalary: 81376,
                menSalary: 83621,
              },
              "50:": {
                womenCount: 23,
                menCount: 21,
                womenSalary: 86576,
                menSalary: 92933,
              },
            },
          },
        ],
      },
      indicateur2: {
        calculable: "oui",
        pourcentages: {
          tam: {
            women: 78,
            men: 78,
          },
          ic: {
            women: 38,
            men: 34,
          },
        },
      },
      indicateur3: {
        calculable: "oui",
        pourcentages: {
          tam: {
            women: 6.9,
            men: 15.8,
          },
          ic: {
            women: 13.1,
            men: 6.9,
          },
        },
      },
      indicateur4: {
        calculable: true,
        count: {
          total: 19,
          raised: 0,
        },
      },
      indicateur5: {
        women: 6,
        men: 4,
      },
      resultIndicateur1: {
        favorablePopulation: "women",
        note: 38,
        result: 1.1,
        resultRaw: -1.0913175719976183,
      },
      resultIndicateur2: {
        favorablePopulation: "women",
        note: 20,
        result: 1,
        resultRaw: -0.9723320158102767,
        remunerationsCompensated: false,
      },
      resultIndicateur3: {
        favorablePopulation: "men",
        note: 15,
        result: 5.2,
        resultRaw: 5.2294466403162065,
        remunerationsCompensated: true,
      },
      resultIndicateur4: {
        favorablePopulation: "women",
        note: 0,
        result: 0,
        resultRaw: 0,
      },
      resultIndicateur5: {
        favorablePopulation: "women",
        note: 10,
        result: 4,
        resultRaw: 4,
      },
      result: {
        favorablePopulation: "equality",
        resultRaw: 83,
        result: 83,
        note: 83,
      },
    },
    // Ex 11
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
                women: 10,
                men: 17,
              },
              "30:39": {
                women: 15,
                men: 12,
              },
              "40:49": {
                women: 3,
                men: 11,
              },
              "50:": {
                women: 3,
                men: 5,
              },
            },
          },
          tam: {
            ageRanges: {
              ":29": {
                women: 1,
                men: 24,
              },
              "30:39": {
                women: 6,
                men: 61,
              },
              "40:49": {
                women: 3,
                men: 33,
              },
              "50:": {
                women: 1,
                men: 8,
              },
            },
          },
          ic: {
            ageRanges: {
              ":29": {
                women: 1,
                men: 3,
              },
              "30:39": {
                women: 5,
                men: 19,
              },
              "40:49": {
                women: 2,
                men: 23,
              },
              "50:": {
                women: 2,
                men: 10,
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
                womenSalary: 24496,
                menSalary: 27327,
              },
              "30:39": {
                womenSalary: 28354,
                menSalary: 26405,
              },
              "40:49": {
                womenSalary: 27073,
                menSalary: 28324,
              },
              "50:": {
                womenSalary: 27202,
                menSalary: 24753,
              },
            },
          },
          {
            name: "tam",
            category: {
              "30:39": {
                womenSalary: 33195,
                menSalary: 42157,
              },
              "40:49": {
                womenSalary: 37346,
                menSalary: 36574,
              },
            },
          },
          {
            name: "ic",
            category: {
              "30:39": {
                womenSalary: 46504,
                menSalary: 69467,
              },
            },
          },
        ],
      },
      indicateur2: {
        calculable: "oui",
        pourcentages: {
          emp: {
            women: 29,
            men: 31.1,
          },
          tam: {
            women: 72.7,
            men: 19,
          },
          ic: {
            women: 70,
            men: 25.5,
          },
        },
      },
      indicateur3: {
        calculable: "oui",
        pourcentages: {
          emp: {
            women: 6.5,
            men: 6.7,
          },
          tam: {
            women: 27.3,
            men: 8.7,
          },
          ic: {
            women: 10,
            men: 3.6,
          },
        },
      },
      indicateur4: {
        calculable: false,
      },
      indicateur5: {
        women: 0,
        men: 10,
      },
      resultIndicateur1: {
        favorablePopulation: "men",
        note: 29,
        result: 8.9,
        resultRaw: 8.886415164534471,
      },
      resultIndicateur2: {
        favorablePopulation: "women",
        note: 20,
        result: 36.3,
        resultRaw: -36.294244604316546,
        remunerationsCompensated: true,
      },
      resultIndicateur3: {
        favorablePopulation: "women",
        note: 15,
        result: 10.6,
        resultRaw: -10.607913669064748,
        remunerationsCompensated: true,
      },
      resultIndicateur4: false,
      resultIndicateur5: {
        favorablePopulation: "men",
        note: 0,
        result: 0,
        resultRaw: 0,
      },
      result: {
        favorablePopulation: "equality",
        resultRaw: 64,
        result: 75.29411764705883,
        note: 75,
      },
    },
    // Ex 12
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
                women: 97,
                men: 89,
              },
              "30:39": {
                women: 31,
                men: 25,
              },
              "40:49": {
                women: 33,
                men: 14,
              },
              "50:": {
                women: 40,
                men: 19,
              },
            },
          },
          tam: {
            ageRanges: {
              ":29": {
                women: 3,
                men: 1,
              },
              "30:39": {
                women: 2,
                men: 3,
              },
              "40:49": {
                women: 4,
                men: 3,
              },
              "50:": {
                women: 5,
                men: 8,
              },
            },
          },
          ic: {
            ageRanges: {
              ":29": {
                women: 1,
                men: 1,
              },
              "30:39": {
                women: 1,
                men: 1,
              },
              "40:49": {
                women: 4,
                men: 2,
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
                womenSalary: 161800,
                menSalary: 162100,
              },
              "30:39": {
                womenSalary: 161900,
                menSalary: 165500,
              },
              "40:49": {
                womenSalary: 163400,
                menSalary: 157700,
              },
              "50:": {
                womenSalary: 162100,
                menSalary: 170800,
              },
            },
          },
          {
            name: "tam",
            category: {
              "40:49": {
                womenSalary: 229400,
                menSalary: 246700,
              },
              "50:": {
                womenSalary: 219900,
                menSalary: 263200,
              },
            },
          },
          {
            name: "ic",
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
            women: 0,
            men: 1.4,
          },
          tam: {
            women: 0,
            men: 0,
          },
        },
      },
      indicateur4: {
        calculable: true,
        count: {
          total: 3,
          raised: 2,
        },
      },
      indicateur5: {
        women: 6,
        men: 4,
      },
      resultIndicateur1: {
        favorablePopulation: "men",
        note: 39,
        result: 0.5,
        resultRaw: 0.45783335414582615,
      },
      resultIndicateur2: false,
      resultIndicateur3: {
        favorablePopulation: "men",
        note: 15,
        result: 1.3,
        resultRaw: 1.2923076923076924,
        remunerationsCompensated: false,
      },
      resultIndicateur4: {
        favorablePopulation: "women",
        note: 0,
        result: 0.6666666666666666,
        resultRaw: 0.6666666666666666,
      },
      resultIndicateur5: {
        favorablePopulation: "women",
        note: 10,
        result: 4,
        resultRaw: 4,
      },
      result: {
        favorablePopulation: "equality",
        resultRaw: 64,
        result: 80,
        note: 80,
      },
    },
    // Ex 12
    {
      effectifs: {
        workforceRange: "251:999",
        csp: {
          ouv: {
            ageRanges: {
              ":29": {
                women: 34,
                men: 31,
              },
              "30:39": {
                women: 27,
                men: 27,
              },
              "40:49": {
                women: 34,
                men: 16,
              },
              "50:": {
                women: 27,
                men: 14,
              },
            },
          },
          emp: {
            ageRanges: {
              ":29": {
                women: 1,
                men: 0,
              },
              "30:39": {
                women: 2,
                men: 1,
              },
              "40:49": {
                women: 2,
                men: 0,
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
                men: 2,
              },
              "30:39": {
                women: 2,
                men: 4,
              },
              "40:49": {
                women: 1,
                men: 8,
              },
              "50:": {
                women: 3,
                men: 1,
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
                men: 1,
              },
              "40:49": {
                women: 3,
                men: 5,
              },
              "50:": {
                women: 0,
                men: 7,
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
              ":29": {
                womenSalary: 22752.14,
                menSalary: 26486.18,
              },
              "30:39": {
                womenSalary: 25019.9,
                menSalary: 28940.49,
              },
              "40:49": {
                womenSalary: 25893.55,
                menSalary: 29733.86,
              },
              "50:": {
                womenSalary: 26431.07,
                menSalary: 29574.84,
              },
            },
          },
          {
            name: "emp",
          },
          {
            name: "tam",
          },
          {
            name: "ic",
            category: {
              "40:49": {
                womenSalary: 60819.06,
                menSalary: 70209.01,
              },
            },
          },
        ],
      },
      indicateur2: {
        calculable: "oui",
        pourcentages: {
          ouv: {
            women: 83.6,
            men: 85.23,
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
        note: 31,
        result: 8,
        resultRaw: 8.011543574084817,
      },
      resultIndicateur2: {
        favorablePopulation: "men",
        note: 20,
        result: 1.6,
        resultRaw: 1.6300000000000094,
        remunerationsCompensated: false,
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
        resultRaw: 66,
        result: 77.6470588235294,
        note: 78,
      },
    },
    // Ex 14
    {
      effectifs: {
        workforceRange: "251:999",
        csp: {
          ouv: {
            ageRanges: {
              ":29": {
                women: 0,
                men: 4,
              },
              "30:39": {
                women: 0,
                men: 3,
              },
              "40:49": {
                women: 4,
                men: 3,
              },
              "50:": {
                women: 9,
                men: 10,
              },
            },
          },
          emp: {
            ageRanges: {
              ":29": {
                women: 47,
                men: 2,
              },
              "30:39": {
                women: 53,
                men: 1,
              },
              "40:49": {
                women: 25,
                men: 1,
              },
              "50:": {
                women: 21,
                men: 0,
              },
            },
          },
          tam: {
            ageRanges: {
              ":29": {
                women: 69,
                men: 19,
              },
              "30:39": {
                women: 55,
                men: 3,
              },
              "40:49": {
                women: 36,
                men: 7,
              },
              "50:": {
                women: 72,
                men: 3,
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
                men: 4,
              },
              "40:49": {
                women: 7,
                men: 2,
              },
              "50:": {
                women: 14,
                men: 1,
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
                womenSalary: 20075,
                menSalary: 19853,
              },
              "50:": {
                womenSalary: 20857,
                menSalary: 20268,
              },
            },
          },
          {
            name: "emp",
          },
          {
            name: "tam",
            category: {
              ":29": {
                womenSalary: 23909,
                menSalary: 23686,
              },
              "30:39": {
                womenSalary: 26106,
                menSalary: 25885,
              },
              "40:49": {
                womenSalary: 26074,
                menSalary: 26227,
              },
              "50:": {
                womenSalary: 26727,
                menSalary: 26366,
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
            women: 0,
            men: 0,
          },
          tam: {
            women: 1.7,
            men: 4.1,
          },
        },
      },
      indicateur3: {
        calculable: "oui",
        pourcentages: {
          ouv: {
            women: 0,
            men: 5,
          },
          tam: {
            women: 2.2,
            men: 3.1,
          },
        },
      },
      indicateur4: {
        calculable: false,
      },
      indicateur5: {
        women: 7,
        men: 3,
      },
      resultIndicateur1: {
        favorablePopulation: "equality",
        note: 40,
        result: 0,
        resultRaw: 0,
      },
      resultIndicateur2: {
        favorablePopulation: "men",
        note: 10,
        result: 2.1,
        resultRaw: 2.133333333333333,
        remunerationsCompensated: false,
      },
      resultIndicateur3: {
        favorablePopulation: "men",
        note: 15,
        result: 1.4,
        resultRaw: 1.3555555555555556,
        remunerationsCompensated: false,
      },
      resultIndicateur4: false,
      resultIndicateur5: {
        favorablePopulation: "women",
        note: 5,
        result: 3,
        resultRaw: 3,
      },
      result: {
        favorablePopulation: "equality",
        resultRaw: 70,
        result: 82.3529411764706,
        note: 82,
      },
    },
    // Ex 15
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
                women: 3,
                men: 2,
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
          tam: {
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
          ic: {
            ageRanges: {
              ":29": {
                women: 58,
                men: 69,
              },
              "30:39": {
                women: 78,
                men: 144,
              },
              "40:49": {
                women: 20,
                men: 58,
              },
              "50:": {
                women: 8,
                men: 20,
              },
            },
          },
        },
      },
      indicateur1: {
        mode: "niveau_branche",
        remunerations: [
          {
            name: "1.1",
            category: {
              ":29": {
                womenCount: 1,
                menCount: 3,
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
            name: "1.2",
            category: {
              ":29": {
                womenCount: 2,
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
            name: "2.1",
            category: {
              ":29": {
                womenCount: 12,
                menCount: 17,
                womenSalary: 49357.92,
                menSalary: 53440.71,
              },
              "30:39": {
                womenCount: 0,
                menCount: 2,
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
            name: "2.2",
            category: {
              ":29": {
                womenCount: 45,
                menCount: 46,
                womenSalary: 61423,
                menSalary: 65345,
              },
              "30:39": {
                womenCount: 61,
                menCount: 103,
                womenSalary: 76678,
                menSalary: 87995,
              },
              "40:49": {
                womenCount: 8,
                menCount: 25,
                womenSalary: 66357,
                menSalary: 108630,
              },
              "50:": {
                womenCount: 5,
                menCount: 6,
                womenSalary: 170070,
                menSalary: 93558,
              },
            },
          },
          {
            name: "2.3",
            category: {
              ":29": {
                womenCount: 1,
                menCount: 5,
              },
              "30:39": {
                womenCount: 4,
                menCount: 18,
                womenSalary: 84713,
                menSalary: 99123,
              },
              "40:49": {
                womenCount: 0,
                menCount: 8,
              },
              "50:": {
                womenCount: 0,
                menCount: 5,
              },
            },
          },
          {
            name: "3.1",
            category: {
              ":29": {
                womenCount: 0,
                menCount: 0,
                womenSalary: "",
                menSalary: "",
              },
              "30:39": {
                womenCount: 11,
                menCount: 15,
                womenSalary: 146494,
                menSalary: 130132,
              },
              "40:49": {
                womenCount: 9,
                menCount: 12,
                womenSalary: 173725,
                menSalary: 147653,
              },
              "50:": {
                womenCount: 3,
                menCount: 3,
                womenSalary: 174586,
                menSalary: 200666,
              },
            },
          },
          {
            name: "3.2",
            category: {
              ":29": {
                womenCount: 0,
                menCount: 0,
              },
              "30:39": {
                womenCount: 2,
                menCount: 6,
              },
              "40:49": {
                womenCount: 3,
                menCount: 9,
                womenSalary: 231946,
                menSalary: 225001,
              },
              "50:": {
                womenCount: 0,
                menCount: 6,
              },
            },
          },
          {
            name: "3.3",
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
                menCount: 3,
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
            women: 62,
            men: 75,
          },
        },
      },
      indicateur3: {
        calculable: "oui",
        pourcentages: {
          ic: {
            women: 18,
            men: 12,
          },
        },
      },
      indicateur4: {
        calculable: true,
        count: {
          total: 5,
          raised: 5,
        },
      },
      indicateur5: {
        women: 3,
        men: 7,
      },
      resultIndicateur1: {
        favorablePopulation: "men",
        note: 34,
        result: 5.7,
        resultRaw: 5.721884171018555,
      },
      resultIndicateur2: {
        favorablePopulation: "men",
        note: 0,
        result: 13,
        resultRaw: 13,
        remunerationsCompensated: false,
      },
      resultIndicateur3: {
        favorablePopulation: "women",
        note: 15,
        result: 6,
        resultRaw: -6,
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
        resultRaw: 69,
        result: 69,
        note: 69,
      },
    },
    // Ex 16
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
                women: 55,
                men: 163,
              },
              "30:39": {
                women: 56,
                men: 124,
              },
              "40:49": {
                women: 37,
                men: 75,
              },
              "50:": {
                women: 21,
                men: 40,
              },
            },
          },
          tam: {
            ageRanges: {
              ":29": {
                women: 4,
                men: 42,
              },
              "30:39": {
                women: 12,
                men: 47,
              },
              "40:49": {
                women: 3,
                men: 22,
              },
              "50:": {
                women: 7,
                men: 15,
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
        mode: "niveau_branche",
        remunerations: [
          {
            name: "TECHNIQUE - SUPPORT - ADMINISTRATION",
            category: {
              ":29": {
                womenCount: 55,
                menCount: 131,
                womenSalary: 19847,
                menSalary: 20759,
              },
              "30:39": {
                womenCount: 56,
                menCount: 74,
                womenSalary: 20073,
                menSalary: 21029,
              },
              "40:49": {
                womenCount: 34,
                menCount: 42,
                womenSalary: 19956,
                menSalary: 21100,
              },
              "50:": {
                womenCount: 16,
                menCount: 26,
                womenSalary: 19850,
                menSalary: 21257,
              },
            },
          },
          {
            name: "COMMERCIAL",
            category: {
              ":29": {
                womenCount: 0,
                menCount: 32,
              },
              "30:39": {
                womenCount: 0,
                menCount: 50,
              },
              "40:49": {
                womenCount: 3,
                menCount: 35,
                womenSalary: 29258,
                menSalary: 47428,
              },
              "50:": {
                womenCount: 5,
                menCount: 16,
                womenSalary: 38310,
                menSalary: 47142,
              },
            },
          },
          {
            name: "MANAGEMENT",
            category: {
              ":29": {
                womenCount: 4,
                menCount: 42,
                womenSalary: 22205,
                menSalary: 22821,
              },
              "30:39": {
                womenCount: 12,
                menCount: 47,
                womenSalary: 23528,
                menSalary: 24950,
              },
              "40:49": {
                womenCount: 3,
                menCount: 20,
                womenSalary: 23065,
                menSalary: 25301,
              },
              "50:": {
                womenCount: 7,
                menCount: 13,
                womenSalary: 24664,
                menSalary: 26178,
              },
            },
          },
        ],
      },
      indicateur2: {
        calculable: "oui",
        pourcentages: {
          emp: {
            women: 34,
            men: 21,
          },
          tam: {
            women: 35,
            men: 48,
          },
        },
      },
      indicateur3: {
        calculable: "oui",
        pourcentages: {
          emp: {
            women: 35,
            men: 27,
          },
          tam: {
            women: 50,
            men: 41,
          },
        },
      },
      indicateur4: {
        calculable: true,
        count: {
          total: 18,
          raised: 6,
        },
      },
      indicateur5: {
        women: 0,
        men: 10,
      },
      resultIndicateur1: {
        favorablePopulation: "men",
        note: 34,
        result: 5.4,
        resultRaw: 5.374105767869011,
      },
      resultIndicateur2: {
        favorablePopulation: "women",
        note: 20,
        result: 7.5,
        resultRaw: -7.533886583679116,
        remunerationsCompensated: true,
      },
      resultIndicateur3: {
        favorablePopulation: "women",
        note: 15,
        result: 8.2,
        resultRaw: -8.210235131396956,
        remunerationsCompensated: true,
      },
      resultIndicateur4: {
        favorablePopulation: "women",
        note: 0,
        result: 0.3333333333333333,
        resultRaw: 0.3333333333333333,
      },
      resultIndicateur5: {
        favorablePopulation: "men",
        note: 0,
        result: 0,
        resultRaw: 0,
      },
      result: {
        favorablePopulation: "equality",
        resultRaw: 69,
        result: 69,
        note: 69,
      },
    },
    // Ex 17
    {
      effectifs: {
        workforceRange: "251:999",
        csp: {
          ouv: {
            ageRanges: {
              ":29": {
                women: 28,
                men: 148,
              },
              "30:39": {
                women: 14,
                men: 87,
              },
              "40:49": {
                women: 4,
                men: 44,
              },
              "50:": {
                women: 5,
                men: 38,
              },
            },
          },
          emp: {
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
          tam: {
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
                men: 2,
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
                women: 0,
                men: 0,
              },
              "30:39": {
                women: 0,
                men: 1,
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
        },
      },
      indicateur1: {
        mode: "csp",
        remunerations: [
          {
            name: "ouv",
            category: {
              ":29": {
                womenSalary: 21142,
                menSalary: 21041,
              },
              "30:39": {
                womenSalary: 22358,
                menSalary: 21606,
              },
              "40:49": {
                womenSalary: 22116,
                menSalary: 22689,
              },
              "50:": {
                womenSalary: 22294,
                menSalary: 22294,
              },
            },
          },
          {
            name: "emp",
          },
          {
            name: "tam",
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
            women: 20,
            men: 18,
          },
        },
      },
      indicateur3: {
        calculable: "oui",
        pourcentages: {
          ouv: {
            women: 0,
            men: 3.5,
          },
        },
      },
      indicateur4: {
        calculable: true,
        count: {
          total: 2,
          raised: 0,
        },
      },
      indicateur5: {
        women: 1,
        men: 9,
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
        result: 2,
        resultRaw: -2,
        remunerationsCompensated: false,
      },
      resultIndicateur3: {
        favorablePopulation: "men",
        note: 10,
        result: 3.5,
        resultRaw: 3.5,
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
        note: 0,
        result: 1,
        resultRaw: 1,
      },
      result: {
        favorablePopulation: "equality",
        resultRaw: 70,
        result: 70,
        note: 70,
      },
    },
    // Ex 18
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
                women: 59,
                men: 11,
              },
              "30:39": {
                women: 99,
                men: 15,
              },
              "40:49": {
                women: 71,
                men: 4,
              },
              "50:": {
                women: 34,
                men: 4,
              },
            },
          },
          tam: {
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
          ic: {
            ageRanges: {
              ":29": {
                women: 1,
                men: 1,
              },
              "30:39": {
                women: 11,
                men: 10,
              },
              "40:49": {
                women: 6,
                men: 14,
              },
              "50:": {
                women: 3,
                men: 11,
              },
            },
          },
        },
      },
      indicateur1: {
        mode: "niveau_branche",
        remunerations: [
          {
            name: "EMPLOYE",
            category: {
              ":29": {
                womenCount: 56,
                menCount: 11,
                womenSalary: 20387,
                menSalary: 22956,
              },
              "30:39": {
                womenCount: 88,
                menCount: 12,
                womenSalary: 22521,
                menSalary: 24297,
              },
              "40:49": {
                womenCount: 60,
                menCount: 3,
                womenSalary: 23863,
                menSalary: 23339,
              },
              "50:": {
                womenCount: 32,
                menCount: 2,
              },
            },
          },
          {
            name: "PROFESSION INTERMEDIAIRE",
            category: {
              ":29": {
                womenCount: 3,
                menCount: 0,
              },
              "30:39": {
                womenCount: 11,
                menCount: 3,
                womenSalary: 26162,
                menSalary: 49771,
              },
              "40:49": {
                womenCount: 11,
                menCount: 1,
              },
              "50:": {
                womenCount: 2,
                menCount: 2,
              },
            },
          },
          {
            name: "CADRE",
            category: {
              ":29": {
                womenCount: 1,
                menCount: 1,
              },
              "30:39": {
                womenCount: 11,
                menCount: 8,
                womenSalary: 52315,
                menSalary: 63848,
              },
              "40:49": {
                womenCount: 6,
                menCount: 12,
                womenSalary: 54099,
                menSalary: 90053,
              },
              "50:": {
                womenCount: 3,
                menCount: 4,
                womenSalary: 57197,
                menSalary: 128305,
              },
            },
          },
          {
            name: "CADRE DIRIGEANT",
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
                womenCount: 0,
                menCount: 2,
              },
              "50:": {
                womenCount: 0,
                menCount: 7,
              },
            },
          },
        ],
      },
      indicateur2: {
        calculable: "oui",
        pourcentages: {
          emp: {
            women: 4.2,
            men: 4.2,
          },
          ic: {
            women: 23.8,
            men: 23.8,
          },
        },
      },
      indicateur3: {
        calculable: "oui",
        pourcentages: {
          emp: {
            women: 2.9,
            men: 2.9,
          },
          ic: {
            women: 27.8,
            men: 27.8,
          },
        },
      },
      indicateur4: {
        calculable: true,
        count: {
          total: 2,
          raised: 1,
        },
      },
      indicateur5: {
        women: 0,
        men: 10,
      },
      resultIndicateur1: {
        favorablePopulation: "men",
        note: 25,
        result: 10.9,
        resultRaw: 10.865287842876805,
      },
      resultIndicateur2: {
        favorablePopulation: "equality",
        note: 20,
        result: 0,
        resultRaw: 0,
        remunerationsCompensated: true,
      },
      resultIndicateur3: {
        favorablePopulation: "equality",
        note: 15,
        result: 0,
        resultRaw: 0,
        remunerationsCompensated: true,
      },
      resultIndicateur4: {
        favorablePopulation: "women",
        note: 0,
        result: 0.5,
        resultRaw: 0.5,
      },
      resultIndicateur5: {
        favorablePopulation: "men",
        note: 0,
        result: 0,
        resultRaw: 0,
      },
      result: {
        favorablePopulation: "equality",
        resultRaw: 60,
        result: 60,
        note: 60,
      },
    },
    // Ex 19
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
                women: 94,
                men: 8,
              },
              "30:39": {
                women: 77,
                men: 7,
              },
              "40:49": {
                women: 88,
                men: 7,
              },
              "50:": {
                women: 110,
                men: 12,
              },
            },
          },
          tam: {
            ageRanges: {
              ":29": {
                women: 19,
                men: 3,
              },
              "30:39": {
                women: 16,
                men: 1,
              },
              "40:49": {
                women: 15,
                men: 1,
              },
              "50:": {
                women: 10,
                men: 0,
              },
            },
          },
          ic: {
            ageRanges: {
              ":29": {
                women: 1,
                men: 0,
              },
              "30:39": {
                women: 4,
                men: 1,
              },
              "40:49": {
                women: 4,
                men: 3,
              },
              "50:": {
                women: 5,
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
          },
          {
            name: "emp",
            category: {
              ":29": {
                womenSalary: 19965,
                menSalary: 19070,
              },
              "30:39": {
                womenSalary: 20700,
                menSalary: 21001,
              },
              "40:49": {
                womenSalary: 21491,
                menSalary: 20646,
              },
              "50:": {
                womenSalary: 22193,
                menSalary: 19070,
              },
            },
          },
          {
            name: "tam",
            category: {
              ":29": {
                womenSalary: 26104,
                menSalary: 26153,
              },
            },
          },
          {
            name: "ic",
            category: {
              "40:49": {
                womenSalary: 37772,
                menSalary: 59060,
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
            women: 0.7,
            men: 0.2,
          },
        },
      },
      indicateur4: {
        calculable: true,
        count: {
          total: 2,
          raised: 1,
        },
      },
      indicateur5: {
        women: 7,
        men: 3,
      },
      resultIndicateur1: {
        favorablePopulation: "women",
        note: 37,
        result: 2.7,
        resultRaw: -2.7097708923648263,
      },
      resultIndicateur2: false,
      resultIndicateur3: {
        favorablePopulation: "women",
        note: 15,
        result: 0.5,
        resultRaw: -0.49999999999999994,
        remunerationsCompensated: false,
      },
      resultIndicateur4: {
        favorablePopulation: "women",
        note: 0,
        result: 0.5,
        resultRaw: 0.5,
      },
      resultIndicateur5: {
        favorablePopulation: "women",
        note: 5,
        result: 3,
        resultRaw: 3,
      },
      result: {
        favorablePopulation: "equality",
        resultRaw: 57,
        result: 71.25,
        note: 71,
      },
    },
    // Ex 20
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
                women: 111,
                men: 5,
              },
              "30:39": {
                women: 71,
                men: 2,
              },
              "40:49": {
                women: 59,
                men: 3,
              },
              "50:": {
                women: 88,
                men: 1,
              },
            },
          },
          tam: {
            ageRanges: {
              ":29": {
                women: 0,
                men: 0,
              },
              "30:39": {
                women: 1,
                men: 0,
              },
              "40:49": {
                women: 2,
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
          },
          {
            name: "emp",
            category: {
              ":29": {
                womenSalary: 2884.27,
                menSalary: 2112.87,
              },
              "40:49": {
                womenSalary: 2895.31,
                menSalary: 2112.87,
              },
            },
          },
          {
            name: "tam",
          },
          {
            name: "ic",
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
        },
      },
      indicateur3: {
        calculable: "non",
      },
      indicateur4: {
        calculable: true,
        count: {
          total: 34,
          raised: 34,
        },
      },
      indicateur5: {
        women: 9,
        men: 1,
      },
      resultIndicateur1: {
        favorablePopulation: "women",
        note: 0,
        result: 31.7,
        resultRaw: -31.691580327158185,
      },
      resultIndicateur2: {
        favorablePopulation: "equality",
        note: 20,
        result: 0,
        resultRaw: 0,
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
        favorablePopulation: "women",
        note: 0,
        result: 1,
        resultRaw: 1,
      },
      result: {
        favorablePopulation: "equality",
        resultRaw: 35,
        result: 41.1764705882353,
        note: 41,
      },
    },
    // Ex 21
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
                women: 18,
                men: 7,
              },
              "30:39": {
                women: 9,
                men: 3,
              },
              "40:49": {
                women: 8,
                men: 0,
              },
              "50:": {
                women: 5,
                men: 1,
              },
            },
          },
          tam: {
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
          ic: {
            ageRanges: {
              ":29": {
                women: 24,
                men: 4,
              },
              "30:39": {
                women: 81,
                men: 8,
              },
              "40:49": {
                women: 112,
                men: 21,
              },
              "50:": {
                women: 103,
                men: 23,
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
                womenSalary: 21768.97,
                menSalary: 20121.78,
              },
              "30:39": {
                womenSalary: 22859.05,
                menSalary: 22587.43,
              },
            },
          },
          {
            name: "tam",
          },
          {
            name: "ic",
            category: {
              ":29": {
                womenSalary: 25370.36,
                menSalary: 24136.39,
              },
              "30:39": {
                womenSalary: 26520.28,
                menSalary: 25231.15,
              },
              "40:49": {
                womenSalary: 28149.58,
                menSalary: 27806.5,
              },
              "50:": {
                womenSalary: 28252.33,
                menSalary: 25654.32,
              },
            },
          },
        ],
      },
      indicateur2: {
        calculable: "oui",
        pourcentages: {
          emp: {
            women: 50,
            men: 46,
          },
          ic: {
            women: 19,
            men: 14,
          },
        },
      },
      indicateur3: {
        calculable: "oui",
        pourcentages: {
          emp: {
            women: 0,
            men: 0,
          },
          ic: {
            women: 4,
            men: 4,
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
        women: 9,
        men: 1,
      },
      resultIndicateur1: {
        favorablePopulation: "women",
        note: 38,
        result: 1.8,
        resultRaw: -1.7882050774686646,
      },
      resultIndicateur2: {
        favorablePopulation: "women",
        note: 10,
        result: 4.9,
        resultRaw: -4.880562060889929,
        remunerationsCompensated: false,
      },
      resultIndicateur3: {
        favorablePopulation: "equality",
        note: 15,
        result: 0,
        resultRaw: 0,
        remunerationsCompensated: true,
      },
      resultIndicateur4: {
        favorablePopulation: "women",
        note: 0,
        result: 0,
        resultRaw: 0,
      },
      resultIndicateur5: {
        favorablePopulation: "women",
        note: 0,
        result: 1,
        resultRaw: 1,
      },
      result: {
        favorablePopulation: "equality",
        resultRaw: 63,
        result: 74.11764705882354,
        note: 74,
      },
    },
    // Ex 22
    {
      effectifs: {
        workforceRange: "251:999",
        csp: {
          ouv: {
            ageRanges: {
              ":29": {
                women: 1,
                men: 73,
              },
              "30:39": {
                women: 2,
                men: 78,
              },
              "40:49": {
                women: 2,
                men: 50,
              },
              "50:": {
                women: 2,
                men: 31,
              },
            },
          },
          emp: {
            ageRanges: {
              ":29": {
                women: 7,
                men: 7,
              },
              "30:39": {
                women: 12,
                men: 0,
              },
              "40:49": {
                women: 2,
                men: 1,
              },
              "50:": {
                women: 5,
                men: 0,
              },
            },
          },
          tam: {
            ageRanges: {
              ":29": {
                women: 6,
                men: 22,
              },
              "30:39": {
                women: 9,
                men: 24,
              },
              "40:49": {
                women: 5,
                men: 13,
              },
              "50:": {
                women: 3,
                men: 10,
              },
            },
          },
          ic: {
            ageRanges: {
              ":29": {
                women: 0,
                men: 16,
              },
              "30:39": {
                women: 7,
                men: 42,
              },
              "40:49": {
                women: 4,
                men: 34,
              },
              "50:": {
                women: 1,
                men: 17,
              },
            },
          },
        },
      },
      indicateur1: {
        mode: "niveau_branche",
        remunerations: [
          {
            name: "Niveau A",
            category: {
              ":29": {
                womenCount: 2,
                menCount: 5,
              },
              "30:39": {
                womenCount: 1,
                menCount: 10,
              },
              "40:49": {
                womenCount: 1,
                menCount: 5,
              },
              "50:": {
                womenCount: 2,
                menCount: 5,
              },
            },
          },
          {
            name: "Niveau B",
            category: {
              ":29": {
                womenCount: 2,
                menCount: 3,
              },
              "30:39": {
                womenCount: 2,
                menCount: 20,
              },
              "40:49": {
                womenCount: 2,
                menCount: 10,
              },
              "50:": {
                womenCount: 2,
                menCount: 2,
              },
            },
          },
          {
            name: "Niveau C",
            category: {
              ":29": {
                womenCount: 1,
                menCount: 8,
              },
              "30:39": {
                womenCount: 2,
                menCount: 10,
              },
              "40:49": {
                womenCount: 2,
                menCount: 25,
              },
              "50:": {
                womenCount: 2,
                menCount: 15,
              },
            },
          },
          {
            name: "Niveau D",
            category: {
              ":29": {
                womenCount: 1,
                menCount: 20,
              },
              "30:39": {
                womenCount: 2,
                menCount: 30,
              },
              "40:49": {
                womenCount: 2,
                menCount: 1,
              },
              "50:": {
                womenCount: 1,
                menCount: 5,
              },
            },
          },
          {
            name: "Niveau E",
            category: {
              ":29": {
                womenCount: 2,
                menCount: 2,
              },
              "30:39": {
                womenCount: 2,
                menCount: 1,
              },
              "40:49": {
                womenCount: 2,
                menCount: 5,
              },
              "50:": {
                womenCount: 1,
                menCount: 21,
              },
            },
          },
          {
            name: "Niveau F",
            category: {
              ":29": {
                womenCount: 2,
                menCount: 15,
              },
              "30:39": {
                womenCount: 1,
                menCount: 20,
              },
              "40:49": {
                womenCount: 2,
                menCount: 0,
              },
              "50:": {
                womenCount: 2,
                menCount: 10,
              },
            },
          },
          {
            name: "Niveau G",
            category: {
              ":29": {
                womenCount: 2,
                menCount: 20,
              },
              "30:39": {
                womenCount: 1,
                menCount: 15,
              },
              "40:49": {
                womenCount: 2,
                menCount: 5,
              },
              "50:": {
                womenCount: 2,
                menCount: 2,
              },
            },
          },
          {
            name: "Niveau H",
            category: {
              ":29": {
                womenCount: 1,
                menCount: 5,
              },
              "30:39": {
                womenCount: 2,
                menCount: 5,
              },
              "40:49": {
                womenCount: 2,
                menCount: 18,
              },
              "50:": {
                womenCount: 2,
                menCount: 10,
              },
            },
          },
          {
            name: "Niveau I",
            category: {
              ":29": {
                womenCount: 2,
                menCount: 12,
              },
              "30:39": {
                womenCount: 2,
                menCount: 22,
              },
              "40:49": {
                womenCount: 2,
                menCount: 35,
              },
              "50:": {
                womenCount: 2,
                menCount: 3,
              },
            },
          },
          {
            name: "Niveau J",
            category: {
              ":29": {
                womenCount: 1,
                menCount: 3,
              },
              "30:39": {
                womenCount: 2,
                menCount: 4,
              },
              "40:49": {
                womenCount: 1,
                menCount: 5,
              },
              "50:": {
                womenCount: 1,
                menCount: 6,
              },
            },
          },
        ],
      },
      indicateur2: {
        calculable: "oui",
        pourcentages: {
          tam: {
            women: 20,
            men: 80,
          },
          ic: {
            women: 19,
            men: 81,
          },
        },
      },
      indicateur3: {
        calculable: "oui",
        pourcentages: {
          tam: {
            women: 14.29,
            men: 85.71,
          },
          ic: {
            women: 12.5,
            men: 87.5,
          },
        },
      },
      indicateur4: {
        calculable: true,
        count: {
          total: 3,
          raised: 2,
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
        favorablePopulation: "men",
        note: 0,
        result: 61.1,
        resultRaw: 61.136150234741784,
        remunerationsCompensated: false,
      },
      resultIndicateur3: {
        favorablePopulation: "men",
        note: 0,
        result: 73.5,
        resultRaw: 73.4537089201878,
        remunerationsCompensated: false,
      },
      resultIndicateur4: {
        favorablePopulation: "women",
        note: 0,
        result: 0.6666666666666666,
        resultRaw: 0.6666666666666666,
      },
      resultIndicateur5: {
        favorablePopulation: "men",
        note: 5,
        result: 2,
        resultRaw: 2,
      },
      result: {
        favorablePopulation: "equality",
        resultRaw: 5,
        result: 8.333333333333334,
        note: 8,
      },
    },
    // Ex 23
    {
      effectifs: {
        workforceRange: "251:999",
        csp: {
          ouv: {
            ageRanges: {
              ":29": {
                women: 3,
                men: 14,
              },
              "30:39": {
                women: 9,
                men: 25,
              },
              "40:49": {
                women: 0,
                men: 34,
              },
              "50:": {
                women: 0,
                men: 65,
              },
            },
          },
          emp: {
            ageRanges: {
              ":29": {
                women: 3,
                men: 3,
              },
              "30:39": {
                women: 2,
                men: 6,
              },
              "40:49": {
                women: 2,
                men: 4,
              },
              "50:": {
                women: 1,
                men: 4,
              },
            },
          },
          tam: {
            ageRanges: {
              ":29": {
                women: 2,
                men: 7,
              },
              "30:39": {
                women: 1,
                men: 3,
              },
              "40:49": {
                women: 4,
                men: 7,
              },
              "50:": {
                women: 8,
                men: 7,
              },
            },
          },
          ic: {
            ageRanges: {
              ":29": {
                women: 0,
                men: 2,
              },
              "30:39": {
                women: 0,
                men: 3,
              },
              "40:49": {
                women: 0,
                men: 6,
              },
              "50:": {
                women: 2,
                men: 13,
              },
            },
          },
        },
      },
      indicateur1: {
        mode: "csp",
      },
      indicateur2: {
        calculable: "oui",
        pourcentages: {
          ouv: {
            women: 25,
            men: 13,
          },
          tam: {
            women: 40,
            men: 33,
          },
        },
      },
      indicateur3: {
        calculable: "oui",
        pourcentages: {
          ouv: {
            women: 8,
            men: 9,
          },
          tam: {
            women: 7,
            men: 4,
          },
        },
      },
      indicateur4: {
        calculable: true,
        count: {
          total: 1,
          raised: 1,
        },
      },
      indicateur5: {
        women: 0,
        men: 10,
      },
      resultIndicateur1: {
        favorablePopulation: "equality",
        note: 40,
        result: 0,
        resultRaw: 0,
      },
      resultIndicateur2: {
        favorablePopulation: "women",
        note: 0,
        result: 11,
        resultRaw: -10.968253968253968,
        remunerationsCompensated: false,
      },
      resultIndicateur3: {
        favorablePopulation: "men",
        note: 15,
        result: 0.2,
        resultRaw: 0.17460317460317454,
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
        note: 0,
        result: 0,
        resultRaw: 0,
      },
      result: {
        favorablePopulation: "equality",
        resultRaw: 30,
        result: 50,
        note: 50,
      },
    },
    // Ex 24
    {
      effectifs: {
        workforceRange: "251:999",
        csp: {
          ouv: {
            ageRanges: {
              ":29": {
                women: 20,
                men: 0,
              },
              "30:39": {
                women: 41,
                men: 0,
              },
              "40:49": {
                women: 49,
                men: 0,
              },
              "50:": {
                women: 44,
                men: 1,
              },
            },
          },
          emp: {
            ageRanges: {
              ":29": {
                women: 2,
                men: 1,
              },
              "30:39": {
                women: 0,
                men: 1,
              },
              "40:49": {
                women: 0,
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
                women: 10,
                men: 1,
              },
              "30:39": {
                women: 14,
                men: 5,
              },
              "40:49": {
                women: 24,
                men: 3,
              },
              "50:": {
                women: 29,
                men: 2,
              },
            },
          },
          ic: {
            ageRanges: {
              ":29": {
                women: 14,
                men: 4,
              },
              "30:39": {
                women: 11,
                men: 1,
              },
              "40:49": {
                women: 13,
                men: 5,
              },
              "50:": {
                women: 21,
                men: 0,
              },
            },
          },
        },
      },
      indicateur1: {
        mode: "niveau_branche",
        remunerations: [
          {
            name: "Niveau A",
            category: {
              ":29": {
                womenCount: 9,
                menCount: 2,
              },
              "30:39": {
                womenCount: 10,
                menCount: 1,
              },
              "40:49": {
                womenCount: 10,
                menCount: 1,
              },
              "50:": {
                womenCount: 10,
                menCount: 2,
              },
            },
          },
          {
            name: "Niveau B",
            category: {
              ":29": {
                womenCount: 11,
                menCount: 0,
              },
              "30:39": {
                womenCount: 20,
                menCount: 1,
              },
              "40:49": {
                womenCount: 10,
                menCount: 1,
              },
              "50:": {
                womenCount: 10,
                menCount: 1,
              },
            },
          },
          {
            name: "Niveau C",
            category: {
              ":29": {
                womenCount: 12,
                menCount: 2,
              },
              "30:39": {
                womenCount: 10,
                menCount: 2,
              },
              "40:49": {
                womenCount: 25,
                menCount: 2,
              },
              "50:": {
                womenCount: 15,
                menCount: 1,
              },
            },
          },
          {
            name: "Niveau D",
            category: {
              ":29": {
                womenCount: 20,
                menCount: 2,
              },
              "30:39": {
                womenCount: 30,
                menCount: 1,
              },
              "40:49": {
                womenCount: 10,
                menCount: 1,
              },
              "50:": {
                womenCount: 15,
                menCount: 1,
              },
            },
          },
          {
            name: "Niveau E",
            category: {
              ":29": {
                womenCount: 16,
                menCount: 1,
              },
              "30:39": {
                womenCount: 13,
                menCount: 1,
              },
              "40:49": {
                womenCount: 15,
                menCount: 1,
              },
              "50:": {
                womenCount: 21,
                menCount: 1,
              },
            },
          },
        ],
      },
      indicateur2: {
        calculable: "oui",
        pourcentages: {
          tam: {
            women: 80,
            men: 80,
          },
          ic: {
            women: 90,
            men: 90,
          },
        },
      },
      indicateur3: {
        calculable: "oui",
        pourcentages: {
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
      indicateur4: {
        calculable: true,
        count: {
          total: 0,
          raised: 0,
        },
      },
      indicateur5: {
        women: 8,
        men: 2,
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
        favorablePopulation: "equality",
        note: 15,
        result: 0,
        resultRaw: 0,
        remunerationsCompensated: false,
      },
      resultIndicateur4: {
        favorablePopulation: "women",
        note: 0,
        result: 0,
        resultRaw: 0,
      },
      resultIndicateur5: {
        favorablePopulation: "women",
        note: 5,
        result: 2,
        resultRaw: 2,
      },
      result: {
        favorablePopulation: "equality",
        resultRaw: 40,
        result: 88.88888888888889,
        note: 89,
      },
    },
    // Ex 25
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
                women: 7,
                men: 1,
              },
              "30:39": {
                women: 12,
                men: 2,
              },
              "40:49": {
                women: 5,
                men: 0,
              },
              "50:": {
                women: 1,
                men: 0,
              },
            },
          },
          tam: {
            ageRanges: {
              ":29": {
                women: 1,
                men: 0,
              },
              "30:39": {
                women: 3,
                men: 0,
              },
              "40:49": {
                women: 0,
                men: 0,
              },
              "50:": {
                women: 2,
                men: 0,
              },
            },
          },
          ic: {
            ageRanges: {
              ":29": {
                women: 1,
                men: 0,
              },
              "30:39": {
                women: 3,
                men: 1,
              },
              "40:49": {
                women: 6,
                men: 4,
              },
              "50:": {
                women: 0,
                men: 1,
              },
            },
          },
        },
      },
      indicateur1: {
        mode: "csp",
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
        women: 6,
        men: 4,
      },
      resultIndicateur1: {
        favorablePopulation: "equality",
        note: 40,
        result: 0,
        resultRaw: 0,
      },
      resultIndicateur2: false,
      resultIndicateur3: false,
      resultIndicateur4: false,
      resultIndicateur5: {
        favorablePopulation: "women",
        note: 10,
        result: 4,
        resultRaw: 4,
      },
      result: {
        favorablePopulation: "equality",
        resultRaw: 10,
        result: 100,
        note: 100,
      },
    },
    // Ex 25b
    {
      effectifs: {
        workforceRange: "251:999",
        csp: {
          ouv: {
            ageRanges: {
              ":29": {
                women: 0,
                men: 14,
              },
              "30:39": {
                women: 1,
                men: 27,
              },
              "40:49": {
                women: 1,
                men: 45,
              },
              "50:": {
                women: 2,
                men: 69,
              },
            },
          },
          emp: {
            ageRanges: {
              ":29": {
                women: 1,
                men: 0,
              },
              "30:39": {
                women: 1,
                men: 2,
              },
              "40:49": {
                women: 1,
                men: 1,
              },
              "50:": {
                women: 10,
                men: 8,
              },
            },
          },
          tam: {
            ageRanges: {
              ":29": {
                women: 2,
                men: 2,
              },
              "30:39": {
                women: 0,
                men: 3,
              },
              "40:49": {
                women: 1,
                men: 12,
              },
              "50:": {
                women: 4,
                men: 23,
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
                men: 1,
              },
              "40:49": {
                women: 0,
                men: 6,
              },
              "50:": {
                women: 1,
                men: 16,
              },
            },
          },
        },
      },
      indicateur1: {
        mode: "csp",
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
        women: 6,
        men: 4,
      },
      resultIndicateur1: {
        favorablePopulation: "equality",
        note: 40,
        result: 0,
        resultRaw: 0,
      },
      resultIndicateur2: false,
      resultIndicateur3: false,
      resultIndicateur4: false,
      resultIndicateur5: {
        favorablePopulation: "women",
        note: 10,
        result: 4,
        resultRaw: 4,
      },
      result: {
        favorablePopulation: "equality",
        resultRaw: 10,
        result: 100,
        note: 100,
      },
    },
    // Ex 26
    {
      effectifs: {
        workforceRange: "251:999",
        csp: {
          ouv: {
            ageRanges: {
              ":29": {
                women: 1,
                men: 16,
              },
              "30:39": {
                women: 0,
                men: 23,
              },
              "40:49": {
                women: 0,
                men: 26,
              },
              "50:": {
                women: 0,
                men: 22,
              },
            },
          },
          emp: {
            ageRanges: {
              ":29": {
                women: 8,
                men: 25,
              },
              "30:39": {
                women: 13,
                men: 27,
              },
              "40:49": {
                women: 19,
                men: 21,
              },
              "50:": {
                women: 14,
                men: 12,
              },
            },
          },
          tam: {
            ageRanges: {
              ":29": {
                women: 1,
                men: 24,
              },
              "30:39": {
                women: 3,
                men: 39,
              },
              "40:49": {
                women: 1,
                men: 52,
              },
              "50:": {
                women: 0,
                men: 46,
              },
            },
          },
          ic: {
            ageRanges: {
              ":29": {
                women: 3,
                men: 8,
              },
              "30:39": {
                women: 4,
                men: 17,
              },
              "40:49": {
                women: 1,
                men: 40,
              },
              "50:": {
                women: 0,
                men: 24,
              },
            },
          },
        },
      },
      indicateur1: {
        mode: "niveau_branche",
        remunerations: [
          {
            name: "NIVEAU I",
            category: {
              ":29": {
                womenCount: 1,
                menCount: 13,
              },
              "30:39": {
                womenCount: 0,
                menCount: 15,
              },
              "40:49": {
                womenCount: 0,
                menCount: 7,
              },
              "50:": {
                womenCount: 0,
                menCount: 6,
              },
            },
          },
          {
            name: "NIVEAU II",
            category: {
              ":29": {
                womenCount: 4,
                menCount: 15,
                womenSalary: 22725.96,
                menSalary: 23912.11,
              },
              "30:39": {
                womenCount: 5,
                menCount: 19,
                womenSalary: 29010.35,
                menSalary: 26143.04,
              },
              "40:49": {
                womenCount: 11,
                menCount: 26,
                womenSalary: 27233.46,
                menSalary: 25904.64,
              },
              "50:": {
                womenCount: 5,
                menCount: 19,
                womenSalary: 29969.09,
                menSalary: 25424.95,
              },
            },
          },
          {
            name: "NIVEAU III",
            category: {
              ":29": {
                womenCount: 1,
                menCount: 17,
              },
              "30:39": {
                womenCount: 6,
                menCount: 30,
                womenSalary: 27225.97,
                menSalary: 30178.94,
              },
              "40:49": {
                womenCount: 5,
                menCount: 36,
                womenSalary: 28495.64,
                menSalary: 29124.74,
              },
              "50:": {
                womenCount: 6,
                menCount: 24,
                womenSalary: 29005.52,
                menSalary: 31125.27,
              },
            },
          },
          {
            name: "NIVEAU IV",
            category: {
              ":29": {
                womenCount: 4,
                menCount: 18,
                womenSalary: 29668.96,
                menSalary: 30902.24,
              },
              "30:39": {
                womenCount: 3,
                menCount: 23,
                womenSalary: 31491.49,
                menSalary: 34580.92,
              },
              "40:49": {
                womenCount: 2,
                menCount: 26,
              },
              "50:": {
                womenCount: 2,
                menCount: 23,
              },
            },
          },
          {
            name: "NIVEAU V",
            category: {
              ":29": {
                womenCount: 0,
                menCount: 2,
              },
              "30:39": {
                womenCount: 1,
                menCount: 2,
              },
              "40:49": {
                womenCount: 0,
                menCount: 1,
              },
              "50:": {
                womenCount: 2,
                menCount: 2,
              },
            },
          },
          {
            name: "POSITION I",
            category: {
              ":29": {
                womenCount: 2,
                menCount: 6,
              },
              "30:39": {
                womenCount: 1,
                menCount: 7,
              },
              "40:49": {
                womenCount: 2,
                menCount: 11,
              },
              "50:": {
                womenCount: 1,
                menCount: 7,
              },
            },
          },
          {
            name: "POSITION II",
            category: {
              ":29": {
                womenCount: 1,
                menCount: 2,
              },
              "30:39": {
                womenCount: 2,
                menCount: 10,
              },
              "40:49": {
                womenCount: 1,
                menCount: 32,
              },
              "50:": {
                womenCount: 0,
                menCount: 20,
              },
            },
          },
          {
            name: "POSITION III",
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
                menCount: 0,
              },
              "50:": {
                womenCount: 0,
                menCount: 3,
              },
            },
          },
        ],
      },
      indicateur2: {
        calculable: "non",
      },
      indicateur3: {
        calculable: "non",
      },
      indicateur4: {
        calculable: true,
        count: {
          total: 2,
          raised: 2,
        },
      },
      indicateur5: {
        women: 0,
        men: 10,
      },
      resultIndicateur1: {
        favorablePopulation: "equality",
        note: 40,
        result: 0,
        resultRaw: -0.001977660753364585,
      },
      resultIndicateur2: false,
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
        result: 0,
        resultRaw: 0,
      },
      result: {
        favorablePopulation: "equality",
        resultRaw: 55,
        result: 84.61538461538461,
        note: 85,
      },
    },
    // Ex 26b
    {
      effectifs: {
        workforceRange: "251:999",
        csp: {
          ouv: {
            ageRanges: {
              ":29": {
                women: 0,
                men: 1,
              },
              "30:39": {
                women: 1,
                men: 1,
              },
              "40:49": {
                women: 2,
                men: 1,
              },
              "50:": {
                women: 6,
                men: 9,
              },
            },
          },
          emp: {
            ageRanges: {
              ":29": {
                women: 65,
                men: 2,
              },
              "30:39": {
                women: 92,
                men: 3,
              },
              "40:49": {
                women: 90,
                men: 3,
              },
              "50:": {
                women: 141,
                men: 1,
              },
            },
          },
          tam: {
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
          ic: {
            ageRanges: {
              ":29": {
                women: 2,
                men: 0,
              },
              "30:39": {
                women: 8,
                men: 0,
              },
              "40:49": {
                women: 14,
                men: 1,
              },
              "50:": {
                women: 16,
                men: 5,
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
              "50:": {
                womenSalary: 26187,
                menSalary: 26418,
              },
            },
          },
          {
            name: "emp",
            category: {
              "30:39": {
                womenSalary: 22979,
                menSalary: 22048,
              },
              "40:49": {
                womenSalary: 24214,
                menSalary: 20502,
              },
            },
          },
          {
            name: "tam",
          },
          {
            name: "ic",
            category: {
              "50:": {
                womenSalary: 51807,
                menSalary: 60604,
              },
            },
          },
        ],
      },
      indicateur2: {
        calculable: "non",
      },
      indicateur3: {
        calculable: "non",
      },
      indicateur4: {
        calculable: true,
        count: {
          total: 10,
          raised: 10,
        },
      },
      indicateur5: {
        women: 8,
        men: 2,
      },
      resultIndicateur1: {
        favorablePopulation: "women",
        note: 35,
        result: 4.5,
        resultRaw: -4.549061602474579,
      },
      resultIndicateur2: false,
      resultIndicateur3: false,
      resultIndicateur4: {
        favorablePopulation: "women",
        note: 15,
        result: 1,
        resultRaw: 1,
      },
      resultIndicateur5: {
        favorablePopulation: "women",
        note: 5,
        result: 2,
        resultRaw: 2,
      },
      result: {
        favorablePopulation: "equality",
        resultRaw: 55,
        result: 84.61538461538461,
        note: 85,
      },
    },
    // Ex 27
    {
      effectifs: {
        workforceRange: "251:999",
        csp: {
          ouv: {
            ageRanges: {
              ":29": {
                women: 7,
                men: 3,
              },
              "30:39": {
                women: 20,
                men: 4,
              },
              "40:49": {
                women: 76,
                men: 4,
              },
              "50:": {
                women: 134,
                men: 29,
              },
            },
          },
          emp: {
            ageRanges: {
              ":29": {
                women: 3,
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
                women: 1,
                men: 0,
              },
            },
          },
          tam: {
            ageRanges: {
              ":29": {
                women: 0,
                men: 0,
              },
              "30:39": {
                women: 1,
                men: 1,
              },
              "40:49": {
                women: 2,
                men: 0,
              },
              "50:": {
                women: 3,
                men: 1,
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
                women: 3,
                men: 4,
              },
              "40:49": {
                women: 2,
                men: 0,
              },
              "50:": {
                women: 2,
                men: 3,
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
              ":29": {
                womenSalary: 17250.29,
                menSalary: 19010.69,
              },
              "30:39": {
                womenSalary: 17490.18,
                menSalary: 17360.06,
              },
              "40:49": {
                womenSalary: 17580.9,
                menSalary: 17390.72,
              },
              "50:": {
                womenSalary: 17690.78,
                menSalary: 18780.78,
              },
            },
          },
          {
            name: "emp",
          },
          {
            name: "tam",
          },
          {
            name: "ic",
            category: {
              "30:39": {
                womenSalary: 39970.65,
                menSalary: 42700.97,
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
          ouv: {
            women: 2.3,
            men: 0.8,
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
        women: 6,
        men: 4,
      },
      resultIndicateur1: {
        favorablePopulation: "men",
        note: 39,
        result: 0.6,
        resultRaw: 0.6457014275791317,
      },
      resultIndicateur2: false,
      resultIndicateur3: {
        favorablePopulation: "women",
        note: 15,
        result: 1.5,
        resultRaw: -1.4999999999999998,
        remunerationsCompensated: true,
      },

      resultIndicateur4: {
        favorablePopulation: "women",
        note: 0,
        result: 0,
        resultRaw: 0,
      },
      resultIndicateur5: {
        favorablePopulation: "women",
        note: 10,
        result: 4,
        resultRaw: 4,
      },
      result: {
        favorablePopulation: "equality",
        resultRaw: 64,
        result: 98.46153846153847,
        note: 98,
      },
    },
    // Ex 28
    {
      effectifs: {
        workforceRange: "251:999",
        csp: {
          ouv: {
            ageRanges: {
              ":29": {
                women: 12,
                men: 6,
              },
              "30:39": {
                women: 28,
                men: 22,
              },
              "40:49": {
                women: 33,
                men: 19,
              },
              "50:": {
                women: 41,
                men: 31,
              },
            },
          },
          emp: {
            ageRanges: {
              ":29": {
                women: 2,
                men: 1,
              },
              "30:39": {
                women: 5,
                men: 5,
              },
              "40:49": {
                women: 7,
                men: 4,
              },
              "50:": {
                women: 12,
                men: 12,
              },
            },
          },
          tam: {
            ageRanges: {
              ":29": {
                women: 48,
                men: 36,
              },
              "30:39": {
                women: 65,
                men: 55,
              },
              "40:49": {
                women: 66,
                men: 41,
              },
              "50:": {
                women: 102,
                men: 51,
              },
            },
          },
          ic: {
            ageRanges: {
              ":29": {
                women: 32,
                men: 14,
              },
              "30:39": {
                women: 138,
                men: 59,
              },
              "40:49": {
                women: 108,
                men: 98,
              },
              "50:": {
                women: 113,
                men: 130,
              },
            },
          },
        },
      },
      indicateur1: {
        mode: "niveau_branche",
        remunerations: [
          {
            name: "F",
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
                menCount: 2,
              },
              "50:": {
                womenCount: 4,
                menCount: 8,
                womenSalary: 230128,
                menSalary: 241993,
              },
            },
          },
          {
            name: "E",
            category: {
              ":29": {
                womenCount: 0,
                menCount: 0,
              },
              "30:39": {
                womenCount: 0,
                menCount: 1,
              },
              "40:49": {
                womenCount: 4,
                menCount: 2,
              },
              "50:": {
                womenCount: 2,
                menCount: 5,
              },
            },
          },
          {
            name: "D",
            category: {
              ":29": {
                womenCount: 0,
                menCount: 0,
              },
              "30:39": {
                womenCount: 2,
                menCount: 3,
              },
              "40:49": {
                womenCount: 12,
                menCount: 18,
                womenSalary: 96832,
                menSalary: 108025,
              },
              "50:": {
                womenCount: 19,
                menCount: 42,
                womenSalary: 109673,
                menSalary: 120211,
              },
            },
          },
          {
            name: "C",
            category: {
              ":29": {
                womenCount: 0,
                menCount: 1,
              },
              "30:39": {
                womenCount: 36,
                menCount: 15,
                womenSalary: 64130,
                menSalary: 67889,
              },
              "40:49": {
                womenCount: 34,
                menCount: 38,
                womenSalary: 70801,
                menSalary: 73278,
              },
              "50:": {
                womenCount: 30,
                menCount: 33,
                womenSalary: 72966,
                menSalary: 84559,
              },
            },
          },
          {
            name: "B",
            category: {
              ":29": {
                womenCount: 17,
                menCount: 5,
                womenSalary: 47886,
                menSalary: 48747,
              },
              "30:39": {
                womenCount: 85,
                menCount: 38,
                womenSalary: 51154,
                menSalary: 54389,
              },
              "40:49": {
                womenCount: 50,
                menCount: 32,
                womenSalary: 56065,
                menSalary: 58363,
              },
              "50:": {
                womenCount: 45,
                menCount: 40,
                womenSalary: 58678,
                menSalary: 61317,
              },
            },
          },
          {
            name: "A",
            category: {
              ":29": {
                womenCount: 15,
                menCount: 8,
                womenSalary: 41114,
                menSalary: 38975,
              },
              "30:39": {
                womenCount: 14,
                menCount: 2,
              },
              "40:49": {
                womenCount: 7,
                menCount: 6,
                womenSalary: 45771,
                menSalary: 47658,
              },
              "50:": {
                womenCount: 13,
                menCount: 2,
              },
            },
          },
          {
            name: "II.7",
            category: {
              ":29": {
                womenCount: 3,
                menCount: 9,
                womenSalary: 38937,
                menSalary: 40213,
              },
              "30:39": {
                womenCount: 2,
                menCount: 8,
              },
              "40:49": {
                womenCount: 4,
                menCount: 4,
                womenSalary: 39395,
                menSalary: 39395,
              },
              "50:": {
                womenCount: 9,
                menCount: 10,
                womenSalary: 42176,
                menSalary: 44567,
              },
            },
          },
          {
            name: "II.6",
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
                womenCount: 0,
                menCount: 0,
              },
              "50:": {
                womenCount: 1,
                menCount: 1,
              },
            },
          },
          {
            name: "II.5",
            category: {
              ":29": {
                womenCount: 5,
                menCount: 0,
              },
              "30:39": {
                womenCount: 14,
                menCount: 6,
                womenSalary: 36850,
                menSalary: 35819,
              },
              "40:49": {
                womenCount: 11,
                menCount: 6,
                womenSalary: 39353,
                menSalary: 37722,
              },
              "50:": {
                womenCount: 19,
                menCount: 10,
                womenSalary: 41603,
                menSalary: 41888,
              },
            },
          },
          {
            name: "II.4",
            category: {
              ":29": {
                womenCount: 5,
                menCount: 5,
                womenSalary: 32738,
                menSalary: 34247,
              },
              "30:39": {
                womenCount: 12,
                menCount: 17,
                womenSalary: 34072,
                menSalary: 34335,
              },
              "40:49": {
                womenCount: 11,
                menCount: 9,
                womenSalary: 34072,
                menSalary: 36604,
              },
              "50:": {
                womenCount: 18,
                menCount: 7,
                womenSalary: 37650,
                menSalary: 39421,
              },
            },
          },
          {
            name: "II.3",
            category: {
              ":29": {
                womenCount: 13,
                menCount: 8,
                womenSalary: 31369,
                menSalary: 31583,
              },
              "30:39": {
                womenCount: 17,
                menCount: 7,
                womenSalary: 32292,
                menSalary: 32749,
              },
              "40:49": {
                womenCount: 30,
                menCount: 10,
                womenSalary: 34904,
                menSalary: 34904,
              },
              "50:": {
                womenCount: 43,
                menCount: 14,
                womenSalary: 35658,
                menSalary: 34970,
              },
            },
          },
          {
            name: "II.2",
            category: {
              ":29": {
                womenCount: 17,
                menCount: 5,
                womenSalary: 29798,
                menSalary: 30219,
              },
              "30:39": {
                womenCount: 15,
                menCount: 1,
              },
              "40:49": {
                womenCount: 3,
                menCount: 0,
              },
              "50:": {
                womenCount: 5,
                menCount: 6,
                womenSalary: 34269,
                menSalary: 34269,
              },
            },
          },
          {
            name: "II.1",
            category: {
              ":29": {
                womenCount: 5,
                menCount: 10,
                womenSalary: 27980,
                menSalary: 28827,
              },
              "30:39": {
                womenCount: 6,
                menCount: 15,
                womenSalary: 31017,
                menSalary: 29721,
              },
              "40:49": {
                womenCount: 7,
                menCount: 12,
                womenSalary: 32449,
                menSalary: 30433,
              },
              "50:": {
                womenCount: 13,
                menCount: 7,
                womenSalary: 33025,
                menSalary: 32143,
              },
            },
          },
          {
            name: "I.6",
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
                menCount: 1,
              },
            },
          },
          {
            name: "I.5",
            category: {
              ":29": {
                womenCount: 5,
                menCount: 4,
                womenSalary: 27449,
                menSalary: 26394,
              },
              "30:39": {
                womenCount: 13,
                menCount: 9,
                womenSalary: 28551,
                menSalary: 28011,
              },
              "40:49": {
                womenCount: 12,
                menCount: 7,
                womenSalary: 28767,
                menSalary: 28279,
              },
              "50:": {
                womenCount: 15,
                menCount: 16,
                womenSalary: 29804,
                menSalary: 29009,
              },
            },
          },
          {
            name: "I.4",
            category: {
              ":29": {
                womenCount: 0,
                menCount: 0,
              },
              "30:39": {
                womenCount: 5,
                menCount: 4,
                womenSalary: 27050,
                menSalary: 27060,
              },
              "40:49": {
                womenCount: 5,
                menCount: 7,
                womenSalary: 26699,
                menSalary: 27317,
              },
              "50:": {
                womenCount: 3,
                menCount: 8,
                womenSalary: 28168,
                menSalary: 29247,
              },
            },
          },
          {
            name: "I.3",
            category: {
              ":29": {
                womenCount: 9,
                menCount: 2,
              },
              "30:39": {
                womenCount: 15,
                menCount: 13,
                womenSalary: 25226,
                menSalary: 26287,
              },
              "40:49": {
                womenCount: 23,
                menCount: 8,
                womenSalary: 26750,
                menSalary: 26833,
              },
              "50:": {
                womenCount: 29,
                menCount: 14,
                womenSalary: 27577,
                menSalary: 27695,
              },
            },
          },
        ],
      },
      indicateur2: {
        calculable: "non",
      },
      indicateur3: {
        calculable: "non",
      },
      indicateur4: {
        calculable: true,
        count: {
          total: 31,
          raised: 31,
        },
      },
      indicateur5: {
        women: 1,
        men: 9,
      },
      resultIndicateur1: {
        favorablePopulation: "men",
        note: 38,
        result: 2,
        resultRaw: 2.019119637433434,
      },
      resultIndicateur2: false,
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
        resultRaw: 53,
        result: 81.53846153846153,
        note: 82,
      },
    },
    // Ex 29
    {
      effectifs: {
        workforceRange: "251:999",
        csp: {
          ouv: {
            ageRanges: {
              ":29": {
                women: 19,
                men: 20,
              },
              "30:39": {
                women: 69,
                men: 23,
              },
              "40:49": {
                women: 75,
                men: 25,
              },
              "50:": {
                women: 84,
                men: 32,
              },
            },
          },
          emp: {
            ageRanges: {
              ":29": {
                women: 2,
                men: 1,
              },
              "30:39": {
                women: 8,
                men: 1,
              },
              "40:49": {
                women: 5,
                men: 0,
              },
              "50:": {
                women: 7,
                men: 1,
              },
            },
          },
          tam: {
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
                women: 3,
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
              ":29": {
                womenSalary: 20328,
                menSalary: 20130,
              },
              "30:39": {
                womenSalary: 22343,
                menSalary: 22010,
              },
              "40:49": {
                womenSalary: 25789,
                menSalary: 25599,
              },
              "50:": {
                womenSalary: 29234,
                menSalary: 28987,
              },
            },
          },
          {
            name: "emp",
          },
          {
            name: "tam",
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
            women: 100,
            men: 100,
          },
        },
      },
      indicateur3: {
        calculable: "non",
      },
      indicateur4: {
        calculable: false,
      },
      indicateur5: {
        women: 9,
        men: 1,
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
      resultIndicateur3: false,
      resultIndicateur4: false,
      resultIndicateur5: {
        favorablePopulation: "women",
        note: 0,
        result: 1,
        resultRaw: 1,
      },
      result: {
        favorablePopulation: "equality",
        resultRaw: 60,
        result: 85.71428571428571,
        note: 86,
      },
    },
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
