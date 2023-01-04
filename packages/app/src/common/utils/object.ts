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
