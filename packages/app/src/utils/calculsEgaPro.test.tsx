import {
  calculEffectifsValides,
  calculEcartPondere,
  calculTotalEcartPondere,
  calculEffectifsIndicateurCalculable
} from "./calculsEgaPro";

//////////////////
// COMMON ////////
//////////////////

it("calculEffectifsValides", () => {
  expect(calculEffectifsValides(false, -1, -2)).toEqual(0);
  expect(calculEffectifsValides(false, 4, -2)).toEqual(0);

  expect(calculEffectifsValides(false, 0, 0)).toEqual(0);
  expect(calculEffectifsValides(false, 1, 1)).toEqual(0);
  expect(calculEffectifsValides(false, 2, 1)).toEqual(0);
  expect(calculEffectifsValides(false, 2, 3)).toEqual(0);
  expect(calculEffectifsValides(false, 4, 2)).toEqual(0);

  expect(calculEffectifsValides(true, 3, 3)).toEqual(6);
  expect(calculEffectifsValides(true, 4, 3)).toEqual(7);
  expect(calculEffectifsValides(true, 4, 21)).toEqual(25);
});

it("calculEcartPondere", () => {
  expect(calculEcartPondere(false, 0.318, 0, 300)).toEqual(undefined);
  expect(calculEcartPondere(false, 0.318, 4, 300)).toEqual(undefined);
  expect(calculEcartPondere(true, 0.318, 0, 300)).toEqual(0); // impossible case ?
  expect(calculEcartPondere(true, 0.318, 0, 0)).toEqual(undefined);

  expect(calculEcartPondere(false, undefined, 0, 300)).toEqual(undefined);
  expect(calculEcartPondere(false, undefined, 4, 300)).toEqual(undefined);
  expect(calculEcartPondere(true, undefined, 0, 300)).toEqual(undefined);
  expect(calculEcartPondere(true, undefined, 0, 0)).toEqual(undefined);

  expect(calculEcartPondere(true, undefined, 10, 300)).toEqual(undefined);
  expect(calculEcartPondere(true, undefined, 20, 300)).toEqual(undefined);
  expect(calculEcartPondere(true, undefined, 23, 321)).toEqual(undefined);

  expect(calculEcartPondere(true, 0.05, 10, 300)).toEqual(0.002);
  expect(calculEcartPondere(true, 0.05, 20, 300)).toEqual(0.003);
  expect(calculEcartPondere(true, 0.12, 23, 321)).toEqual(0.009);
});

it("calculTotalEcartPondere", () => {
  expect(calculTotalEcartPondere([])).toEqual(undefined);
  expect(calculTotalEcartPondere([undefined])).toEqual(undefined);
  expect(calculTotalEcartPondere([undefined, undefined])).toEqual(undefined);
  expect(calculTotalEcartPondere([undefined, 0])).toEqual(undefined);
  expect(calculTotalEcartPondere([0, undefined])).toEqual(undefined);
  expect(calculTotalEcartPondere([1, undefined])).toEqual(undefined);
  expect(calculTotalEcartPondere([1.5, undefined])).toEqual(undefined);
  expect(calculTotalEcartPondere([undefined, 2.2, 1.1])).toEqual(undefined);

  expect(calculTotalEcartPondere([0, 2.2])).toEqual(2.2);
  expect(calculTotalEcartPondere([1.1, 2.2])).toEqual(3.3);
  expect(calculTotalEcartPondere([1.1, 0, 2.2, 0])).toEqual(3.3);
});

it("calculEffectifsIndicateurCalculable", () => {
  expect(calculEffectifsIndicateurCalculable(100, 39)).toEqual(false);
  expect(calculEffectifsIndicateurCalculable(100, 40)).toEqual(true);

  expect(calculEffectifsIndicateurCalculable(500, 199)).toEqual(false);
  expect(calculEffectifsIndicateurCalculable(1000, 400)).toEqual(true);

  expect(calculEffectifsIndicateurCalculable(600, 200)).toEqual(false);
  expect(calculEffectifsIndicateurCalculable(700, 350)).toEqual(true);
});
