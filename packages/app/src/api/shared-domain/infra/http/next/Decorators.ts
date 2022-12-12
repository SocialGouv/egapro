import type { NextController } from "../impl/NextController";
import { handler } from "../impl/NextController";

/**
 * Convert a {@link NextController} to nextjs api handler.
 */
export const Handler = <T extends new () => NextController>(target: T) => {
  return handler(new target()) as unknown as T;
};
