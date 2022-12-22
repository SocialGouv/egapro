import _ from 'lodash';

export const getDuplicates = <T>(arr: T[]): T[] => _.filter(arr, (val, i, iteratee) => _.includes(iteratee, val, i + 1))
