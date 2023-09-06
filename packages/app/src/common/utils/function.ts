import { type Any, type AnyFunction } from "./types";

/**
 * Inline silented try catch.
 *
 * Can filter errors that should be silenced. By default, all errors are silenced.
 */
export const ensure = <T extends AnyFunction>(
  callback: T,
  fallback: Awaited<ReturnType<T>>,
  ..._silencedErrors: Any[]
): ReturnType<T> => {
  try {
    return callback() as ReturnType<T>;
  } catch (error: unknown) {
    const silencedErrors = _silencedErrors.length ? _silencedErrors : [Error];
    const isCaughtError = silencedErrors.some(filter => error instanceof filter);
    if (isCaughtError) {
      return fallback;
    }
    throw error;
  }
};
