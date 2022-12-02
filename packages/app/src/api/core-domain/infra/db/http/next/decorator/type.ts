import type { NextController } from "@api/shared-domain/infra/http/impl/NextController";

export type NextControllerMethodDecorator = <
  TProperty extends keyof NextController,
  TMethod extends NextController[TProperty],
>(
  target: NextController,
  property: TProperty,
  desc: TypedPropertyDescriptor<TMethod>,
) => TypedPropertyDescriptor<TMethod> | void;
