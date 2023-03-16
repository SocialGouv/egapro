import { add, format, formatISO, fromUnixTime, isBefore, parse, parseISO } from "date-fns";

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

/**
 * Format the data to be compatible with the old and dark API python format
 */
export const toISOString = (date: string): string | undefined => {
  const parsed = parseDate(date);
  return parsed ? format(parsed, "yyyy-MM-dd") : undefined;
};

export const dateObjectToDateISOString = (date: Date) => formatISO(date, { representation: "date" });

/**
 * True if the date is older than the current date minus the duration.
 *
 * @param duration Duration from date-fns
 */
export const isDateBeforeDuration = (date: Date, duration: Duration, now = new Date()) => {
  return isBefore(now, add(date, duration));
};
