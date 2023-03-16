import type { PartialObject, ValueKeyIteratee } from "lodash";
import _ from "lodash";

/**
 * Return true if the object has no property.
 */
export const isEmpty = (obj: Record<string, unknown>) => {
  for (const prop in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, prop)) return false;
  }

  return true;
};

/**
 * Remove properties satisfying predicate on values.
 */
export const removeEntryBy = (obj: Record<string, unknown>, predicate: (val: unknown) => boolean) =>
  Object.fromEntries(Object.entries(obj).filter(([_key, value]) => predicate(value)));

export const omitByRecursively = <T extends object>(
  value: T,
  iteratee: ValueKeyIteratee<T[keyof T]>,
): _.Object<PartialObject<T>> => {
  const cb = (v: T) => omitByRecursively(v, iteratee);
  return (
    _.isObject(value) ? (_.isArray(value) ? _.map(value, cb) : _(value).omitBy(iteratee).mapValues(cb).value()) : value
  ) as _.Object<PartialObject<T>>;
};
