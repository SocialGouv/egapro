export function getModifiedFormValues<
  DirtyFields extends Record<string, unknown>,
  Values extends Partial<Record<keyof DirtyFields, unknown>>,
>(dirtyFields: DirtyFields, values: Values): Partial<Values> {
  return Object.keys(dirtyFields).reduce((prev, key) => {
    const dirtyValue = dirtyFields[key];
    const value = values[key];

    if (!dirtyValue || value === undefined) return prev;

    return {
      ...prev,
      [key]:
        typeof dirtyValue === "object" && dirtyValue !== null && value !== null
          ? getModifiedFormValues(dirtyValue as Record<string, unknown>, value as Record<string, unknown>)
          : value,
    };
  }, {} as Partial<Values>);
}
