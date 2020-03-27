import * as Koa from "koa";

interface AuthenticateOptions {
  token: string | undefined;
}

export const authenticate = ({
  token,
}: AuthenticateOptions): Koa.Middleware => (ctx, next) => {
  if (token === "" || token === undefined) {
    ctx.throw(501, "Server token is not set");
    return;
  }

  if (ctx.query.token === token) {
    return next();
  }

  ctx.throw(401, "Invalid token");
};
