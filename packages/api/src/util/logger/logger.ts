import * as pino from "pino";

const logger = pino();
const pinoErrorLogger = logger.error.bind(logger);

// @ts-ignore
logger.error = (message: string, error: object) => {
  // `logger.error` was previously called as `console.error`, with first the
  // error message, and then the error object.
  pinoErrorLogger({ err: error }, message);
};

export default logger;
