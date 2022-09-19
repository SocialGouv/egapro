export const sleep = (milliseconds: number) => new Promise<void>(resolve => setTimeout(resolve, milliseconds));

export const ensureEnvVar = <T extends keyof NodeJS.ProcessEnv>(key: T, defaultValue?: string): string => {
  const out = process.env[key];
  if (typeof out === "undefined" && typeof defaultValue === "undefined") throw new Error(`${key} env var not found.`);
  return out ?? String(defaultValue);
};
