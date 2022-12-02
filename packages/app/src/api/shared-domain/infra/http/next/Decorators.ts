import type { NextController } from "../impl/NextController";
import { handler } from "../impl/NextController";

export const Handler = <T extends new () => NextController>(target: T) => {
  return handler(new target()) as unknown as T;
};
