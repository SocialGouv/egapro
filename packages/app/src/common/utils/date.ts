import { format, fromUnixTime, parseISO } from "date-fns";

export const formatIsoToFr = (date: string) => format(parseISO(date), "dd/MM/yyyy");

export const formatTimestampToFr = (timestamp: number) => format(fromUnixTime(timestamp), "dd/MM/yyyy");
