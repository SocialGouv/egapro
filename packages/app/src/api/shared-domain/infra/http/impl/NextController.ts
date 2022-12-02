import { Object } from "@common/utils/overload";
import type { SimpleObject } from "@common/utils/types";
import type { ServerResponse } from "http";
import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";

import type { AnyUrl, BackToReferer, Controller, ControllerRequest, ControllerResponse } from "../Controller";
import { StatusCodes } from "../Controller";

export type NextController<TParamKeys extends string = string> = Controller<
  TParamKeys,
  NextApiRequest,
  NextApiResponse
>;

export namespace NextController {
  export type Req<TController extends NextController> = Parameters<NonNullable<TController["get"]>>[0];
  export type Res<TController extends NextController> = Parameters<NonNullable<TController["get"]>>[1];
}

export interface NextControllerRequest<TParamKeys extends string = string>
  extends ControllerRequest<TParamKeys, NextApiRequest> {
  query: NextApiRequest["query"];
}

export class NextControllerResponse implements ControllerResponse<NextApiResponse> {
  public readonly _nodeResponse: ServerResponse;
  constructor(public readonly _res: NextApiResponse) {
    this._nodeResponse = _res;
  }
  public header(key: string, value: string): this {
    this._res.setHeader(key, value);
    return this;
  }
  public headers(headers: SimpleObject<string>): this {
    Object.entries(headers).forEach(([key, value]) => this.header(key, value));
    return this;
  }

  public json(jsonBody: object): void {
    this._res.json(jsonBody);
  }

  public redirect(url: AnyUrl | BackToReferer): this;
  public redirect(code: StatusCodes, url: AnyUrl | BackToReferer): this;
  public redirect(code: unknown, url?: unknown): this {
    if (typeof code === "string") {
      this._res.redirect(code);
    } else {
      this._res.redirect(code as number, url as string);
    }

    return this;
  }

  public send(body: Buffer | object | string | null): void {
    this._res.send(body);
  }
  public status(code: StatusCodes): this {
    this._res.status(code);
    return this;
  }
}

export const handler = (controller: NextController): NextApiHandler => {
  return (req, res) => {
    const nextControllerRequest: NextControllerRequest = {
      _nodeRequest: req,
      _req: req,
      body: req.body,
      params: req.query as SimpleObject<string>,
      query: req.query,
    };
    const nextControllerResponse = new NextControllerResponse(res);
    if (controller.get && req.method === "GET") return controller.get(nextControllerRequest, nextControllerResponse);
    if (controller.put && req.method === "PUT") return controller.put(nextControllerRequest, nextControllerResponse);
    if (controller.post && req.method === "POST") return controller.post(nextControllerRequest, nextControllerResponse);
    if (controller.delete && req.method === "DELETE")
      return controller.delete(nextControllerRequest, nextControllerResponse);
    return res.status(StatusCodes.METHOD_NOT_ALLOWED).send(null);
  };
};
