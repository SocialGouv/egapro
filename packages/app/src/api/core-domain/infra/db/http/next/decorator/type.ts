import type { NextController } from "@api/shared-domain/infra/http/impl/NextController";

export type NextControllerMethodDecorator<TController extends NextController = NextController> = <
  TProperty extends keyof TController,
  TMethod extends TController[TProperty],
>(
  target: TController,
  property: TProperty,
  desc: TypedPropertyDescriptor<TMethod>,
) => TypedPropertyDescriptor<TMethod> | void;
