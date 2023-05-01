import {
  type IndicateurUnOrigin,
  updateIndicateurUn,
  type IndicateurUnDestination,
} from "@/../scripts/sql-scripts/migrate-simulations-helpers";
import { type Any } from "@common/utils/types";
import pick from "lodash/pick";

function expectForUnchangedProperties(
  indicateurUnOrigin: IndicateurUnOrigin,
  indicateurUnDestination: IndicateurUnDestination,
) {
  const keys = [
    "coefficientGroupFormValidated",
    "motifNonCalculable",
    "nombreCoefficients",
    "nonCalculable",
    "noteFinale",
    "resultatFinal",
    "sexeSurRepresente",
  ];

  expect(pick(indicateurUnOrigin, keys)).toStrictEqual(pick(indicateurUnDestination, keys));
}

function expectsForCsp(indicateurUnOrigin: IndicateurUnOrigin, indicateurUnDestination: IndicateurUnDestination) {
  expectForUnchangedProperties(indicateurUnOrigin, indicateurUnDestination);

  expect((indicateurUnDestination as Any).csp).toBeUndefined();
  expect((indicateurUnDestination as Any).coef).toBeUndefined();
  expect((indicateurUnDestination as Any).autre).toBeUndefined();
  expect(indicateurUnDestination.modaliteCalcul).toBe("csp");
  expect(indicateurUnDestination.modaliteCalculformValidated).toBe("Valid");
  expect(indicateurUnDestination.formValidated).toBe("Valid");
  expect(indicateurUnDestination.coefficientGroupFormValidated).toBe("None");
  expect(indicateurUnDestination.coefficientEffectifFormValidated).toBe("None");
  expect(indicateurUnDestination.coefficientRemuFormValidated).toBe("None");
  expect(indicateurUnDestination.remunerationsAnnuelles).toStrictEqual(indicateurUnOrigin.remunerationAnnuelle);
  expect(indicateurUnDestination.coefficients).toStrictEqual(indicateurUnOrigin.coefficient);
}

function expectsForCoef(indicateurUnOrigin: IndicateurUnOrigin, indicateurUnDestination: IndicateurUnDestination) {
  expectForUnchangedProperties(indicateurUnOrigin, indicateurUnDestination);

  expect((indicateurUnDestination as Any).csp).toBeUndefined();
  expect((indicateurUnDestination as Any).coef).toBeUndefined();
  expect((indicateurUnDestination as Any).autre).toBeUndefined();
  expect(indicateurUnDestination.modaliteCalculformValidated).toBe("Valid");
  expect(indicateurUnDestination.formValidated).toBe("Valid");
  expect(indicateurUnDestination.coefficientGroupFormValidated).toBe("Valid");
  expect(indicateurUnDestination.coefficientEffectifFormValidated).toBe("Valid");
  expect(indicateurUnDestination.coefficientRemuFormValidated).toBe("Valid");
  expect(indicateurUnDestination.remunerationsAnnuelles).toStrictEqual(indicateurUnOrigin.remunerationAnnuelle);

  const coefficients = indicateurUnOrigin.coefficient.map(coefficient => ({
    nom: coefficient.name,
    tranchesAges: coefficient.tranchesAges,
  }));

  expect(indicateurUnDestination.coefficients).toStrictEqual(coefficients);
}

describe("Tests for CSP", () => {
  test("should be ok for indicateurUn with CSP, old shape (3 booleans instead of modaliteCalcul)", () => {
    const indicateurUnOrigin: IndicateurUnOrigin = {
      csp: true,
      coef: false,
      autre: false,
      noteFinale: 27,
      coefficient: [],
      formValidated: "Valid",
      nonCalculable: false,
      resultatFinal: 9.2638,
      sexeSurRepresente: "femmes",
      motifNonCalculable: "",
      remunerationAnnuelle: [
        {
          tranchesAges: [{ trancheAge: 0 }, { trancheAge: 1 }, { trancheAge: 2 }, { trancheAge: 3 }],
          categorieSocioPro: 0,
        },
        {
          tranchesAges: [
            { trancheAge: 0 },
            {
              trancheAge: 1,
              ecartTauxRemuneration: -0.160407,
              remunerationAnnuelleBrutFemmes: 14.83,
              remunerationAnnuelleBrutHommes: 12.78,
            },
            { trancheAge: 2 },
            {
              trancheAge: 3,
              ecartTauxRemuneration: -0.107098,
              remunerationAnnuelleBrutFemmes: 17.47,
              remunerationAnnuelleBrutHommes: 15.78,
            },
          ],
          categorieSocioPro: 1,
        },
        {
          tranchesAges: [{ trancheAge: 0 }, { trancheAge: 1 }, { trancheAge: 2 }, { trancheAge: 3 }],
          categorieSocioPro: 2,
        },
        {
          tranchesAges: [{ trancheAge: 0 }, { trancheAge: 1 }, { trancheAge: 2 }, { trancheAge: 3 }],
          categorieSocioPro: 3,
        },
      ],
      coefficientGroupFormValidated: "None",
      coefficientEffectifFormValidated: "None",
    };

    const indicateurUnDestination = updateIndicateurUn(indicateurUnOrigin);

    expectsForCsp(indicateurUnOrigin, indicateurUnDestination);
  });

  test("should be ok with CSP n°2 (with modaliteCalcul already present)", () => {
    const indicateurUnOrigin: IndicateurUnOrigin = {
      csp: true,
      coef: false,
      autre: false,
      noteFinale: 37,
      coefficient: [],
      formValidated: "Valid",
      nonCalculable: false,
      resultatFinal: 2.7189,
      modaliteCalcul: "csp",
      sexeSurRepresente: "femmes",
      motifNonCalculable: "",
      remunerationAnnuelle: [
        {
          tranchesAges: [{ trancheAge: 0 }, { trancheAge: 1 }, { trancheAge: 2 }, { trancheAge: 3 }],
          categorieSocioPro: 0,
        },
        {
          tranchesAges: [{ trancheAge: 0 }, { trancheAge: 1 }, { trancheAge: 2 }, { trancheAge: 3 }],
          categorieSocioPro: 1,
        },
        {
          tranchesAges: [{ trancheAge: 0 }, { trancheAge: 1 }, { trancheAge: 2 }, { trancheAge: 3 }],
          categorieSocioPro: 2,
        },
        {
          tranchesAges: [
            {
              trancheAge: 0,
              ecartTauxRemuneration: -0.048005,
              remunerationAnnuelleBrutFemmes: 359.56,
              remunerationAnnuelleBrutHommes: 343.09,
            },
            {
              trancheAge: 1,
              ecartTauxRemuneration: -0.134071,
              remunerationAnnuelleBrutFemmes: 441.46,
              remunerationAnnuelleBrutHommes: 389.27,
            },
            {
              trancheAge: 2,
              ecartTauxRemuneration: -0.064232,
              remunerationAnnuelleBrutFemmes: 459.94,
              remunerationAnnuelleBrutHommes: 432.18,
            },
            {
              trancheAge: 3,
              ecartTauxRemuneration: -0.041926,
              remunerationAnnuelleBrutFemmes: 429.68,
              remunerationAnnuelleBrutHommes: 412.39,
            },
          ],
          categorieSocioPro: 3,
        },
      ],
      coefficientGroupFormValidated: "None",
      coefficientEffectifFormValidated: "None",
    };

    const indicateurUnDestination = updateIndicateurUn(indicateurUnOrigin);

    expectsForCsp(indicateurUnOrigin, indicateurUnDestination);
  });

  test("should be ok for CSP n°3", () => {
    const indicateurUnOrigin: IndicateurUnOrigin = {
      csp: true,
      coef: false,
      autre: false,
      noteFinale: 38,
      coefficient: [],
      formValidated: "Valid",
      nonCalculable: false,
      resultatFinal: 1.911,
      sexeSurRepresente: "hommes",
      motifNonCalculable: "",
      remunerationAnnuelle: [
        {
          tranchesAges: [{ trancheAge: 0 }, { trancheAge: 1 }, { trancheAge: 2 }, { trancheAge: 3 }],
          categorieSocioPro: 0,
        },
        {
          tranchesAges: [
            { trancheAge: 0 },
            {
              trancheAge: 1,
              ecartTauxRemuneration: -0.012104,
              remunerationAnnuelleBrutFemmes: 24.9683,
              remunerationAnnuelleBrutHommes: 24.6697,
            },
            {
              trancheAge: 2,
              ecartTauxRemuneration: 0.021546,
              remunerationAnnuelleBrutFemmes: 26.2713,
              remunerationAnnuelleBrutHommes: 26.8498,
            },
            {
              trancheAge: 3,
              ecartTauxRemuneration: 0.089268,
              remunerationAnnuelleBrutFemmes: 24.1618,
              remunerationAnnuelleBrutHommes: 26.5301,
            },
          ],
          categorieSocioPro: 1,
        },
        {
          tranchesAges: [{ trancheAge: 0 }, { trancheAge: 1 }, { trancheAge: 2 }, { trancheAge: 3 }],
          categorieSocioPro: 2,
        },
        {
          tranchesAges: [{ trancheAge: 0 }, { trancheAge: 1 }, { trancheAge: 2 }, { trancheAge: 3 }],
          categorieSocioPro: 3,
        },
      ],
      motifNonCalculablePrecision: "",
      coefficientGroupFormValidated: "None",
      coefficientEffectifFormValidated: "None",
    };

    const indicateurUnDestination = updateIndicateurUn(indicateurUnOrigin);

    expectsForCsp(indicateurUnOrigin, indicateurUnDestination);
  });

  test("csp n°4", () => {
    // TODO: gérer ce cas. Il a une modaliteCalcul et pas de champ csp, coef, autre. Pourtant, il est dans l'ancien mode.
    // Donc ajouter les champs modaliteCalculformValidated, coefficientRemuFormValidated, remunerationsAnnuelles, coefficients.
    // Se baser sur modaliteCalculformValidated pour savoir si on est dans l'ancien mode ou pas.
    const indicateurUnOrigin: IndicateurUnOrigin = {
      noteFinale: 40,
      coefficient: [],
      formValidated: "Valid",
      nonCalculable: false,
      resultatFinal: 0.0257,
      modaliteCalcul: "csp",
      sexeSurRepresente: "hommes",
      motifNonCalculable: "",
      remunerationAnnuelle: [
        {
          tranchesAges: [{ trancheAge: 0 }, { trancheAge: 1 }, { trancheAge: 2 }, { trancheAge: 3 }],
          categorieSocioPro: 0,
        },
        {
          tranchesAges: [
            {
              trancheAge: 0,
              ecartTauxRemuneration: -0.044196,
              remunerationAnnuelleBrutFemmes: 23.0525,
              remunerationAnnuelleBrutHommes: 22.0768,
            },
            {
              trancheAge: 1,
              ecartTauxRemuneration: 0.051283,
              remunerationAnnuelleBrutFemmes: 20.7123,
              remunerationAnnuelleBrutHommes: 21.8319,
            },
            {
              trancheAge: 2,
              ecartTauxRemuneration: 0.044369,
              remunerationAnnuelleBrutFemmes: 19.7356,
              remunerationAnnuelleBrutHommes: 20.6519,
            },
            {
              trancheAge: 3,
              ecartTauxRemuneration: 0.044291,
              remunerationAnnuelleBrutFemmes: 20.5745,
              remunerationAnnuelleBrutHommes: 21.528,
            },
          ],
          categorieSocioPro: 1,
        },
        {
          tranchesAges: [{ trancheAge: 0 }, { trancheAge: 1 }, { trancheAge: 2 }, { trancheAge: 3 }],
          categorieSocioPro: 2,
        },
        {
          tranchesAges: [{ trancheAge: 0 }, { trancheAge: 1 }, { trancheAge: 2 }, { trancheAge: 3 }],
          categorieSocioPro: 3,
        },
      ],
      coefficientGroupFormValidated: "None",
      coefficientEffectifFormValidated: "None",
    };

    const indicateurUnDestination = updateIndicateurUn(indicateurUnOrigin);

    expectsForCsp(indicateurUnOrigin, indicateurUnDestination);
  });
});

describe("Tests for coef", () => {
  test("should be ok for coef", () => {
    const indicateurUnOrigin: IndicateurUnOrigin = {
      csp: false,
      coef: true,
      autre: false,
      noteFinale: 25,
      coefficient: [
        {
          name: "Niveau 1-2-3",
          tranchesAges: [
            {
              trancheAge: 0,
              nombreSalariesFemmes: 0,
              nombreSalariesHommes: 1,
            },
            {
              trancheAge: 1,
              nombreSalariesFemmes: 1,
              nombreSalariesHommes: 1,
            },
            {
              trancheAge: 2,
              nombreSalariesFemmes: 4,
              nombreSalariesHommes: 4,
              remunerationAnnuelleBrutFemmes: 24325,
              remunerationAnnuelleBrutHommes: 24212,
            },
            {
              trancheAge: 3,
              nombreSalariesFemmes: 3,
              nombreSalariesHommes: 7,
              remunerationAnnuelleBrutFemmes: 24036,
              remunerationAnnuelleBrutHommes: 24643,
            },
          ],
        },
        {
          name: "Niveau 4-5-6",
          tranchesAges: [
            {
              trancheAge: 0,
              nombreSalariesFemmes: 2,
              nombreSalariesHommes: 0,
            },
            {
              trancheAge: 1,
              nombreSalariesFemmes: 6,
              nombreSalariesHommes: 3,
              remunerationAnnuelleBrutFemmes: 27313,
              remunerationAnnuelleBrutHommes: 29126,
            },
            {
              trancheAge: 2,
              nombreSalariesFemmes: 6,
              nombreSalariesHommes: 2,
            },
            {
              trancheAge: 3,
              nombreSalariesFemmes: 3,
              nombreSalariesHommes: 2,
            },
          ],
        },
        {
          name: "Niveau 7-8_9",
          tranchesAges: [
            {
              trancheAge: 0,
              nombreSalariesFemmes: 1,
              nombreSalariesHommes: 1,
            },
            {
              trancheAge: 1,
              nombreSalariesFemmes: 8,
              nombreSalariesHommes: 4,
              remunerationAnnuelleBrutFemmes: 44561,
              remunerationAnnuelleBrutHommes: 54495,
            },
            {
              trancheAge: 2,
              nombreSalariesFemmes: 4,
              nombreSalariesHommes: 4,
              remunerationAnnuelleBrutFemmes: 48587,
              remunerationAnnuelleBrutHommes: 72339,
            },
            {
              trancheAge: 3,
              nombreSalariesFemmes: 4,
              nombreSalariesHommes: 9,
              remunerationAnnuelleBrutFemmes: 60341,
              remunerationAnnuelleBrutHommes: 68926,
            },
          ],
        },
        {
          name: "Niveau 10-11-12",
          tranchesAges: [
            {
              trancheAge: 0,
              nombreSalariesFemmes: 0,
              nombreSalariesHommes: 0,
            },
            {
              trancheAge: 1,
              nombreSalariesFemmes: 0,
              nombreSalariesHommes: 0,
            },
            {
              trancheAge: 2,
              nombreSalariesFemmes: 0,
              nombreSalariesHommes: 3,
            },
            {
              trancheAge: 3,
              nombreSalariesFemmes: 0,
              nombreSalariesHommes: 1,
            },
          ],
        },
      ],
      formValidated: "Valid",
      resultatFinal: 10.3332,
      sexeSurRepresente: "hommes",
      motifNonCalculable: "",
      nombreCoefficients: 4,
      remunerationAnnuelle: [
        {
          tranchesAges: [{ trancheAge: 0 }, { trancheAge: 1 }, { trancheAge: 2 }, { trancheAge: 3 }],
          categorieSocioPro: 0,
        },
        {
          tranchesAges: [{ trancheAge: 0 }, { trancheAge: 1 }, { trancheAge: 2 }, { trancheAge: 3 }],
          categorieSocioPro: 1,
        },
        {
          tranchesAges: [
            { trancheAge: 0 },
            {
              trancheAge: 1,
              remunerationAnnuelleBrutFemmes: 2294,
              remunerationAnnuelleBrutHommes: 2427,
            },
            { trancheAge: 2 },
            { trancheAge: 3 },
          ],
          categorieSocioPro: 2,
        },
        {
          tranchesAges: [
            { trancheAge: 0 },
            {
              trancheAge: 1,
              remunerationAnnuelleBrutFemmes: 3713,
              remunerationAnnuelleBrutHommes: 4541,
            },
            { trancheAge: 2 },
            { trancheAge: 3 },
          ],
          categorieSocioPro: 3,
        },
      ],
      motifNonCalculablePrecision: "",
      coefficientGroupFormValidated: "Valid",
      coefficientEffectifFormValidated: "Valid",
    };

    const indicateurUnDestination = updateIndicateurUn(indicateurUnOrigin);

    expect(indicateurUnDestination.modaliteCalcul).toBe("coef");
    expectsForCoef(indicateurUnOrigin, indicateurUnDestination);
  });

  test("should be ok for coef n°2", () => {
    const indicateurUnOrigin: IndicateurUnOrigin = {
      csp: false,
      coef: true,
      autre: false,
      noteFinale: 38,
      coefficient: [
        {
          name: "EMPLOYÉS N1",
          tranchesAges: [
            {
              trancheAge: 0,
              nombreSalariesFemmes: 25,
              nombreSalariesHommes: 55,
              remunerationAnnuelleBrutFemmes: 19270,
              remunerationAnnuelleBrutHommes: 19349,
            },
            {
              trancheAge: 1,
              nombreSalariesFemmes: 15,
              nombreSalariesHommes: 29,
              remunerationAnnuelleBrutFemmes: 19380,
              remunerationAnnuelleBrutHommes: 19167,
            },
            {
              trancheAge: 2,
              nombreSalariesFemmes: 6,
              nombreSalariesHommes: 14,
              remunerationAnnuelleBrutFemmes: 19496,
              remunerationAnnuelleBrutHommes: 19367,
            },
            { trancheAge: 3, nombreSalariesFemmes: 2, nombreSalariesHommes: 9 },
          ],
        },
        {
          name: "EMPLOYÉS N2",
          tranchesAges: [
            {
              trancheAge: 0,
              nombreSalariesFemmes: 49,
              nombreSalariesHommes: 28,
              remunerationAnnuelleBrutFemmes: 19354,
              remunerationAnnuelleBrutHommes: 19689,
            },
            {
              trancheAge: 1,
              nombreSalariesFemmes: 25,
              nombreSalariesHommes: 19,
              remunerationAnnuelleBrutFemmes: 19978,
              remunerationAnnuelleBrutHommes: 20104,
            },
            {
              trancheAge: 2,
              nombreSalariesFemmes: 25,
              nombreSalariesHommes: 10,
              remunerationAnnuelleBrutFemmes: 19846,
              remunerationAnnuelleBrutHommes: 20775,
            },
            {
              trancheAge: 3,
              nombreSalariesFemmes: 29,
              nombreSalariesHommes: 10,
              remunerationAnnuelleBrutFemmes: 20031,
              remunerationAnnuelleBrutHommes: 20205,
            },
          ],
        },
        {
          name: "EMPLOYÉS N3",
          tranchesAges: [
            {
              trancheAge: 0,
              nombreSalariesFemmes: 4,
              nombreSalariesHommes: 4,
              remunerationAnnuelleBrutFemmes: 20751,
              remunerationAnnuelleBrutHommes: 20520,
            },
            {
              trancheAge: 1,
              nombreSalariesFemmes: 5,
              nombreSalariesHommes: 6,
              remunerationAnnuelleBrutFemmes: 20938,
              remunerationAnnuelleBrutHommes: 20658,
            },
            {
              trancheAge: 2,
              nombreSalariesFemmes: 5,
              nombreSalariesHommes: 6,
              remunerationAnnuelleBrutFemmes: 21344,
              remunerationAnnuelleBrutHommes: 22466,
            },
            {
              trancheAge: 3,
              nombreSalariesFemmes: 14,
              nombreSalariesHommes: 7,
              remunerationAnnuelleBrutFemmes: 20419,
              remunerationAnnuelleBrutHommes: 21627,
            },
          ],
        },
        {
          name: "EMPLOYÉS N4",
          tranchesAges: [
            { trancheAge: 0, nombreSalariesFemmes: 0, nombreSalariesHommes: 4 },
            {
              trancheAge: 1,
              nombreSalariesFemmes: 7,
              nombreSalariesHommes: 13,
              remunerationAnnuelleBrutFemmes: 21507,
              remunerationAnnuelleBrutHommes: 22622,
            },
            { trancheAge: 2, nombreSalariesFemmes: 2, nombreSalariesHommes: 15 },
            {
              trancheAge: 3,
              nombreSalariesFemmes: 5,
              nombreSalariesHommes: 4,
              remunerationAnnuelleBrutFemmes: 22574,
              remunerationAnnuelleBrutHommes: 26473,
            },
          ],
        },
        {
          name: "AGENTS DE MAITRISE N5",
          tranchesAges: [
            { trancheAge: 0, nombreSalariesFemmes: 0, nombreSalariesHommes: 0 },
            { trancheAge: 1, nombreSalariesFemmes: 0, nombreSalariesHommes: 0 },
            { trancheAge: 2, nombreSalariesFemmes: 3, nombreSalariesHommes: 0 },
            { trancheAge: 3, nombreSalariesFemmes: 2, nombreSalariesHommes: 0 },
          ],
        },
        {
          name: "AGENTS DE MAITRISE N6",
          tranchesAges: [
            { trancheAge: 0, nombreSalariesFemmes: 1, nombreSalariesHommes: 1 },
            { trancheAge: 1, nombreSalariesFemmes: 5, nombreSalariesHommes: 2 },
            {
              trancheAge: 2,
              nombreSalariesFemmes: 6,
              nombreSalariesHommes: 5,
              remunerationAnnuelleBrutFemmes: 28440,
              remunerationAnnuelleBrutHommes: 29927,
            },
            {
              trancheAge: 3,
              nombreSalariesFemmes: 3,
              nombreSalariesHommes: 5,
              remunerationAnnuelleBrutFemmes: 29483,
              remunerationAnnuelleBrutHommes: 38024,
            },
          ],
        },
        {
          name: "CADRES N7",
          tranchesAges: [
            { trancheAge: 0, nombreSalariesFemmes: 0, nombreSalariesHommes: 0 },
            { trancheAge: 1, nombreSalariesFemmes: 2, nombreSalariesHommes: 4 },
            {
              trancheAge: 2,
              nombreSalariesFemmes: 3,
              nombreSalariesHommes: 10,
              remunerationAnnuelleBrutFemmes: 42181,
              remunerationAnnuelleBrutHommes: 40131,
            },
            { trancheAge: 3, nombreSalariesFemmes: 2, nombreSalariesHommes: 3 },
          ],
        },
        {
          name: "CADRES N8",
          tranchesAges: [
            { trancheAge: 0, nombreSalariesFemmes: 0, nombreSalariesHommes: 0 },
            { trancheAge: 1, nombreSalariesFemmes: 0, nombreSalariesHommes: 0 },
            { trancheAge: 2, nombreSalariesFemmes: 1, nombreSalariesHommes: 4 },
            { trancheAge: 3, nombreSalariesFemmes: 1, nombreSalariesHommes: 4 },
          ],
        },
        {
          name: "CADRES N9",
          tranchesAges: [
            { trancheAge: 0, nombreSalariesFemmes: 0, nombreSalariesHommes: 0 },
            { trancheAge: 1, nombreSalariesFemmes: 0, nombreSalariesHommes: 0 },
            { trancheAge: 2, nombreSalariesFemmes: 0, nombreSalariesHommes: 1 },
            { trancheAge: 3, nombreSalariesFemmes: 0, nombreSalariesHommes: 0 },
          ],
        },
      ],
      formValidated: "Valid",
      resultatFinal: 1.1615,
      sexeSurRepresente: "hommes",
      motifNonCalculable: "",
      nombreCoefficients: 9,
      remunerationAnnuelle: [
        {
          tranchesAges: [{ trancheAge: 0 }, { trancheAge: 1 }, { trancheAge: 2 }, { trancheAge: 3 }],
          categorieSocioPro: 0,
        },
        {
          tranchesAges: [{ trancheAge: 0 }, { trancheAge: 1 }, { trancheAge: 2 }, { trancheAge: 3 }],
          categorieSocioPro: 1,
        },
        {
          tranchesAges: [{ trancheAge: 0 }, { trancheAge: 1 }, { trancheAge: 2 }, { trancheAge: 3 }],
          categorieSocioPro: 2,
        },
        {
          tranchesAges: [{ trancheAge: 0 }, { trancheAge: 1 }, { trancheAge: 2 }, { trancheAge: 3 }],
          categorieSocioPro: 3,
        },
      ],
      motifNonCalculablePrecision: "",
      coefficientGroupFormValidated: "Valid",
      coefficientEffectifFormValidated: "Valid",
    };

    const indicateurUnDestination = updateIndicateurUn(indicateurUnOrigin);

    expect(indicateurUnDestination.modaliteCalcul).toEqual("coef");
    expectsForCoef(indicateurUnOrigin, indicateurUnDestination);
  });
});

describe("Tests for coef autre", () => {
  test("should fix bug with coef autre with new shape", () => {
    // This case shows a coef as true and modaliteCalcul as csp, but the modaliteCalcul should be "autre". So we need to check the fix.
    const indicateurUnOrigin: IndicateurUnOrigin = {
      csp: false,
      coef: false,
      autre: true,
      noteFinale: 27,
      coefficient: [
        {
          name: "Groupe Ouvriers",
          tranchesAges: [
            {
              trancheAge: 0,
              nombreSalariesFemmes: 0,
              nombreSalariesHommes: 0,
            },
            {
              trancheAge: 1,
              nombreSalariesFemmes: 0,
              nombreSalariesHommes: 0,
            },
            {
              trancheAge: 2,
              nombreSalariesFemmes: 0,
              nombreSalariesHommes: 0,
            },
            {
              trancheAge: 3,
              nombreSalariesFemmes: 0,
              nombreSalariesHommes: 0,
            },
          ],
        },
        {
          name: "Groupe Employés",
          tranchesAges: [
            {
              trancheAge: 0,
              nombreSalariesFemmes: 0,
              nombreSalariesHommes: 0,
              ecartTauxRemuneration: 0.244241,
              remunerationAnnuelleBrutFemmes: 319.24,
              remunerationAnnuelleBrutHommes: 422.41,
            },
            {
              trancheAge: 1,
              nombreSalariesFemmes: 0,
              nombreSalariesHommes: 3,
              ecartTauxRemuneration: 0.163774,
              remunerationAnnuelleBrutFemmes: 303.09,
              remunerationAnnuelleBrutHommes: 362.45,
            },
            {
              trancheAge: 2,
              nombreSalariesFemmes: 0,
              nombreSalariesHommes: 1,
              ecartTauxRemuneration: 0.185326,
              remunerationAnnuelleBrutFemmes: 328.99,
              remunerationAnnuelleBrutHommes: 403.83,
            },
            {
              trancheAge: 3,
              nombreSalariesFemmes: 1,
              nombreSalariesHommes: 3,
            },
          ],
        },
        {
          name: "Groupe Techniciens et agents de maitrise",
          tranchesAges: [
            {
              trancheAge: 0,
              nombreSalariesFemmes: 4,
              nombreSalariesHommes: 5,
              ecartTauxRemuneration: 0.244241,
              remunerationAnnuelleBrutFemmes: 319.24,
              remunerationAnnuelleBrutHommes: 422.41,
            },
            {
              trancheAge: 1,
              nombreSalariesFemmes: 4,
              nombreSalariesHommes: 8,
              ecartTauxRemuneration: 0.163774,
              remunerationAnnuelleBrutFemmes: 303.09,
              remunerationAnnuelleBrutHommes: 362.45,
            },
            {
              trancheAge: 2,
              nombreSalariesFemmes: 7,
              nombreSalariesHommes: 10,
              ecartTauxRemuneration: 0.153141,
              remunerationAnnuelleBrutFemmes: 338.93,
              remunerationAnnuelleBrutHommes: 400.22,
            },
            {
              trancheAge: 3,
              nombreSalariesFemmes: 2,
              nombreSalariesHommes: 6,
            },
          ],
        },
        {
          name: "Groupe Cadres intermédiaires",
          tranchesAges: [
            {
              trancheAge: 0,
              nombreSalariesFemmes: 2,
              nombreSalariesHommes: 0,
            },
            {
              trancheAge: 1,
              nombreSalariesFemmes: 4,
              nombreSalariesHommes: 7,
              ecartTauxRemuneration: -0.014677,
              remunerationAnnuelleBrutFemmes: 528.89,
              remunerationAnnuelleBrutHommes: 521.24,
            },
            {
              trancheAge: 2,
              nombreSalariesFemmes: 3,
              nombreSalariesHommes: 3,
              ecartTauxRemuneration: -0.146797,
              remunerationAnnuelleBrutFemmes: 634.19,
              remunerationAnnuelleBrutHommes: 553.01,
            },
            {
              trancheAge: 3,
              nombreSalariesFemmes: 3,
              nombreSalariesHommes: 1,
            },
          ],
        },
        {
          name: "Groupe Cadre dirigeants",
          tranchesAges: [
            {
              trancheAge: 0,
              nombreSalariesFemmes: 0,
              nombreSalariesHommes: 0,
            },
            {
              trancheAge: 1,
              nombreSalariesFemmes: 0,
              nombreSalariesHommes: 1,
            },
            {
              trancheAge: 2,
              nombreSalariesFemmes: 1,
              nombreSalariesHommes: 6,
            },
            {
              trancheAge: 3,
              nombreSalariesFemmes: 0,
              nombreSalariesHommes: 0,
            },
          ],
        },
      ],
      formValidated: "Valid",
      nonCalculable: false,
      resultatFinal: 9.5384,
      modaliteCalcul: "csp",
      sexeSurRepresente: "hommes",
      motifNonCalculable: "",
      nombreCoefficients: 5,
      remunerationAnnuelle: [
        {
          tranchesAges: [{ trancheAge: 0 }, { trancheAge: 1 }, { trancheAge: 2 }, { trancheAge: 3 }],
          categorieSocioPro: 0,
        },
        {
          tranchesAges: [{ trancheAge: 0 }, { trancheAge: 1 }, { trancheAge: 2 }, { trancheAge: 3 }],
          categorieSocioPro: 1,
        },
        {
          tranchesAges: [{ trancheAge: 0 }, { trancheAge: 1 }, { trancheAge: 2 }, { trancheAge: 3 }],
          categorieSocioPro: 2,
        },
        {
          tranchesAges: [{ trancheAge: 0 }, { trancheAge: 1 }, { trancheAge: 2 }, { trancheAge: 3 }],
          categorieSocioPro: 3,
        },
      ],
      coefficientGroupFormValidated: "Valid",
      coefficientEffectifFormValidated: "Valid",
    };

    const indicateurUnDestination = updateIndicateurUn(indicateurUnOrigin);

    expect(indicateurUnDestination.modaliteCalcul).toBe("autre");
    expectsForCoef(indicateurUnOrigin, indicateurUnDestination);
  });

  test("should be ok for coef autre n°2", () => {
    const indicateurUnOrigin: IndicateurUnOrigin = {
      csp: false,
      coef: false,
      autre: true,
      noteFinale: 39,
      coefficient: [
        {
          name: "De 160 à 180",
          tranchesAges: [
            {
              trancheAge: 0,
              nombreSalariesFemmes: 0,
              nombreSalariesHommes: 16,
            },
            {
              trancheAge: 1,
              nombreSalariesFemmes: 10,
              nombreSalariesHommes: 13,
              ecartTauxRemuneration: -0.039348,
              remunerationAnnuelleBrutFemmes: 202.07,
              remunerationAnnuelleBrutHommes: 194.42,
            },
            {
              trancheAge: 2,
              nombreSalariesFemmes: 21,
              nombreSalariesHommes: 6,
              ecartTauxRemuneration: -0.066888,
              remunerationAnnuelleBrutFemmes: 202.41,
              remunerationAnnuelleBrutHommes: 189.72,
            },
            {
              trancheAge: 3,
              nombreSalariesFemmes: 10,
              nombreSalariesHommes: 9,
              ecartTauxRemuneration: 0.028301,
              remunerationAnnuelleBrutFemmes: 200.86,
              remunerationAnnuelleBrutHommes: 206.71,
            },
          ],
        },
        {
          name: "De 190 à 250",
          tranchesAges: [
            {
              trancheAge: 0,
              nombreSalariesFemmes: 1,
              nombreSalariesHommes: 1,
            },
            {
              trancheAge: 1,
              nombreSalariesFemmes: 3,
              nombreSalariesHommes: 4,
              ecartTauxRemuneration: 0.170705,
              remunerationAnnuelleBrutFemmes: 229.64,
              remunerationAnnuelleBrutHommes: 276.91,
            },
            {
              trancheAge: 2,
              nombreSalariesFemmes: 4,
              nombreSalariesHommes: 7,
              ecartTauxRemuneration: 0.020079,
              remunerationAnnuelleBrutFemmes: 288.91,
              remunerationAnnuelleBrutHommes: 294.83,
            },
            {
              trancheAge: 3,
              nombreSalariesFemmes: 3,
              nombreSalariesHommes: 5,
              ecartTauxRemuneration: 0.102988,
              remunerationAnnuelleBrutFemmes: 224.89,
              remunerationAnnuelleBrutHommes: 250.71,
            },
          ],
        },
        {
          name: "Sup à 250",
          tranchesAges: [
            {
              trancheAge: 0,
              nombreSalariesFemmes: 0,
              nombreSalariesHommes: 0,
            },
            {
              trancheAge: 1,
              nombreSalariesFemmes: 0,
              nombreSalariesHommes: 1,
            },
            {
              trancheAge: 2,
              nombreSalariesFemmes: 0,
              nombreSalariesHommes: 0,
            },
            {
              trancheAge: 3,
              nombreSalariesFemmes: 1,
              nombreSalariesHommes: 1,
            },
          ],
        },
      ],
      formValidated: "Valid",
      nonCalculable: false,
      resultatFinal: 0.1752,
      sexeSurRepresente: "hommes",
      motifNonCalculable: "",
      nombreCoefficients: 3,
      remunerationAnnuelle: [
        {
          tranchesAges: [{ trancheAge: 0 }, { trancheAge: 1 }, { trancheAge: 2 }, { trancheAge: 3 }],
          categorieSocioPro: 0,
        },
        {
          tranchesAges: [{ trancheAge: 0 }, { trancheAge: 1 }, { trancheAge: 2 }, { trancheAge: 3 }],
          categorieSocioPro: 1,
        },
        {
          tranchesAges: [{ trancheAge: 0 }, { trancheAge: 1 }, { trancheAge: 2 }, { trancheAge: 3 }],
          categorieSocioPro: 2,
        },
        {
          tranchesAges: [{ trancheAge: 0 }, { trancheAge: 1 }, { trancheAge: 2 }, { trancheAge: 3 }],
          categorieSocioPro: 3,
        },
      ],
      motifNonCalculablePrecision: "",
      coefficientGroupFormValidated: "Valid",
      coefficientEffectifFormValidated: "Valid",
    };

    const indicateurUnDestination = updateIndicateurUn(indicateurUnOrigin);

    expect(indicateurUnDestination.modaliteCalcul).toBe("autre");
    expect(indicateurUnDestination.formValidated).toBe("Valid");
  });
});
