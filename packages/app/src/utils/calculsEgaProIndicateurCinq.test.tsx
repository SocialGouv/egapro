import {
  calculIndicateurSexeSousRepresente,
  calculIndicateurNombreSalariesSexeSousRepresente,
  calculNote
} from "./calculsEgaProIndicateurCinq";

it("calculIndicateurSexeSousRepresente", () => {
  expect(calculIndicateurSexeSousRepresente(undefined, undefined)).toEqual(
    undefined
  );
  expect(calculIndicateurSexeSousRepresente(1, undefined)).toEqual(undefined);
  expect(calculIndicateurSexeSousRepresente(undefined, 1)).toEqual(undefined);

  expect(calculIndicateurSexeSousRepresente(-2, -2)).toEqual("egalite");
  expect(calculIndicateurSexeSousRepresente(1, 1)).toEqual("egalite");
  expect(calculIndicateurSexeSousRepresente(10, 10)).toEqual("egalite");

  expect(calculIndicateurSexeSousRepresente(5, 5)).toEqual("egalite");
  expect(calculIndicateurSexeSousRepresente(0, 10)).toEqual("hommes");
  expect(calculIndicateurSexeSousRepresente(10, 0)).toEqual("femmes");
  expect(calculIndicateurSexeSousRepresente(4, 6)).toEqual("hommes");
  expect(calculIndicateurSexeSousRepresente(6, 4)).toEqual("femmes");
  expect(calculIndicateurSexeSousRepresente(1, 9)).toEqual("hommes");
  expect(calculIndicateurSexeSousRepresente(9, 1)).toEqual("femmes");
});

it("calculIndicateurNombreSalariesSexeSousRepresente", () => {
  expect(
    calculIndicateurNombreSalariesSexeSousRepresente(undefined, undefined)
  ).toEqual(undefined);
  expect(
    calculIndicateurNombreSalariesSexeSousRepresente(1, undefined)
  ).toEqual(undefined);
  expect(
    calculIndicateurNombreSalariesSexeSousRepresente(undefined, 1)
  ).toEqual(undefined);

  expect(calculIndicateurNombreSalariesSexeSousRepresente(-2, -2)).toEqual(-2);
  expect(calculIndicateurNombreSalariesSexeSousRepresente(1, 1)).toEqual(1);
  expect(calculIndicateurNombreSalariesSexeSousRepresente(10, 10)).toEqual(10);

  expect(calculIndicateurNombreSalariesSexeSousRepresente(5, 5)).toEqual(5);
  expect(calculIndicateurNombreSalariesSexeSousRepresente(0, 10)).toEqual(0);
  expect(calculIndicateurNombreSalariesSexeSousRepresente(10, 0)).toEqual(0);
  expect(calculIndicateurNombreSalariesSexeSousRepresente(4, 6)).toEqual(4);
  expect(calculIndicateurNombreSalariesSexeSousRepresente(6, 4)).toEqual(4);
  expect(calculIndicateurNombreSalariesSexeSousRepresente(1, 9)).toEqual(1);
  expect(calculIndicateurNombreSalariesSexeSousRepresente(9, 1)).toEqual(1);
});

it("calculNote", () => {
  expect(calculNote(undefined)).toEqual(undefined);
  expect(calculNote(0)).toEqual(0);
  expect(calculNote(1)).toEqual(0);
  expect(calculNote(2)).toEqual(5);
  expect(calculNote(3)).toEqual(5);
  expect(calculNote(4)).toEqual(10);
  expect(calculNote(5)).toEqual(10);

  expect(calculNote(-1)).toEqual(0);
  expect(calculNote(6)).toEqual(10);
});
