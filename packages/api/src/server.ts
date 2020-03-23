import * as cors from "@koa/cors";
import * as Sentry from "@sentry/node";
import * as Koa from "koa";
import * as bodyParser from "koa-bodyparser";
import { configuration } from "./configuration";
import { router } from "./routes";
import { logger } from "./util";

if (!!configuration.apiSentryDsn) {
  logger.info(`Logging to sentry DSN ${configuration.apiSentryDsn}`);
  logger.info(`Sentry environment is ${configuration.apiSentryEnvironment}`);
  Sentry.init({
    debug: true,
    dsn: configuration.apiSentryDsn,
    environment: configuration.apiSentryEnvironment,
  });
}

const app = new Koa();

app.use(bodyParser());
app.use(cors());

app.use(router.routes());
app.use(router.allowedMethods());

app.on("error", (err: Error, ctx: Koa.Context) => {
  logger.error(`url: ${ctx.originalUrl}: `, err);
});

app.listen(configuration.apiPort);
