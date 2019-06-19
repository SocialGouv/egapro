import { format } from "logform";
import { createLogger, transports } from "winston";

const appendErrorInfo = (info: any, error: Error) => {
  return {
    ...info,
    message: error.message,
    stack: error.stack
  };
};

const errorStackFormat = format((info: any) => {
  if (info instanceof Error) {
    return appendErrorInfo(info, info);
  }
  const { ...args } = info;
  if (args) {
    for (let i = 0; i++; i < args.length) {
      if (args[i] instanceof Error) {
        return appendErrorInfo(info, args[i]);
      }
    }
  }
  return info;
});

const alignedWithColorsAndTime = format.combine(
  format.colorize(),
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  errorStackFormat(),
  format.printf((info: any) => {
    const { timestamp, level, message, stack, ...args } = info;

    if (stack) {
      return `${timestamp} ${level}: ${message}\n${stack}`;
    } else {
      return `${timestamp} ${level}: ${message} ${
        Object.keys(args).length ? JSON.stringify(args, null, 2) : ""
      }`;
    }
  })
);

const logger = createLogger({
  level: "info",
  transports: [
    new transports.Console({
      format: alignedWithColorsAndTime,
      handleExceptions: true
    })
  ]
});

export default logger;
