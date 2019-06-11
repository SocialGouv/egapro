import { createLogger, format, transports } from 'winston';

const alignedWithColorsAndTime = format.combine(
  format.colorize(),
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.align(),
  format.errors({ stack: true }),
  format.printf((info) => {
    const {
      timestamp, level, message, ...args
    } = info;

    return `${timestamp} [${level}]: ${message} ${Object.keys(args).length ? JSON.stringify(args, null, 2) : ''}`;
  }),
);

const logger = createLogger({
  level: 'info',
  // tslint:disable-next-line: object-literal-sort-keys
  format: alignedWithColorsAndTime,
  transports: [
    new transports.File({ filename: './logs/ds-collector-err.log', level: 'error' }),
    new transports.File({ filename: './logs/ds-collector.log' })
  ]
});

//
// If we're not in production then **ALSO** log to the `console`
// with the colorized simple format.
//
// if (process.env.NODE_ENV !== 'production') {
logger.add(new transports.Console({
  format: alignedWithColorsAndTime
}));
// }

export default logger;
