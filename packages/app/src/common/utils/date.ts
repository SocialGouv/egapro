import { format, fromUnixTime, parse, parseISO } from "date-fns";

export const FR_DATE_FORMAT = "dd/MM/yyyy";
export const FR_DATETIME_FORMAT = "dd/MM/yyyy HH:mm";

export const formatIsoToFr = (date: string) => format(parseISO(date), FR_DATE_FORMAT);

export const formatTimestampToFr = (timestamp: number) => format(fromUnixTime(timestamp), FR_DATE_FORMAT);

export const parseFrDate = (stringDate: string): Date => parse(stringDate, FR_DATE_FORMAT, new Date());

/**
 * Parse an ISO date or a french date.
 *
 * @param stringDate Date string to parse
 */
export function parseDate(stringDate: string): Date {
  let date = parseISO(stringDate);
  if (date.toString() === "Invalid Date") {
    date = parseFrDate(stringDate);
    if (date.toString() === "Invalid Date") {
      throw new TypeError(`The date "${stringDate}" cannot be parsed.`);
    }
  }
  return date;
}
