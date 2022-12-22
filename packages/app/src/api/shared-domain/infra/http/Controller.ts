import type { Any, pvoid, SimpleObject, UniqueString } from "@common/utils/types";
import type { IncomingMessage, ServerResponse } from "http";
import { StatusCodes } from "http-status-codes";

interface QueryString {
  [key: string]: QueryString | QueryString[] | string[] | string | undefined;
}

/**
 * Generic {@link Controller} request object.
 *
 * Exposes basic infos and wraps original request and native node request.
 */
export interface ControllerRequest<TParamKeys extends string = string, TOriginalRequest = Any> {
  _nodeRequest: IncomingMessage;
  _req: TOriginalRequest;
  body?: SimpleObject<string[] | string | undefined>;
  params: Record<TParamKeys, string>;
  query: QueryString;
}

export type AnyUrl = UniqueString<string>;
export type BackToReferer = "back";

/**
 * Generic {@link Controller} response object.
 *
 * Simplifies and standardizes methods used in controllers. It also
 * wraps original response and native node response.
 */
export interface ControllerResponse<TOriginalResponse = Any> {
  _nodeResponse: ServerResponse;
  _res: TOriginalResponse;
  header(key: string, value: string): ControllerResponse;
  // TODO: types and validation (+ allow custom headers)
  headers(headers: SimpleObject<string>): ControllerResponse;
  json(jsonBody: object): void;
  redirect(url: AnyUrl | BackToReferer): ControllerResponse;
  redirect(code: StatusCodes, url: AnyUrl | BackToReferer): ControllerResponse;
  send(body: Buffer | object | string | null): void;
  status(code: StatusCodes): ControllerResponse;
}

/**
 * Standard controller. Implementing a method ensures its http verb availability.
 */
export interface Controller<TParamKeys extends string = string, TOriginalRequest = Any, TOriginalResponse = Any> {
  delete?(req: ControllerRequest<TParamKeys, TOriginalRequest>, res: ControllerResponse<TOriginalResponse>): pvoid;
  get?(req: ControllerRequest<TParamKeys, TOriginalRequest>, res: ControllerResponse<TOriginalResponse>): pvoid;
  head?(req: ControllerRequest<TParamKeys, TOriginalRequest>, res: ControllerResponse<TOriginalResponse>): pvoid;
  options?(req: ControllerRequest<TParamKeys, TOriginalRequest>, res: ControllerResponse<TOriginalResponse>): pvoid;
  patch?(req: ControllerRequest<TParamKeys, TOriginalRequest>, res: ControllerResponse<TOriginalResponse>): pvoid;
  post?(req: ControllerRequest<TParamKeys, TOriginalRequest>, res: ControllerResponse<TOriginalResponse>): pvoid;
  put?(req: ControllerRequest<TParamKeys, TOriginalRequest>, res: ControllerResponse<TOriginalResponse>): pvoid;
}

export { StatusCodes };
export { getReasonPhrase, getStatusCode, ReasonPhrases } from "http-status-codes";
