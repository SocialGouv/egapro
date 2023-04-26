import { type AnyFunction } from "./types";

/**
 * Inline silented try catch.
 */
export const ensure = <T extends AnyFunction>(callback: T, fallback: Awaited<ReturnType<T>>): ReturnType<T> => {
  try {
    return callback() as ReturnType<T>;
  } catch {
    return fallback;
  }
};
