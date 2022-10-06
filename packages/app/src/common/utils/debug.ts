export function formatZodErrors(errors: Record<string, { message: string }>) {
  const res = Object.keys(errors).map(key => ({
    [key]: errors[key].message,
  }));

  return JSON.stringify(res, null, 2);
}
