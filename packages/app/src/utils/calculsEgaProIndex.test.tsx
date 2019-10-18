import { calculNoteIndex } from "./calculsEgaProIndex";

describe("calculNoteIndex for 250 employees and above", () => {
  test("can't calcul note because totalPointCalculable is under 75", () => {
    expect(
      calculNoteIndex(
        "250 à 999",
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined
      )
    ).toEqual({ noteIndex: undefined, totalPointCalculable: 0 });

    expect(
      calculNoteIndex("250 à 999", 40, undefined, undefined, undefined, 15, 10)
    ).toEqual({
      noteIndex: undefined,
      totalPointCalculable: 65
    });
    expect(
      calculNoteIndex(
        "250 à 999",
        undefined,
        20,
        undefined,
        undefined,
        undefined,
        10
      )
    ).toEqual({
      noteIndex: undefined,
      totalPointCalculable: 30
    });
    expect(
      calculNoteIndex("250 à 999", 40, 20, undefined, undefined, undefined, 10)
    ).toEqual({
      noteIndex: undefined,
      totalPointCalculable: 70
    });
    expect(
      calculNoteIndex(
        "250 à 999",
        undefined,
        undefined,
        undefined,
        undefined,
        15,
        undefined
      )
    ).toEqual({ noteIndex: undefined, totalPointCalculable: 15 });
    expect(
      calculNoteIndex("250 à 999", undefined, 20, 15, undefined, 15, 10)
    ).toEqual({
      noteIndex: undefined,
      totalPointCalculable: 60
    });
    expect(
      calculNoteIndex("250 à 999", 40, undefined, 15, undefined, 15, undefined)
    ).toEqual({
      noteIndex: undefined,
      totalPointCalculable: 70
    });
  });

  test("can calcul note with only indicator 2 undefined", () => {
    expect(
      calculNoteIndex("250 à 999", 36, undefined, 10, undefined, 0, 10)
    ).toEqual({
      noteIndex: 70,
      totalPointCalculable: 80
    });
  });

  test("can calcul note with only indicator 3 undefined", () => {
    expect(
      calculNoteIndex("250 à 999", 36, 15, undefined, undefined, 0, 10)
    ).toEqual({
      noteIndex: 72,
      totalPointCalculable: 85
    });
  });

  test("can calcul note with only indicator 4 undefined", () => {
    expect(
      calculNoteIndex("250 à 999", 34, 10, 10, undefined, undefined, 10)
    ).toEqual({
      noteIndex: 75,
      totalPointCalculable: 85
    });
  });

  test("can calcul note with max totalPointCalculable", () => {
    expect(calculNoteIndex("250 à 999", 35, 15, 10, undefined, 15, 5)).toEqual({
      noteIndex: 80,
      totalPointCalculable: 100
    });
    expect(calculNoteIndex("250 à 999", 21, 5, 5, undefined, 0, 0)).toEqual({
      noteIndex: 31,
      totalPointCalculable: 100
    });
  });
});

describe("calculNoteIndex for 50 to 250 employees", () => {
  test("can't calcul note because totalPointCalculable is under 75", () => {
    expect(
      calculNoteIndex(
        "50 à 249",
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined
      )
    ).toEqual({ noteIndex: undefined, totalPointCalculable: 0 });

    expect(
      calculNoteIndex("50 à 249", 40, undefined, undefined, undefined, 15, 10)
    ).toEqual({
      noteIndex: undefined,
      totalPointCalculable: 65
    });
    expect(
      calculNoteIndex(
        "50 à 249",
        undefined,
        undefined,
        undefined,
        4,
        10,
        undefined
      )
    ).toEqual({
      noteIndex: undefined,
      totalPointCalculable: 50
    });
    expect(
      calculNoteIndex(
        "50 à 249",
        undefined,
        undefined,
        undefined,
        undefined,
        15,
        undefined
      )
    ).toEqual({ noteIndex: undefined, totalPointCalculable: 15 });
  });

  test("can calcul note with only indicator 4 undefined", () => {
    expect(
      calculNoteIndex("50 à 249", 34, undefined, undefined, 35, undefined, 10)
    ).toEqual({
      noteIndex: 93,
      totalPointCalculable: 85
    });
  });

  test("can calcul note with max totalPointCalculable", () => {
    expect(
      calculNoteIndex("50 à 249", 35, undefined, undefined, 20, 15, 5)
    ).toEqual({
      noteIndex: 75,
      totalPointCalculable: 100
    });
    expect(
      calculNoteIndex("50 à 249", 21, undefined, undefined, 5, 0, 0)
    ).toEqual({
      noteIndex: 26,
      totalPointCalculable: 100
    });
  });
});
