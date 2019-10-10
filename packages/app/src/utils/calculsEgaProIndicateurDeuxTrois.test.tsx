import stateComplete from "../__fixtures__/stateComplete";
import { calculBarem, calculNote } from "./calculsEgaProIndicateurDeuxTrois";
import calculIndicateurDeuxTrois from "./calculsEgaProIndicateurDeuxTrois";
import { AppState } from "../globals";

///////////////////////
// INDICATEUR 2 et 3 //
///////////////////////

describe("calculBarem", () => {
  test("test barem", () => {
    expect(calculBarem(0)).toEqual(35);
    expect(calculBarem(2)).toEqual(35);
    expect(calculBarem(2.1)).toEqual(25);
    expect(calculBarem(5)).toEqual(25);
    expect(calculBarem(5.1)).toEqual(15);
    expect(calculBarem(10)).toEqual(15);
    expect(calculBarem(10.1)).toEqual(0);
    expect(calculBarem(100)).toEqual(0);
  });
});

describe("calculNote", () => {
  test("cant calcul note", () => {
    expect(calculNote(undefined, undefined)).toEqual(undefined);
    expect(calculNote(1, undefined)).toEqual(undefined);
    expect(calculNote(undefined, 1)).toEqual(undefined);
  });

  test("test max of both notes", () => {
    expect(calculNote(15, 0)).toEqual(35);
    expect(calculNote(0, 15)).toEqual(35);
  });
});

describe("test calculIndicateurDeuxTrois", () => {
  const state: AppState = {
    ...stateComplete,
    effectif: {
      formValidated: "Valid",
      nombreSalaries: [
        {
          categorieSocioPro: 0,
          tranchesAges: [
            {
              nombreSalariesFemmes: 0,
              nombreSalariesHommes: 2,
              trancheAge: 0
            },
            {
              nombreSalariesFemmes: 0,
              nombreSalariesHommes: 1,
              trancheAge: 1
            },
            {
              nombreSalariesFemmes: 0,
              nombreSalariesHommes: 0,
              trancheAge: 2
            },
            {
              nombreSalariesFemmes: 0,
              nombreSalariesHommes: 1,
              trancheAge: 3
            }
          ]
        },
        {
          categorieSocioPro: 1,
          tranchesAges: [
            {
              nombreSalariesFemmes: 9,
              nombreSalariesHommes: 4,
              trancheAge: 0
            },
            {
              nombreSalariesFemmes: 8,
              nombreSalariesHommes: 3,
              trancheAge: 1
            },
            {
              nombreSalariesFemmes: 4,
              nombreSalariesHommes: 3,
              trancheAge: 2
            },
            {
              nombreSalariesFemmes: 2,
              nombreSalariesHommes: 1,
              trancheAge: 3
            }
          ]
        },
        {
          categorieSocioPro: 2,
          tranchesAges: [
            {
              nombreSalariesFemmes: 2,
              nombreSalariesHommes: 1,
              trancheAge: 0
            },
            {
              nombreSalariesFemmes: 2,
              nombreSalariesHommes: 2,
              trancheAge: 1
            },
            {
              nombreSalariesFemmes: 3,
              nombreSalariesHommes: 6,
              trancheAge: 2
            },
            {
              nombreSalariesFemmes: 0,
              nombreSalariesHommes: 2,
              trancheAge: 3
            }
          ]
        },
        {
          categorieSocioPro: 3,
          tranchesAges: [
            {
              nombreSalariesFemmes: 0,
              nombreSalariesHommes: 1,
              trancheAge: 0
            },
            {
              nombreSalariesFemmes: 0,
              nombreSalariesHommes: 1,
              trancheAge: 1
            },
            {
              nombreSalariesFemmes: 0,
              nombreSalariesHommes: 0,
              trancheAge: 2
            },
            {
              nombreSalariesFemmes: 0,
              nombreSalariesHommes: 0,
              trancheAge: 3
            }
          ]
        }
      ]
    },
    indicateurDeuxTrois: {
      formValidated: "Valid",
      memePeriodeReference: true,
      nombreAugmentationPromotionFemmes: 2,
      nombreAugmentationPromotionHommes: 5,
      presenceAugmentationPromotion: true,
      periodeReferenceDebut: "",
      periodeReferenceFin: ""
    }
  };
  test("test data", () => {
    expect(calculIndicateurDeuxTrois(state)).toMatchSnapshot();
  });
});
