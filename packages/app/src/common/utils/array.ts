import _ from "lodash";

export const findDuplicates = <T>(arr: T[]): T[] =>
  _.filter(arr, (val, i, iteratee) => _.includes(iteratee, val, i + 1));
