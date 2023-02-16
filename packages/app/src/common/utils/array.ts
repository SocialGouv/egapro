import _ from "lodash";

export const findDuplicates = <T extends unknown[]>(arr: T) =>
  _.filter(arr, (val, i, iteratee) => _.includes(iteratee, val, i + 1)) as T;
