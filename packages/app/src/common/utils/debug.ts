/**
 * Utility to help when using React Hook Form and zod.
 *
 * @example
 * ```jsx
 * <pre>{JSON.stringify(formatZodErrors(errors), null, 2)}</pre>
 * ```
 */
export const formatZodErrors = (errors: Record<string, { message: string }>) => {
  const res = Object.keys(errors).map(key => ({
    [key]: errors[key].message,
  }));

  return JSON.stringify(res, null, 2);
};
