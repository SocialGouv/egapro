import {
  calculIndicateurCalculable,
  calculIndicateurEcartNombreSalarieesAugmentees,
  calculNote
} from "./calculsEgaProIndicateurQuatre";

//////////////////
// INDICATEUR 4 //
//////////////////

it("calculIndicateurCalculable", () => {
  expect(calculIndicateurCalculable(false, false, undefined)).toEqual(false);
  expect(calculIndicateurCalculable(true, false, undefined)).toEqual(false);
  expect(calculIndicateurCalculable(true, true, undefined)).toEqual(false);
  expect(calculIndicateurCalculable(false, true, 10)).toEqual(false);
  expect(calculIndicateurCalculable(true, false, 10)).toEqual(false);
  expect(calculIndicateurCalculable(false, false, 10)).toEqual(false);
  expect(calculIndicateurCalculable(true, true, 0)).toEqual(false);
  expect(calculIndicateurCalculable(true, true, -1)).toEqual(false);

  expect(calculIndicateurCalculable(true, true, 1)).toEqual(true);
  expect(calculIndicateurCalculable(true, true, 10)).toEqual(true);
});

it("calculIndicateurEcartNombreSalarieesAugmentees", () => {
  expect(
    calculIndicateurEcartNombreSalarieesAugmentees(false, undefined, undefined)
  ).toEqual(undefined);
  expect(
    calculIndicateurEcartNombreSalarieesAugmentees(false, 12, undefined)
  ).toEqual(undefined);
  expect(
    calculIndicateurEcartNombreSalarieesAugmentees(false, undefined, 6)
  ).toEqual(undefined);
  expect(calculIndicateurEcartNombreSalarieesAugmentees(false, 12, 6)).toEqual(
    undefined
  );

  expect(calculIndicateurEcartNombreSalarieesAugmentees(true, 12, 6)).toEqual(
    50
  );
  expect(calculIndicateurEcartNombreSalarieesAugmentees(true, 20, 15)).toEqual(
    75
  );
  expect(calculIndicateurEcartNombreSalarieesAugmentees(true, 5, 5)).toEqual(
    100
  );
  expect(calculIndicateurEcartNombreSalarieesAugmentees(true, 5, 0)).toEqual(0);
});

it("calculNote", () => {
  expect(calculNote(undefined)).toEqual(undefined);
  expect(calculNote(0)).toEqual(0);
  expect(calculNote(10)).toEqual(0);
  expect(calculNote(23)).toEqual(0);
  expect(calculNote(99)).toEqual(0);
  expect(calculNote(100)).toEqual(15);
});
