import { isBefore, sub } from "date-fns"
import { AppState } from "../globals"
import { parseFrDate } from "./date"


export const isFrozenDeclaration = (state: AppState | undefined) => {
  if (!state || !state.declaration.dateDeclaration) return undefined

  const [date] = state.declaration.dateDeclaration.split(" ")

  const declarationDate = parseFrDate(date)
  if (declarationDate.toString() === "Invalid Date") {
    return
  }

  const oneYearAgo = sub(new Date(), { years: 1 })

  return !declarationDate ? undefined : isBefore(new Date(declarationDate), oneYearAgo)
}
