import { filter, includes } from "lodash";

export const getDuplicates = <T>(arr: T[]): T[] => filter(arr, (val, i, iteratee) => includes(iteratee, val, i + 1));
