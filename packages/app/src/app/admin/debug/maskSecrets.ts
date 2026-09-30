const SECRET_KEY = /secret|password|token|apikey|api_key|privatekey|login/i;

/** Never render credentials, even for staff: a screenshot or a shared screen is enough to leak them. */
export const maskSecrets = <T>(value: T): T => {
  if (Array.isArray(value)) return value.map(maskSecrets) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, v]) => [key, SECRET_KEY.test(key) && v ? "********" : maskSecrets(v)]),
    ) as T;
  }
  return value;
};
