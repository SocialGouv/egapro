import { addYears, addDays, format, parse as rootParse, parseISO, fromUnixTime } from "date-fns"

/* Dates */

/**
 * Parse an ISO date or a french date.
 *
 * @param dateStr Date string to parse
 * @returns string
 */
export function parseDate(dateStr: string): Date | undefined {
  const parsed = parseISO(dateStr)
  if (parsed.toString() === "Invalid Date") {
    const rootParsed = rootParse(dateStr, "dd/MM/yyyy", new Date())
    if (rootParsed.toString() === "Invalid Date") {
      return
    }
    return rootParsed
  }
  return parsed
}

export function dateToString(date: Date | undefined): string {
  return date !== undefined ? format(date, "dd/MM/yyyy") : ""
}

export enum Year {
  Add,
  Subtract,
}

// Return a date that is exactly one year later or before:
// Eg: one year in the future: 2019-01-01 -> 2019-12-31
export function calendarYear(dateStr: string, operation: Year, numYears: number): string {
  // Adding a year: we subtract a day to the final result.
  // Subtracting a year: we add a day to the final result.
  const year = operation === Year.Add ? numYears : -numYears
  const day = operation === Year.Add ? -1 : 1
  const date = parseDate(dateStr)
  if (date === undefined) {
    return ""
  }
  const yearsAdded = addYears(date, year)
  const dayAdded = addDays(yearsAdded, day)
  return format(dayAdded, "dd/MM/yyyy")
}

// Format the data from the AppReducer to be compatible with the API new format

export const toISOString = (date: string): string | undefined => {
  const parsed = parseDate(date)
  return parsed ? format(parsed, "yyyy-MM-dd") : undefined
}

export function formatDate(stringDate: string | undefined): string | undefined {
  if (!stringDate) return ""

  const date = parseISO(stringDate)
  if (date.toString() === "Invalid Date") return

  return format(date, "dd/MM/yyyy")
}

export const timestampToFrDate = (timestamp: number): string => format(fromUnixTime(timestamp), "dd/MM/yyyy")
