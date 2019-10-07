import * as Sentry from "@sentry/node";
import * as pino from "pino";
import { configuration } from "../../configuration";

const logger = pino();
const pinoErrorLogger = logger.error.bind(logger);

interface ApiLogger extends Omit<pino.BaseLogger, "error"> {
  error(message: string, error: object): void;
}

const errorLogger = (message: string, error: object) => {
  // `logger.error` was previously called as `console.error`, with first the
  // error message, and then the error object.
  pinoErrorLogger({ err: error }, message);
  if (!!configuration.apiSentryDsn) {
    Sentry.captureException(error);
  }
};

(logger as ApiLogger).error = errorLogger;

export default logger;
