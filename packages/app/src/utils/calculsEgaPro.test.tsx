import {
  // Indicateur 1
  calculValiditeGroupeIndicateurUn,
  calculEffectifsValides,
  calculEcartRemunerationMoyenne,
  calculEcartApresApplicationSeuilPertinence,
  calculEcartPondere,
  calculTotalEcartPondere,
  calculIndicateurUnCalculable,
  calculIndicateurEcartRemuneration,
  calculNoteIndicateurUn
} from "./calculsEgaPro";

//////////////////
// INDICATEUR 1 //
//////////////////

it("calculValiditeGroupeIndicateurUn", () => {
  expect(calculValiditeGroupeIndicateurUn(-1, -2)).toEqual(false);
  expect(calculValiditeGroupeIndicateurUn(4, -2)).toEqual(false);

  expect(calculValiditeGroupeIndicateurUn(0, 0)).toEqual(false);
  expect(calculValiditeGroupeIndicateurUn(1, 1)).toEqual(false);
  expect(calculValiditeGroupeIndicateurUn(2, 1)).toEqual(false);
  expect(calculValiditeGroupeIndicateurUn(2, 3)).toEqual(false);
  expect(calculValiditeGroupeIndicateurUn(4, 2)).toEqual(false);

  expect(calculValiditeGroupeIndicateurUn(3, 3)).toEqual(true);
  expect(calculValiditeGroupeIndicateurUn(4, 3)).toEqual(true);
  expect(calculValiditeGroupeIndicateurUn(4, 21)).toEqual(true);
});

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

it("calculEcartRemunerationMoyenne", () => {
  expect(calculEcartRemunerationMoyenne(-1, -2)).toEqual(undefined);
  expect(calculEcartRemunerationMoyenne(4, -2)).toEqual(undefined);
  expect(calculEcartRemunerationMoyenne(0, 0)).toEqual(undefined);

  expect(calculEcartRemunerationMoyenne(12000, 12000)).toEqual(0);
  expect(calculEcartRemunerationMoyenne(12000, 19000)).toEqual(0.368);
  expect(calculEcartRemunerationMoyenne(20000, 30000)).toEqual(0.333);
  expect(calculEcartRemunerationMoyenne(28000, 21500)).toEqual(-0.302);
  expect(calculEcartRemunerationMoyenne(25000, 50000)).toEqual(0.5);
});

it("calculEcartApresApplicationSeuilPertinence", () => {
  expect(calculEcartApresApplicationSeuilPertinence(undefined)).toEqual(
    undefined
  );

  expect(calculEcartApresApplicationSeuilPertinence(-0.3)).toEqual(-0.25);

  expect(calculEcartApresApplicationSeuilPertinence(0)).toEqual(0);
  expect(calculEcartApresApplicationSeuilPertinence(0.01)).toEqual(0);
  expect(calculEcartApresApplicationSeuilPertinence(0.032)).toEqual(0);
  expect(calculEcartApresApplicationSeuilPertinence(0.05)).toEqual(0);

  expect(calculEcartApresApplicationSeuilPertinence(0.051)).toEqual(0.001);
  expect(calculEcartApresApplicationSeuilPertinence(0.06)).toEqual(0.01);
  expect(calculEcartApresApplicationSeuilPertinence(0.067)).toEqual(0.017);
  expect(calculEcartApresApplicationSeuilPertinence(0.083)).toEqual(0.033);
  expect(calculEcartApresApplicationSeuilPertinence(0.09)).toEqual(0.04);
  expect(calculEcartApresApplicationSeuilPertinence(0.1)).toEqual(0.05);
  expect(calculEcartApresApplicationSeuilPertinence(0.101)).toEqual(0.051);
  expect(calculEcartApresApplicationSeuilPertinence(0.333)).toEqual(0.283);
  expect(calculEcartApresApplicationSeuilPertinence(0.368)).toEqual(0.318);
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

it("calculIndicateurUnCalculable", () => {
  expect(calculIndicateurUnCalculable(100, 39)).toEqual(false);
  expect(calculIndicateurUnCalculable(100, 40)).toEqual(true);

  expect(calculIndicateurUnCalculable(500, 199)).toEqual(false);
  expect(calculIndicateurUnCalculable(1000, 400)).toEqual(true);

  expect(calculIndicateurUnCalculable(600, 200)).toEqual(false);
  expect(calculIndicateurUnCalculable(700, 350)).toEqual(true);
});

it("calculIndicateurEcartRemuneration", () => {
  expect(calculIndicateurEcartRemuneration(false, undefined)).toEqual(
    undefined
  );
  expect(calculIndicateurEcartRemuneration(true, undefined)).toEqual(undefined);

  expect(calculIndicateurEcartRemuneration(false, 0.01)).toEqual(undefined);
  expect(calculIndicateurEcartRemuneration(true, 0.01)).toEqual(1);

  expect(calculIndicateurEcartRemuneration(false, 0.022)).toEqual(undefined);
  expect(calculIndicateurEcartRemuneration(true, 0.022)).toEqual(2.2);

  expect(calculIndicateurEcartRemuneration(false, 0.505)).toEqual(undefined);
  expect(calculIndicateurEcartRemuneration(true, 0.505)).toEqual(50.5);
});

it("calculNoteIndicateurUn", () => {
  expect(calculNoteIndicateurUn(undefined)).toEqual(undefined);
  expect(calculNoteIndicateurUn(-2)).toEqual(40);
  expect(calculNoteIndicateurUn(-0.5)).toEqual(40);
  expect(calculNoteIndicateurUn(0)).toEqual(40);
  expect(calculNoteIndicateurUn(0.1)).toEqual(39);
  expect(calculNoteIndicateurUn(0.5)).toEqual(39);
  expect(calculNoteIndicateurUn(1)).toEqual(39);
  expect(calculNoteIndicateurUn(2.2)).toEqual(37);
  expect(calculNoteIndicateurUn(7)).toEqual(33);
  expect(calculNoteIndicateurUn(7.1)).toEqual(31);
  expect(calculNoteIndicateurUn(8)).toEqual(31);
  expect(calculNoteIndicateurUn(13.2)).toEqual(19);
  expect(calculNoteIndicateurUn(50.5)).toEqual(0);
});
