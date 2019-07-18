import * as Koa from "koa";

export const versionController = {
  get: (ctx: Koa.Context) => {
    const value = require("../../package.json").version;
    ctx.body = {
      version: value ? value : "not defined"
    };
  }
};
