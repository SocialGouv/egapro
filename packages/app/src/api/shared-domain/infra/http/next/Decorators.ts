import type { NextController } from "../impl/NextController";
import { handler } from "../impl/NextController";

export const Handler = <T extends new () => NextController>(target: T) => {
  return handler(new target()) as unknown as T;
};

export type NextControllerMethodDecorator = <
  TProperty extends keyof NextController,
  TMethod extends NextController[TProperty],
>(
  target: NextController,
  property: TProperty,
  desc: TypedPropertyDescriptor<TMethod>,
) => TypedPropertyDescriptor<TMethod> | void;

// TODO maybe move
export const EnsureOwner: NextControllerMethodDecorator = (target, property, desc) => {
  console.warn("EnsureOwner is not implemented.");
  // TODO change ; just for the example
  const originalMethod = desc.value;
  desc.value = ((req, res) => {
    res.header("Owner", "ok");
    return originalMethod?.call(target, req, res);
  }) as typeof desc.value;

  return desc;
};

// TODO maybe move
export const TokenRequire: NextControllerMethodDecorator = (target, property, desc) => {
  console.warn("TokenRequire is not implemented.");
};
