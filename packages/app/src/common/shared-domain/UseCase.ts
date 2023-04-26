import { type Any } from "@common/utils/types";

export interface UseCase<TRequest, TResponse> {
  execute(request?: TRequest): Promise<TResponse>;
}

export type UseCaseParameters<T extends UseCase<Any, Any>> = T extends UseCase<infer RReq, infer RRes>
  ? [RReq, RRes]
  : never;
