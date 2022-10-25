import { format, parseISO } from "date-fns";

export const formatIsoToFr = (date: string) => format(parseISO(date), "dd/MM/yyyy");
