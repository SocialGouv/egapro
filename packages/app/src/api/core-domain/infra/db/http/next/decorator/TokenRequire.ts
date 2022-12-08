import type { NextControllerMethodDecorator } from "./type";

export const TokenRequire: NextControllerMethodDecorator = (target, property, desc) => {
  console.warn("TokenRequire is not implemented.");
};

export namespace TokenRequire {
  export type Wrap<TReq> = TReq & { egapro: { staff: boolean } };
}
