// @ts-ignore
global.console = {
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

const someDate = new Date("2019-10-01 23:18:02");
// @ts-ignore
global.Date = class extends Date {
  constructor() {
    // @ts-ignore
    return super(someDate);
  }
};

describe("test the output of the logger", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules(); // this is important - it clears the cache
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  test("info uses console.log", () => {
    const logger = require("./").logger;
    logger.info("just an info");
    // @ts-ignore
    // Grab the latest mock call, and get its first (and only) argument.
    const latestMockCall = global.console.log.mock.calls.pop()[0];
    // Contains the timestamp.
    expect(latestMockCall).toContain("2019-10-01 23:18:02");
    // Contains the message.
    expect(latestMockCall).toContain("just an info");
  });
  test("error uses console.log and includes the stack trace", () => {
    const logger = require("./").logger;
    const error = new Error("this is an error");
    logger.error("just an error", error);
    // @ts-ignore
    // Grab the latest mock call, and get its first (and only) argument.
    const latestMockCall = global.console.log.mock.calls.pop()[0];
    // Contains the timestamp.
    expect(latestMockCall).toContain("2019-10-01 23:18:02");
    // Contains the message.
    expect(latestMockCall).toContain("just an error");
    // Contains the error.
    expect(latestMockCall).toContain("this is an error");
    // ... and contains the stack trace.
    expect(latestMockCall).toContain(error.stack);
  });
  test("error sends a call to sentry if it's enabled", () => {
    // Fake the enabling of sentry.
    process.env.API_SENTRY_ENABLED = "true";
    // Mock raven.captureException.
    const raven = require("raven");
    raven.captureException = jest.fn();
    // Log an error.
    const logger = require("./").logger;
    const error = new Error("this is an error");
    logger.error("just an error", error);
    // Make sure the error was sent to sentry.
    expect(raven.captureException).toHaveBeenCalledWith(error);
  });
});
