/* eslint-disable @typescript-eslint/ban-ts-comment */

import { computerHelper } from "../computerHelper";

describe("Test des calculs avec moins de 250 employés dans l'entreprise", () => {
  it.each([
    // Ex 1
    {
      effectifs: {
        workforceRange: "50:250",
        csp: {
          ouv: {
            ageRanges: {
              ":29": {
                women: 0,
                men: 0,
              },
              "30:39": {
                women: 1,
                men: 5,
              },
              "40:49": {
                women: 2,
                men: 3,
              },
              "50:": {
                women: 9,
                men: 4,
              },
            },
          },
          emp: {
            ageRanges: {
              ":29": {
                women: 2,
                men: 7,
              },
              "30:39": {
                women: 6,
                men: 8,
              },
              "40:49": {
                women: 2,
                men: 4,
              },
              "50:": {
                women: 8,
                men: 6,
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
                men: 2,
              },
              "30:39": {
                women: 1,
                men: 5,
              },
              "40:49": {
                women: 3,
                men: 10,
              },
              "50:": {
                women: 2,
                men: 8,
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
                womenSalary: 23933,
                menSalary: 26773,
              },
            },
          },
          {
            name: "emp",
            category: {
              "30:39": {
                womenSalary: 31305,
                menSalary: 31102,
              },
              "50:": {
                womenSalary: 30445,
                menSalary: 29666,
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
                womenSalary: 80539,
                menSalary: 59235,
              },
            },
          },
        ],
      },
      indicateur2and3: {
        calculable: "oui",
        raisedCount: {
          women: 12,
          men: 17,
        },
      },
      indicateur4: {
        calculable: false,
      },
      indicateur5: {
        women: 2,
        men: 8,
      },
      resultIndicateur1: {
        favorablePopulation: "women",
        note: 33,
        result: 6.1,
        resultRaw: -6.104588503037917,
      },
      resultIndicateur2and3: {
        resultRaw: -0.04594820384294068,
        result: 4.6,
        equivalentEmployeeCountGap: 1.7,
        equivalentEmployeeCountGapRaw: -1.746031746031746,
        note: 35,
        favorablePopulation: "women",
        noteEquivalentEmployeeCountGap: 35,
        notePercent: 25,
        ifadvantage: "women-women",
        remunerationsCompensated: false,
      },
      resultIndicateur4: false,
      resultIndicateur5: {
        favorablePopulation: "men",
        note: 5,
        result: 2,
      },
      result: {
        favorablePopulation: "equality",
        resultRaw: 73,
        result: 85.88235294117646,
        note: 86,
      },
    },
    // Ex 2
    {
      effectifs: {
        workforceRange: "50:250",
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
                men: 25,
              },
              "30:39": {
                women: 10,
                men: 45,
              },
              "40:49": {
                women: 6,
                men: 9,
              },
              "50:": {
                women: 2,
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
                men: 5,
              },
              "40:49": {
                women: 0,
                men: 0,
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
        mode: "niveau_branche",
        remunerations: [
          {
            name: "ETAM - POSITIONS 2",
            category: {
              ":29": {
                womenCount: 0,
                menCount: 20,
              },
              "30:39": {
                womenCount: 6,
                menCount: 35,
                womenSalary: 23389,
                menSalary: 23296,
              },
              "40:49": {
                womenCount: 5,
                menCount: 7,
                womenSalary: 22122,
                menSalary: 24006,
              },
              "50:": {
                womenCount: 2,
                menCount: 3,
              },
            },
          },
          {
            name: "ETAM - POSITIONS 3",
            category: {
              ":29": {
                womenCount: 0,
                menCount: 5,
              },
              "30:39": {
                womenCount: 4,
                menCount: 10,
                womenSalary: 35983,
                menSalary: 28103,
              },
              "40:49": {
                womenCount: 1,
                menCount: 2,
              },
              "50:": {
                womenCount: 0,
                menCount: 1,
              },
            },
          },
          {
            name: "INGÉNIEURS ET CADRES",
            category: {
              ":29": {
                womenCount: 0,
                menCount: 0,
              },
              "30:39": {
                womenCount: 0,
                menCount: 5,
              },
              "40:49": {
                womenCount: 0,
                menCount: 0,
              },
              "50:": {
                womenCount: 0,
                menCount: 1,
              },
            },
          },
        ],
      },
      indicateur2and3: {
        calculable: "oui",
        raisedCount: {
          women: 3,
          men: 24,
        },
      },
      indicateur4: {
        calculable: false,
      },
      indicateur5: {
        women: 2,
        men: 8,
      },
      resultIndicateur1: {
        favorablePopulation: "women",
        note: 35,
        result: 4.4,
        resultRaw: -4.393723865585573,
      },
      resultIndicateur2and3: {
        resultRaw: 0.10299625468164794,
        result: 10.3,
        equivalentEmployeeCountGap: 1.9,
        equivalentEmployeeCountGapRaw: 1.853932584269663,
        note: 35,
        favorablePopulation: "men",
        noteEquivalentEmployeeCountGap: 35,
        notePercent: 0,
        ifadvantage: "men-women",
        remunerationsCompensated: true,
      },
      resultIndicateur4: false,
      resultIndicateur5: {
        favorablePopulation: "men",
        note: 5,
        result: 2,
        resultRaw: 2,
      },
      result: {
        favorablePopulation: "equality",
        resultRaw: 75,
        result: 88.23529411764706,
        note: 88,
      },
    },
    // Ex 3
    {
      effectifs: {
        workforceRange: "50:250",
        csp: {
          ouv: {
            ageRanges: {
              ":29": {
                women: 4,
                men: 8,
              },
              "30:39": {
                women: 2,
                men: 8,
              },
              "40:49": {
                women: 9,
                men: 4,
              },
              "50:": {
                women: 5,
                men: 8,
              },
            },
          },
          emp: {
            ageRanges: {
              ":29": {
                women: 2,
                men: 3,
              },
              "30:39": {
                women: 6,
                men: 2,
              },
              "40:49": {
                women: 11,
                men: 4,
              },
              "50:": {
                women: 11,
                men: 2,
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
                women: 1,
                men: 0,
              },
              "50:": {
                women: 1,
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
                women: 0,
                men: 1,
              },
              "40:49": {
                women: 0,
                men: 7,
              },
              "50:": {
                women: 3,
                men: 6,
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
                womenSalary: 17540,
                menSalary: 19070,
              },
              "40:49": {
                womenSalary: 19090,
                menSalary: 20840,
              },
              "50:": {
                womenSalary: 20660,
                menSalary: 22960,
              },
            },
          },
          {
            name: "emp",
            category: {
              "40:49": {
                womenSalary: 20770,
                menSalary: 30950,
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
                womenSalary: 56390,
                menSalary: 40560,
              },
            },
          },
        ],
      },
      indicateur2and3: {
        calculable: "oui",
        raisedCount: {
          women: 55,
          men: 49,
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
        women: 4,
        men: 6,
      },
      resultIndicateur1: {
        favorablePopulation: "men",
        note: 35,
        result: 4.2,
        resultRaw: 4.157861932380167,
      },
      resultIndicateur2and3: {
        resultRaw: -0.057614555256064626,
        result: 5.8,
        equivalentEmployeeCountGap: 3.1,
        equivalentEmployeeCountGapRaw: -3.0535714285714253,
        note: 25,
        favorablePopulation: "women",
        noteEquivalentEmployeeCountGap: 25,
        notePercent: 15,
        ifadvantage: "women-men",
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
        note: 10,
        result: 4,
        resultRaw: 4,
      },
      result: {
        favorablePopulation: "equality",
        resultRaw: 95,
        result: 95,
        note: 95,
      },
    },
    // Ex 4
    {
      effectifs: {
        workforceRange: "50:250",
        csp: {
          ouv: {
            ageRanges: {
              ":29": {
                women: 11,
                men: 10,
              },
              "30:39": {
                women: 16,
                men: 16,
              },
              "40:49": {
                women: 17,
                men: 15,
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
                men: 4,
              },
              "30:39": {
                women: 3,
                men: 2,
              },
              "40:49": {
                women: 8,
                men: 5,
              },
              "50:": {
                women: 6,
                men: 5,
              },
            },
          },
          tam: {
            ageRanges: {
              ":29": {
                women: 5,
                men: 1,
              },
              "30:39": {
                women: 8,
                men: 5,
              },
              "40:49": {
                women: 8,
                men: 8,
              },
              "50:": {
                women: 9,
                men: 2,
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
                men: 2,
              },
              "40:49": {
                women: 1,
                men: 5,
              },
              "50:": {
                women: 2,
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
            category: {
              ":29": {
                womenSalary: 21077,
                menSalary: 22057,
              },
              "30:39": {
                womenSalary: 21528,
                menSalary: 22320,
              },
              "40:49": {
                womenSalary: 22324,
                menSalary: 22048,
              },
              "50:": {
                womenSalary: 21953,
                menSalary: 22175,
              },
            },
          },
          {
            name: "emp",
            category: {
              "40:49": {
                womenSalary: 23161,
                menSalary: 22369,
              },
              "50:": {
                womenSalary: 24620,
                menSalary: 25008,
              },
            },
          },
          {
            name: "tam",
            category: {
              "30:39": {
                womenSalary: 25842,
                menSalary: 25638,
              },
              "40:49": {
                womenSalary: 25356,
                menSalary: 26245,
              },
            },
          },
          {
            name: "ic",
          },
        ],
      },
      indicateur2and3: {
        calculable: "oui",
        raisedCount: {
          women: 22,
          men: 12,
        },
      },
      indicateur4: {
        calculable: true,
        count: {
          total: 3,
          raised: 3,
        },
      },
      indicateur5: {
        women: 4,
        men: 6,
      },
      resultIndicateur1: {
        favorablePopulation: "equality",
        note: 40,
        result: 0,
        resultRaw: 0,
      },
      resultIndicateur2and3: {
        resultRaw: -0.049603174603174593,
        result: 5,
        equivalentEmployeeCountGap: 4.8,
        equivalentEmployeeCountGapRaw: -4.761904761904761,
        note: 25,
        favorablePopulation: "women",
        noteEquivalentEmployeeCountGap: 25,
        notePercent: 25,
        ifadvantage: "women-men",
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
        note: 10,
        result: 4,
        resultRaw: 4,
      },
      result: {
        favorablePopulation: "equality",
        resultRaw: 90,
        result: 90,
        note: 90,
      },
    },
    // Ex 5
    {
      effectifs: {
        workforceRange: "50:250",
        csp: {
          ouv: {
            ageRanges: {
              ":29": {
                women: 8,
                men: 21,
              },
              "30:39": {
                women: 31,
                men: 16,
              },
              "40:49": {
                women: 31,
                men: 23,
              },
              "50:": {
                women: 46,
                men: 28,
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
                women: 3,
                men: 3,
              },
              "40:49": {
                women: 2,
                men: 2,
              },
              "50:": {
                women: 2,
                men: 2,
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
                women: 0,
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
              ":29": {
                womenSalary: 19760,
                menSalary: 19768,
              },
              "30:39": {
                womenSalary: 19795,
                menSalary: 19728,
              },
              "40:49": {
                womenSalary: 19744,
                menSalary: 19804,
              },
              "50:": {
                womenSalary: 19744,
                menSalary: 19821,
              },
            },
          },
          {
            name: "emp",
            category: {
              "30:39": {
                womenSalary: 22624,
                menSalary: 23573,
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
      indicateur2and3: {
        calculable: "oui",
        raisedCount: {
          women: 8,
          men: 7,
        },
      },
      indicateur4: {
        calculable: false,
      },
      indicateur5: {
        women: 4,
        men: 6,
      },
      resultIndicateur1: {
        favorablePopulation: "equality",
        note: 40,
        result: 0,
        resultRaw: 0,
      },
      resultIndicateur2and3: {
        resultRaw: 0.008400537634408609,
        result: 0.8,
        equivalentEmployeeCountGap: 0.8,
        equivalentEmployeeCountGapRaw: 0.8064516129032264,
        note: 35,
        favorablePopulation: "men",
        noteEquivalentEmployeeCountGap: 35,
        notePercent: 35,
        ifadvantage: "men-men",
        remunerationsCompensated: false,
      },
      resultIndicateur4: false,
      resultIndicateur5: {
        favorablePopulation: "men",
        note: 10,
        result: 4,
        resultRaw: 4,
      },
      result: {
        favorablePopulation: "equality",
        resultRaw: 85,
        result: 100,
        note: 100,
      },
    },
    // Ex 6
    {
      effectifs: {
        workforceRange: "50:250",
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
                women: 8,
                men: 1,
              },
              "30:39": {
                women: 3,
                men: 11,
              },
              "40:49": {
                women: 17,
                men: 6,
              },
              "50:": {
                women: 17,
                men: 11,
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
                men: 0,
              },
              "50:": {
                women: 2,
                men: 1,
              },
            },
          },
        },
      },
      indicateur1: {
        mode: "niveau_branche",
        remunerations: [
          {
            name: "TQ1",
            category: {
              ":29": {
                womenCount: 1,
                menCount: 0,
              },
              "30:39": {
                womenCount: 2,
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
            name: "TQ2A",
            category: {
              ":29": {
                womenCount: 4,
                menCount: 1,
              },
              "30:39": {
                womenCount: 1,
                menCount: 6,
              },
              "40:49": {
                womenCount: 5,
                menCount: 1,
              },
              "50:": {
                womenCount: 7,
                menCount: 3,
                womenSalary: 21370,
                menSalary: 21552,
              },
            },
          },
          {
            name: "TQ2B",
            category: {
              ":29": {
                womenCount: 3,
                menCount: 0,
              },
              "30:39": {
                womenCount: 0,
                menCount: 5,
              },
              "40:49": {
                womenCount: 6,
                menCount: 3,
                womenSalary: 24083,
                menSalary: 24083,
              },
              "50:": {
                womenCount: 8,
                menCount: 5,
                womenSalary: 25125,
                menSalary: 25400,
              },
            },
          },
          {
            name: "THQ",
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
                womenCount: 6,
                menCount: 2,
              },
              "50:": {
                womenCount: 2,
                menCount: 3,
              },
            },
          },
          {
            name: "RESPONSABLES DE PÔLE",
            category: {
              ":29": {
                womenCount: 0,
                menCount: 0,
              },
              "30:39": {
                womenCount: 1,
                menCount: 0,
              },
              "40:49": {
                womenCount: 0,
                menCount: 0,
              },
              "50:": {
                womenCount: 0,
                menCount: 1,
              },
            },
          },
          {
            name: "DIRECTION",
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
                womenCount: 1,
                menCount: 1,
              },
            },
          },
        ],
      },
      indicateur2and3: {
        calculable: "oui",
        raisedCount: {
          women: 47,
          men: 31,
        },
      },
      indicateur4: {
        calculable: false,
      },
      indicateur5: {
        women: 5,
        men: 5,
      },
      resultIndicateur1: {
        favorablePopulation: "equality",
        note: 40,
        result: 0,
        resultRaw: 0,
      },
      resultIndicateur2and3: {
        resultRaw: 0,
        result: 0,
        equivalentEmployeeCountGap: 0,
        equivalentEmployeeCountGapRaw: 0,
        note: 35,
        favorablePopulation: "equality",
        noteEquivalentEmployeeCountGap: 35,
        notePercent: 35,
        ifadvantage: "equality",
        remunerationsCompensated: false,
      },
      resultIndicateur4: false,
      resultIndicateur5: {
        favorablePopulation: "equality",
        note: 10,
        result: 5,
        resultRaw: 5,
      },
      result: {
        favorablePopulation: "equality",
        resultRaw: 85,
        result: 100,
        note: 100,
      },
    },
    // Ex 6b
    {
      effectifs: {
        workforceRange: "50:250",
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
                women: 35,
                men: 11,
              },
              "30:39": {
                women: 7,
                men: 2,
              },
              "40:49": {
                women: 6,
                men: 1,
              },
              "50:": {
                women: 4,
                men: 3,
              },
            },
          },
          tam: {
            ageRanges: {
              ":29": {
                women: 12,
                men: 3,
              },
              "30:39": {
                women: 8,
                men: 8,
              },
              "40:49": {
                women: 7,
                men: 8,
              },
              "50:": {
                women: 16,
                men: 12,
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
                women: 1,
                men: 1,
              },
              "40:49": {
                women: 1,
                men: 1,
              },
              "50:": {
                women: 1,
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
                womenSalary: 13720,
                menSalary: 13020,
              },
              "50:": {
                womenSalary: 16740,
                menSalary: 17950,
              },
            },
          },
          {
            name: "tam",
            category: {
              ":29": {
                womenSalary: 17300,
                menSalary: 16890,
              },
              "30:39": {
                womenSalary: 22090,
                menSalary: 20650,
              },
              "40:49": {
                womenSalary: 20010,
                menSalary: 21070,
              },
              "50:": {
                womenSalary: 22416,
                menSalary: 23915,
              },
            },
          },
          {
            name: "ic",
          },
        ],
      },
      indicateur2and3: {
        calculable: "oui",
        raisedCount: {
          women: 2,
          men: 1,
        },
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
        resultRaw: -0.005758990852441692,
      },
      resultIndicateur2and3: {
        resultRaw: -0.00020202020202020332,
        result: 0,
        equivalentEmployeeCountGap: 0,
        equivalentEmployeeCountGapRaw: -0.010101010101010166,
        note: 35,
        favorablePopulation: "women",
        noteEquivalentEmployeeCountGap: 35,
        notePercent: 35,
        ifadvantage: "equality",
        remunerationsCompensated: false,
      },
      resultIndicateur4: false,
      resultIndicateur5: {
        favorablePopulation: "women",
        note: 10,
        result: 4,
        resultRaw: 4,
      },
      result: {
        favorablePopulation: "equality",
        resultRaw: 85,
        result: 100,
        note: 100,
      },
    },
    // Ex 6bb
    {
      effectifs: {
        workforceRange: "50:250",
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
                women: 29,
                men: 27,
              },
              "30:39": {
                women: 20,
                men: 8,
              },
              "40:49": {
                women: 21,
                men: 4,
              },
              "50:": {
                women: 27,
                men: 12,
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
                women: 1,
                men: 2,
              },
              "40:49": {
                women: 1,
                men: 1,
              },
              "50:": {
                women: 3,
                men: 5,
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
                women: 2,
                men: 0,
              },
              "50:": {
                women: 2,
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
                womenSalary: 22974,
                menSalary: 22975,
              },
              "30:39": {
                womenSalary: 23157,
                menSalary: 23717,
              },
              "40:49": {
                womenSalary: 23483,
                menSalary: 23718,
              },
              "50:": {
                womenSalary: 23345,
                menSalary: 24600,
              },
            },
          },
          {
            name: "tam",
            category: {
              "50:": {
                womenSalary: 31573,
                menSalary: 31696,
              },
            },
          },
          {
            name: "ic",
          },
        ],
      },
      indicateur2and3: {
        calculable: "oui",
        raisedCount: {
          women: 7,
          men: 4,
        },
      },
      indicateur4: {
        calculable: false,
      },
      indicateur5: {
        women: 4,
        men: 6,
      },
      resultIndicateur1: {
        favorablePopulation: "equality",
        note: 40,
        result: 0,
        resultRaw: 0.025406504065040636,
      },
      resultIndicateur2and3: {
        resultRaw: 0.00015320974413973731,
        result: 0,
        equivalentEmployeeCountGap: 0,
        equivalentEmployeeCountGapRaw: 0.009345794392523976,
        note: 35,
        favorablePopulation: "men",
        noteEquivalentEmployeeCountGap: 35,
        notePercent: 35,
        ifadvantage: "equality",
        remunerationsCompensated: false,
      },
      resultIndicateur4: false,
      resultIndicateur5: {
        favorablePopulation: "men",
        note: 10,
        result: 4,
        resultRaw: 4,
      },
      result: {
        favorablePopulation: "equality",
        resultRaw: 85,
        result: 100,
        note: 100,
      },
    },
    // Ex 7
    {
      effectifs: {
        workforceRange: "50:250",
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
                women: 40,
                men: 26,
              },
              "30:39": {
                women: 17,
                men: 18,
              },
              "40:49": {
                women: 7,
                men: 5,
              },
              "50:": {
                women: 7,
                men: 6,
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
                women: 3,
                men: 3,
              },
              "40:49": {
                women: 1,
                men: 1,
              },
              "50:": {
                women: 1,
                men: 2,
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
                womenSalary: 12868,
                menSalary: 13209,
              },
              "30:39": {
                womenSalary: 29684,
                menSalary: 19935,
              },
              "40:49": {
                womenSalary: 36633,
                menSalary: 29943,
              },
              "50:": {
                womenSalary: 27763,
                menSalary: 39504,
              },
            },
          },
          {
            name: "tam",
            category: {
              "30:39": {
                womenSalary: 38134,
                menSalary: 47198,
              },
            },
          },
          {
            name: "ic",
          },
        ],
      },
      indicateur2and3: {
        calculable: "oui",
        raisedCount: {
          women: 13,
          men: 7,
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
        women: 4,
        men: 6,
      },
      resultIndicateur1: {
        favorablePopulation: "women",
        note: 25,
        result: 10.1,
        resultRaw: -10.137488466647966,
      },
      resultIndicateur2and3: {
        resultRaw: -0.055181962025316444,
        result: 5.5,
        equivalentEmployeeCountGap: 3.5,
        equivalentEmployeeCountGapRaw: -3.5316455696202524,
        note: 25,
        favorablePopulation: "women",
        noteEquivalentEmployeeCountGap: 25,
        notePercent: 15,
        ifadvantage: "women-men",
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
        note: 10,
        result: 4,
        resultRaw: 4,
      },
      result: {
        favorablePopulation: "equality",
        resultRaw: 75,
        result: 75,
        note: 75,
      },
    },
    // Ex 8
    {
      effectifs: {
        workforceRange: "50:250",
        csp: {
          ouv: {
            ageRanges: {
              ":29": {
                women: 1,
                men: 0,
              },
              "30:39": {
                women: 0,
                men: 2,
              },
              "40:49": {
                women: 2,
                men: 2,
              },
              "50:": {
                women: 2,
                men: 5,
              },
            },
          },
          emp: {
            ageRanges: {
              ":29": {
                women: 32,
                men: 3,
              },
              "30:39": {
                women: 45,
                men: 4,
              },
              "40:49": {
                women: 29,
                men: 4,
              },
              "50:": {
                women: 31,
                men: 10,
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
                women: 1,
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
                women: 11,
                men: 1,
              },
              "40:49": {
                women: 14,
                men: 1,
              },
              "50:": {
                women: 7,
                men: 4,
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
                womenSalary: 25450,
                menSalary: 21617,
              },
              "30:39": {
                womenSalary: 27468,
                menSalary: 28210,
              },
              "40:49": {
                womenSalary: 30237,
                menSalary: 29809,
              },
              "50:": {
                womenSalary: 31278,
                menSalary: 30810,
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
                womenSalary: 48613,
                menSalary: 47887,
              },
            },
          },
        ],
      },
      indicateur2and3: {
        calculable: "oui",
        raisedCount: {
          women: 177,
          men: 36,
        },
      },
      indicateur4: {
        calculable: true,
        count: {
          total: 9,
          raised: 3,
        },
      },
      indicateur5: {
        women: 7,
        men: 3,
      },
      resultIndicateur1: {
        favorablePopulation: "women",
        note: 37,
        result: 2.6,
        resultRaw: -2.6366835985156323,
      },
      resultIndicateur2and3: {
        resultRaw: 0,
        result: 0,
        equivalentEmployeeCountGap: 0,
        equivalentEmployeeCountGapRaw: 0,
        note: 35,
        favorablePopulation: "equality",
        noteEquivalentEmployeeCountGap: 35,
        notePercent: 35,
        ifadvantage: "equality",
        remunerationsCompensated: true,
      },
      resultIndicateur4: {
        favorablePopulation: "women",
        note: 0,
        result: 0.3333333333333333,
        resultRaw: 0.3333333333333333,
      },
      resultIndicateur5: {
        favorablePopulation: "women",
        note: 5,
        result: 3,
        resultRaw: 3,
      },
      result: {
        favorablePopulation: "equality",
        resultRaw: 77,
        result: 77,
        note: 77,
      },
    },
    // Ex 9
    {
      effectifs: {
        workforceRange: "50:250",
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
                men: 1,
              },
              "30:39": {
                women: 4,
                men: 1,
              },
              "40:49": {
                women: 2,
                men: 0,
              },
              "50:": {
                women: 2,
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
                men: 3,
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
          ic: {
            ageRanges: {
              ":29": {
                women: 0,
                men: 2,
              },
              "30:39": {
                women: 8,
                men: 7,
              },
              "40:49": {
                women: 13,
                men: 26,
              },
              "50:": {
                women: 10,
                men: 32,
              },
            },
          },
        },
      },
      indicateur1: {
        mode: "niveau_branche",
        remunerations: [
          {
            name: "ETAM",
            category: {
              ":29": {
                womenCount: 0,
                menCount: 1,
              },
              "30:39": {
                womenCount: 4,
                menCount: 4,
                womenSalary: 33213,
                menSalary: 41041,
              },
              "40:49": {
                womenCount: 2,
                menCount: 1,
              },
              "50:": {
                womenCount: 2,
                menCount: 0,
              },
            },
          },
          {
            name: "CADRES INTÉGRÉS",
            category: {
              ":29": {
                womenCount: 0,
                menCount: 2,
              },
              "30:39": {
                womenCount: 4,
                menCount: 2,
              },
              "40:49": {
                womenCount: 3,
                menCount: 3,
                womenSalary: 40324,
                menSalary: 46348,
              },
              "50:": {
                womenCount: 3,
                menCount: 3,
                womenSalary: 39205,
                menSalary: 47783,
              },
            },
          },
          {
            name: "CADRE FORFAIT JOURS",
            category: {
              ":29": {
                womenCount: 0,
                menCount: 0,
              },
              "30:39": {
                womenCount: 4,
                menCount: 5,
                womenSalary: 47855,
                menSalary: 49788,
              },
              "40:49": {
                womenCount: 10,
                menCount: 22,
                womenSalary: 59804,
                menSalary: 59559,
              },
              "50:": {
                womenCount: 7,
                menCount: 19,
                womenSalary: 55091,
                menSalary: 59139,
              },
            },
          },
          {
            name: "CADRE SANS RÉFÉRENCE HORAIR",
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
                menCount: 10,
              },
            },
          },
        ],
      },
      indicateur2and3: {
        calculable: "oui",
        raisedCount: {
          women: 24,
          men: 48,
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
        note: 34,
        result: 5.1,
        resultRaw: 5.0711963985865705,
      },
      resultIndicateur2and3: {
        resultRaw: 0.04214963119072701,
        result: 4.2,
        equivalentEmployeeCountGap: 1.6,
        equivalentEmployeeCountGapRaw: 1.6438356164383534,
        note: 35,
        favorablePopulation: "men",
        noteEquivalentEmployeeCountGap: 35,
        notePercent: 25,
        ifadvantage: "men-women",
        remunerationsCompensated: false,
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
        resultRaw: 69,
        result: 81.17647058823529,
        note: 81,
      },
    },
    // Ex 10
    {
      effectifs: {
        workforceRange: "50:250",
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
                women: 6,
                men: 18,
              },
              "30:39": {
                women: 13,
                men: 58,
              },
              "40:49": {
                women: 9,
                men: 36,
              },
              "50:": {
                women: 5,
                men: 38,
              },
            },
          },
        },
      },
      indicateur1: {
        mode: "niveau_branche",
        remunerations: [
          {
            name: "ADMINISTRATION GROUP",
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
                womenCount: 2,
                menCount: 0,
              },
              "50:": {
                womenCount: 2,
                menCount: 0,
              },
            },
          },
          {
            name: "ENGINEERING GROUP",
            category: {
              ":29": {
                womenCount: 5,
                menCount: 18,
                womenSalary: 54381,
                menSalary: 53055,
              },
              "30:39": {
                womenCount: 11,
                menCount: 56,
                womenSalary: 61010,
                menSalary: 70454,
              },
              "40:49": {
                womenCount: 4,
                menCount: 32,
                womenSalary: 99506,
                menSalary: 101605,
              },
              "50:": {
                womenCount: 1,
                menCount: 28,
                womenSalary: "",
                menSalary: "",
              },
            },
          },
          {
            name: "ENGINEERING SERVICES GROUP",
            category: {
              ":29": {
                womenCount: 1,
                menCount: 0,
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
                womenCount: 1,
                menCount: 2,
              },
            },
          },
          {
            name: "LEGAL GROUP",
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
                womenCount: 2,
                menCount: 1,
              },
              "50:": {
                womenCount: 0,
                menCount: 0,
              },
            },
          },
          {
            name: "OPERATIONS GROUP",
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
                womenCount: 1,
                menCount: 0,
              },
            },
          },
          {
            name: "SALES, BUSINESS DEVELOPMENT & MARKETING GROUP",
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
                womenCount: 0,
                menCount: 8,
              },
            },
          },
        ],
      },
      indicateur2and3: {
        calculable: "oui",
        raisedCount: {
          women: 33,
          men: 150,
        },
      },
      indicateur4: {
        calculable: true,
        count: {
          total: 3,
          raised: 3,
        },
      },
      indicateur5: {
        women: 0,
        men: 10,
      },
      resultIndicateur1: {
        favorablePopulation: "men",
        note: 34,
        result: 6,
        resultRaw: 5.991964293867581,
      },
      resultIndicateur2and3: {
        resultRaw: 0,
        result: 0,
        equivalentEmployeeCountGap: 0,
        equivalentEmployeeCountGapRaw: 0,
        note: 35,
        favorablePopulation: "equality",
        noteEquivalentEmployeeCountGap: 35,
        notePercent: 35,
        ifadvantage: "equality",
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
        note: 0,
        result: 0,
        resultRaw: 0,
      },
      result: {
        favorablePopulation: "equality",
        resultRaw: 84,
        result: 84,
        note: 84,
      },
    },
  ])(
    "%#) Vérifier le calcul sur computerHelper",
    ({
      effectifs,
      indicateur1,
      indicateur2and3,
      indicateur4,
      indicateur5,
      resultIndicateur1,
      resultIndicateur2and3,
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
        indicateur2and3,
        // @ts-ignore
        indicateur4,
        indicateur5,
      });

      const {
        resultIndicateurUn,
        resultIndicateurDeuxTrois,
        resultIndicateurQuatre,
        resultIndicateurCinq,
        resultIndex,
      } = computerHelperResult;

      expect(resultIndicateurUn.favorablePopulation).toEqual(resultIndicateur1.favorablePopulation);
      expect(resultIndicateurUn.note).toEqual(resultIndicateur1.note);
      expect(resultIndicateurUn.result).toEqual(resultIndicateur1.result);

      if (typeof resultIndicateur2and3 !== "boolean" && resultIndicateurDeuxTrois) {
        expect(resultIndicateurDeuxTrois.favorablePopulation).toEqual(resultIndicateur2and3.favorablePopulation);
        expect(resultIndicateurDeuxTrois.note).toEqual(resultIndicateur2and3.note);
        expect(resultIndicateurDeuxTrois.result).toEqual(resultIndicateur2and3.result);
      }

      if (typeof resultIndicateur4 !== "boolean" && resultIndicateurQuatre) {
        // @ts-ignore
        expect(resultIndicateurQuatre.favorablePopulation).toEqual(resultIndicateur4.favorablePopulation);
        // @ts-ignore
        expect(resultIndicateurQuatre.note).toEqual(resultIndicateur4.note);
        // @ts-ignore
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
