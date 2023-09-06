export class AbortedWarning extends Error {
  public name = "AbortedWarning";
}

/**
 * Returns a promise that will be rejected if the signal is aborted.
 */
export const abortablePromise = async <T>(p: Promise<T>, signal: AbortSignal): Promise<T> => {
  if (signal.aborted) return Promise.reject(new AbortedWarning("Aborted early"));

  return Promise.race([
    p,
    new Promise<T>((_, reject) => {
      signal.addEventListener("abort", () => {
        reject(new AbortedWarning("Aborted"));
      });
    }),
  ]);
};
