import { calculNote } from "./calculsEgaProIndicateurTrois";

//////////////////
// INDICATEUR 3 //
//////////////////

// Most of functions are directly imported from 2nd indicator
// So no duplicated tests here

it("calculNote", () => {
  expect(calculNote(undefined)).toEqual(undefined);
  expect(calculNote(-2)).toEqual(15);
  expect(calculNote(-0.5)).toEqual(15);
  expect(calculNote(0)).toEqual(15);
  expect(calculNote(0.1)).toEqual(15);
  expect(calculNote(0.5)).toEqual(15);
  expect(calculNote(1)).toEqual(15);
  expect(calculNote(2)).toEqual(15);
  expect(calculNote(2.1)).toEqual(10);
  expect(calculNote(3.2)).toEqual(10);
  expect(calculNote(4)).toEqual(10);
  expect(calculNote(5)).toEqual(10);
  expect(calculNote(5.1)).toEqual(5);
  expect(calculNote(7)).toEqual(5);
  expect(calculNote(7.1)).toEqual(5);
  expect(calculNote(8)).toEqual(5);
  expect(calculNote(10)).toEqual(5);
  expect(calculNote(10.1)).toEqual(0);
  expect(calculNote(13.2)).toEqual(0);
  expect(calculNote(50.5)).toEqual(0);

  expect(calculNote(2.1)).toEqual(10);
  expect(calculNote(2.09)).toEqual(10);
  expect(calculNote(2.06)).toEqual(10);
  expect(calculNote(2.05)).toEqual(10); // round to 2.1
  expect(calculNote(2.04)).toEqual(15); // round to 2.0
  expect(calculNote(2.01)).toEqual(15);
  expect(calculNote(2.0)).toEqual(15);
});
