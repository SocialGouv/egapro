import { isBefore, sub } from "date-fns"
import { AppState } from "../globals"
import { parseFrDate } from "./date"

export const isFrozenDeclaration = (state?: AppState) => {
  if (!state || !state.declaration.dateDeclaration) return false

  const [date] = state.declaration.dateDeclaration.split(" ")

  const declarationDate = parseFrDate(date)
  if (declarationDate.toString() === "Invalid Date") {
    return false
  }

  const oneYearAgo = sub(new Date(), { years: 1 })

  return !declarationDate ? false : isBefore(new Date(declarationDate), oneYearAgo)
}
