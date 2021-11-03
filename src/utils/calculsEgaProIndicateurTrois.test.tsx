import { calculNote } from "./calculsEgaProIndicateurTrois"

//////////////////
// INDICATEUR 3 //
//////////////////

// Most of functions are directly imported from 2nd indicator
// So no duplicated tests here

describe("calculNote", () => {
  test("cant calcul note", () => {
    expect(calculNote(undefined, undefined, undefined, undefined)).toEqual({
      note: undefined,
      correctionMeasure: false,
    })
  })

  test("test some valid data", () => {
    expect(calculNote(-2, undefined, undefined, undefined)).toEqual({
      note: 15,
      correctionMeasure: false,
    })
    expect(calculNote(-0.5, undefined, undefined, undefined)).toEqual({
      note: 15,
      correctionMeasure: false,
    })
    expect(calculNote(0, undefined, undefined, undefined)).toEqual({
      note: 15,
      correctionMeasure: false,
    })
    expect(calculNote(0.1, undefined, undefined, undefined)).toEqual({
      note: 15,
      correctionMeasure: false,
    })
    expect(calculNote(0.5, undefined, undefined, undefined)).toEqual({
      note: 15,
      correctionMeasure: false,
    })
    expect(calculNote(1, undefined, undefined, undefined)).toEqual({
      note: 15,
      correctionMeasure: false,
    })
    expect(calculNote(2, undefined, undefined, undefined)).toEqual({
      note: 15,
      correctionMeasure: false,
    })
    expect(calculNote(2.1, undefined, undefined, undefined)).toEqual({
      note: 10,
      correctionMeasure: false,
    })
    expect(calculNote(3.2, undefined, undefined, undefined)).toEqual({
      note: 10,
      correctionMeasure: false,
    })
    expect(calculNote(4, undefined, undefined, undefined)).toEqual({
      note: 10,
      correctionMeasure: false,
    })
    expect(calculNote(5, undefined, undefined, undefined)).toEqual({
      note: 10,
      correctionMeasure: false,
    })
    expect(calculNote(5.1, undefined, undefined, undefined)).toEqual({
      note: 5,
      correctionMeasure: false,
    })
    expect(calculNote(7, undefined, undefined, undefined)).toEqual({
      note: 5,
      correctionMeasure: false,
    })
    expect(calculNote(7.1, undefined, undefined, undefined)).toEqual({
      note: 5,
      correctionMeasure: false,
    })
    expect(calculNote(8, undefined, undefined, undefined)).toEqual({
      note: 5,
      correctionMeasure: false,
    })
    expect(calculNote(10, undefined, undefined, undefined)).toEqual({
      note: 5,
      correctionMeasure: false,
    })
    expect(calculNote(10.1, undefined, undefined, undefined)).toEqual({
      note: 0,
      correctionMeasure: false,
    })
    expect(calculNote(13.2, undefined, undefined, undefined)).toEqual({
      note: 0,
      correctionMeasure: false,
    })
    expect(calculNote(50.5, undefined, undefined, undefined)).toEqual({
      note: 0,
      correctionMeasure: false,
    })
  })

  describe("test round to 1 number after comma", () => {
    test("round to 2.1", () => {
      expect(calculNote(2.1, undefined, undefined, undefined)).toEqual({
        note: 10,
        correctionMeasure: false,
      })
      expect(calculNote(2.09, undefined, undefined, undefined)).toEqual({
        note: 10,
        correctionMeasure: false,
      })
      expect(calculNote(2.06, undefined, undefined, undefined)).toEqual({
        note: 10,
        correctionMeasure: false,
      })
      expect(calculNote(2.05, undefined, undefined, undefined)).toEqual({
        note: 10,
        correctionMeasure: false,
      })
    })

    test("round to 2.0", () => {
      expect(calculNote(2.04, undefined, undefined, undefined)).toEqual({
        note: 15,
        correctionMeasure: false,
      })
      expect(calculNote(2.01, undefined, undefined, undefined)).toEqual({
        note: 15,
        correctionMeasure: false,
      })
      expect(calculNote(2.0, undefined, undefined, undefined)).toEqual({
        note: 15,
        correctionMeasure: false,
      })
    })
  })

  describe("correction measure from indicateur 1", () => {
    test("note indicator 1 is 40 so not correction measure", () => {
      expect(calculNote(2.1, 40, "femmes", "hommes")).toEqual({
        note: 10,
        correctionMeasure: false,
      })
    })

    test("overrepresented sex is same on indicator 1 & 2 so not correction measure", () => {
      expect(calculNote(8.1, 36, "hommes", "hommes")).toEqual({
        note: 5,
        correctionMeasure: false,
      })
    })

    test("correction measure for men", () => {
      expect(calculNote(2.1, 39, "femmes", "hommes")).toEqual({
        note: 15,
        correctionMeasure: true,
      })
    })

    test("correction measure for women", () => {
      expect(calculNote(8.1, 36, "hommes", "femmes")).toEqual({
        note: 15,
        correctionMeasure: true,
      })
    })

    test("note indicator 1 is 0", () => {
      expect(calculNote(8.1, 0, "hommes", "femmes")).toEqual({
        note: 15,
        correctionMeasure: true,
      })
    })
  })
})
