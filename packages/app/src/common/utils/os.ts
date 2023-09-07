import { defined } from "./types";

export const sleep = (milliseconds: number) => new Promise<void>(resolve => setTimeout(resolve, milliseconds));

export const ensureEnvVar = <T extends keyof NodeJS.ProcessEnv>(key: T, defaultValue?: string): string => {
  const out = process.env[key];
  if (typeof out === "undefined" && typeof defaultValue === "undefined") throw new Error(`${key} env var not found.`);
  return out ?? String(defaultValue);
};

type DefaultEnsureNextEnvVar = <T extends primitive | primitive[]>(
  envVar: string | undefined,
  transformerOrDefaultValue?: T | ((envVar: string) => T),
  defaultValue?: T,
) => T | string;

type EnsureNextEnvVar = {
  (envVar: string | undefined): asserts envVar is string;
  <T>(envVar: string | undefined, defaultValue: T): T;
  <T>(envVar: string | undefined, transformer: (envVar: string) => T): T;
  <T>(envVar: string | undefined, transformer: (envVar: string) => T, defaultValue: T): T;
};
type primitive = boolean | number | string;

const ensureNextEnvVar_: DefaultEnsureNextEnvVar = (envVar, transformerOrDefaultValue, defaultValue) => {
  const defaultValueToTest = typeof transformerOrDefaultValue !== "function" ? transformerOrDefaultValue : defaultValue;
  if (typeof envVar === "undefined" && typeof defaultValueToTest === "undefined") {
    throw new Error(`Some env var are not found.`, { cause: { envVar, transformerOrDefaultValue, defaultValue } });
  }

  if (typeof envVar === "undefined" && typeof defaultValue !== "undefined") return defaultValue;

  if (typeof transformerOrDefaultValue === "function") {
    return transformerOrDefaultValue(envVar!) ?? envVar ?? defaultValue;
  }

  return envVar ?? transformerOrDefaultValue!;
};
// TODO use "satisfies"
export const ensureNextEnvVar = ensureNextEnvVar_ as EnsureNextEnvVar;

const ensureApiEnvVar_: DefaultEnsureNextEnvVar = (key, transformerOrDefaultValue, defaultValue) => {
  if (typeof window === "undefined") {
    return ensureNextEnvVar_(key, transformerOrDefaultValue, defaultValue);
  }
  const defaultValueToTest = typeof transformerOrDefaultValue !== "function" ? transformerOrDefaultValue : defaultValue;
  return defined(defaultValueToTest);
};
export const ensureApiEnvVar = ensureApiEnvVar_ as EnsureNextEnvVar;
