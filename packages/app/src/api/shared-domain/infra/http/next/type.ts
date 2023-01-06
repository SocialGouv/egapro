import type { NextController } from "../impl/NextController";

/**
 * Base type for any decorators used in a {@link NextController} context.
 */
export type NextControllerMethodDecorator<TController extends NextController = NextController> = <
  TProperty extends keyof TController,
  TMethod extends TController[TProperty],
>(
  target: TController,
  property: TProperty,
  desc: TypedPropertyDescriptor<TMethod>,
) => TypedPropertyDescriptor<TMethod> | void;
