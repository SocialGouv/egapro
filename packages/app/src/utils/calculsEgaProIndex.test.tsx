import { calculNoteIndex } from "./calculsEgaProIndex";

describe("calculNoteIndex", () => {
  test("cant calcul note because totalPointCalculable is under 75", () => {
    expect(
      calculNoteIndex(undefined, undefined, undefined, undefined, undefined)
    ).toEqual({ noteIndex: undefined, totalPointCalculable: 0 });

    expect(calculNoteIndex(40, undefined, undefined, 15, 10)).toEqual({
      noteIndex: undefined,
      totalPointCalculable: 65
    });
    expect(calculNoteIndex(undefined, 20, undefined, undefined, 10)).toEqual({
      noteIndex: undefined,
      totalPointCalculable: 30
    });
    expect(calculNoteIndex(40, 20, undefined, undefined, 10)).toEqual({
      noteIndex: undefined,
      totalPointCalculable: 70
    });
    expect(
      calculNoteIndex(undefined, undefined, undefined, 15, undefined)
    ).toEqual({ noteIndex: undefined, totalPointCalculable: 15 });
    expect(calculNoteIndex(undefined, 20, 15, 15, 10)).toEqual({
      noteIndex: undefined,
      totalPointCalculable: 60
    });
    expect(calculNoteIndex(40, undefined, 15, 15, undefined)).toEqual({
      noteIndex: undefined,
      totalPointCalculable: 70
    });
  });

  test("can calcul note with only indicator 2 undefined", () => {
    expect(calculNoteIndex(36, undefined, 10, 0, 10)).toEqual({
      noteIndex: 70,
      totalPointCalculable: 80
    });
  });

  test("can calcul note with only indicator 3 undefined", () => {
    expect(calculNoteIndex(36, 15, undefined, 0, 10)).toEqual({
      noteIndex: 72,
      totalPointCalculable: 85
    });
  });

  test("can calcul note with only indicator 4 undefined", () => {
    expect(calculNoteIndex(34, 10, 10, undefined, 10)).toEqual({
      noteIndex: 75,
      totalPointCalculable: 85
    });
  });

  test("can calcul note with max totalPointCalculable", () => {
    expect(calculNoteIndex(35, 15, 10, 15, 5)).toEqual({
      noteIndex: 80,
      totalPointCalculable: 100
    });
    expect(calculNoteIndex(21, 5, 5, 0, 0)).toEqual({
      noteIndex: 31,
      totalPointCalculable: 100
    });
  });
});
