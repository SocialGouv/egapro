import { calculerNoteIndex } from "../utils/calculsEgaProIndex"

describe("calculNoteIndex for 250 employees and above", () => {
  test("can't calcul note because totalPointCalculable is under 75", () => {
    expect(calculerNoteIndex("251 à 999", undefined, undefined, undefined, undefined, undefined, undefined)).toEqual({
      noteIndex: undefined,
      totalPoint: 0,
      totalPointCalculable: 0,
    })

    expect(calculerNoteIndex("251 à 999", 40, undefined, undefined, undefined, 15, 10)).toEqual({
      noteIndex: undefined,
      totalPoint: 65,
      totalPointCalculable: 65,
    })
    expect(calculerNoteIndex("251 à 999", undefined, 20, undefined, undefined, undefined, 10)).toEqual({
      noteIndex: undefined,
      totalPoint: 30,
      totalPointCalculable: 30,
    })
    expect(calculerNoteIndex("251 à 999", 40, 20, undefined, undefined, undefined, 10)).toEqual({
      noteIndex: undefined,
      totalPoint: 70,
      totalPointCalculable: 70,
    })
    expect(calculerNoteIndex("251 à 999", undefined, undefined, undefined, undefined, 15, undefined)).toEqual({
      noteIndex: undefined,
      totalPoint: 15,
      totalPointCalculable: 15,
    })
    expect(calculerNoteIndex("251 à 999", undefined, 20, 15, undefined, 15, 10)).toEqual({
      noteIndex: undefined,
      totalPoint: 60,
      totalPointCalculable: 60,
    })
    expect(calculerNoteIndex("251 à 999", 40, undefined, 15, undefined, 15, undefined)).toEqual({
      noteIndex: undefined,
      totalPoint: 70,
      totalPointCalculable: 70,
    })
  })

  test("can calcul note with only indicator 2 undefined", () => {
    expect(calculerNoteIndex("251 à 999", 36, undefined, 10, undefined, 0, 10)).toEqual({
      noteIndex: 70,
      totalPoint: 56,
      totalPointCalculable: 80,
    })
  })

  test("can calcul note with only indicator 3 undefined", () => {
    expect(calculerNoteIndex("251 à 999", 36, 15, undefined, undefined, 0, 10)).toEqual({
      noteIndex: 72,
      totalPoint: 61,
      totalPointCalculable: 85,
    })
  })

  test("can calcul note with only indicator 4 undefined", () => {
    expect(calculerNoteIndex("251 à 999", 34, 10, 10, undefined, undefined, 10)).toEqual({
      noteIndex: 75,
      totalPoint: 64,
      totalPointCalculable: 85,
    })
  })

  test("can calcul note with max totalPointCalculable", () => {
    expect(calculerNoteIndex("251 à 999", 35, 15, 10, undefined, 15, 5)).toEqual({
      noteIndex: 80,
      totalPoint: 80,
      totalPointCalculable: 100,
    })
    expect(calculerNoteIndex("251 à 999", 21, 5, 5, undefined, 0, 0)).toEqual({
      noteIndex: 31,
      totalPoint: 31,
      totalPointCalculable: 100,
    })
  })
})

describe("calculNoteIndex for 50 to 250 employees", () => {
  test("can't calcul note because totalPointCalculable is under 75", () => {
    expect(calculerNoteIndex("50 à 250", undefined, undefined, undefined, undefined, undefined, undefined)).toEqual({
      noteIndex: undefined,
      totalPoint: 0,
      totalPointCalculable: 0,
    })

    expect(calculerNoteIndex("50 à 250", 40, undefined, undefined, undefined, 15, 10)).toEqual({
      noteIndex: undefined,
      totalPoint: 65,
      totalPointCalculable: 65,
    })
    expect(calculerNoteIndex("50 à 250", undefined, undefined, undefined, 4, 10, undefined)).toEqual({
      noteIndex: undefined,
      totalPoint: 14,
      totalPointCalculable: 50,
    })
    expect(calculerNoteIndex("50 à 250", undefined, undefined, undefined, undefined, 15, undefined)).toEqual({
      noteIndex: undefined,
      totalPoint: 15,
      totalPointCalculable: 15,
    })
  })

  test("can calcul note with only indicator 4 undefined", () => {
    expect(calculerNoteIndex("50 à 250", 34, undefined, undefined, 35, undefined, 10)).toEqual({
      noteIndex: 93,
      totalPoint: 79,
      totalPointCalculable: 85,
    })
  })

  test("can calcul note with max totalPointCalculable", () => {
    expect(calculerNoteIndex("50 à 250", 35, undefined, undefined, 20, 15, 5)).toEqual({
      noteIndex: 75,
      totalPoint: 75,
      totalPointCalculable: 100,
    })
    expect(calculerNoteIndex("50 à 250", 21, undefined, undefined, 5, 0, 0)).toEqual({
      noteIndex: 26,
      totalPoint: 26,
      totalPointCalculable: 100,
    })
  })
})
