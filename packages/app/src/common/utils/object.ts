import isUndefined from "lodash/isUndefined";
import omitBy from "lodash/omitBy";

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
 * Remove undefined properties of the object.
 */
export const removeUndefined = (obj: Record<string, unknown>) => omitBy(obj, isUndefined);

/**
 * Remove properties with empty string values.
 */
export const removeEmpty = (obj: Record<string, unknown>) => omitBy(obj, val => val === "");
