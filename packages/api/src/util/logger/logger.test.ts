const now = 1570137016663;

describe("test the output of the logger", () => {
  const sentry = require("@sentry/node");
  let mockStdout: jest.SpyInstance;
  let logger: any;

  beforeEach(() => {
    // Mock stdout so we can check it's been called by the logger.
    mockStdout = jest.spyOn(global.process.stdout, "write");
    // jest.spyOn will still call the underlying function. We don't want logs to
    // be displayed during the tests.
    mockStdout.mockImplementation(() => {});
    // Mock `Date.now()` so we have a comparable timestamp.
    global.Date.now = jest.fn(() => now);
    // Mock `captureException` from Sentry to check that it's correctly called.
    sentry.captureException = jest.fn();
    // Mock the `configuration` module to fake an `apiSentryDsn`.
    jest.mock("../../configuration", () => ({
      configuration: { apiSentryDsn: "some sentry dsn" },
    }));
    // Only now require the logger module so it uses the mocks.
    logger = require("./").logger;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("info uses console.log", () => {
    logger.info("just an info");
    expect(mockStdout).toHaveBeenCalledTimes(1);
    // Grab the latest mock call, and get its first (and only) argument.
    const latestCall = mockStdout.mock.calls.pop();
    const log = (latestCall && latestCall[0]) || "";
    // Contains the timestamp.
    expect(log).toContain(now);
    // Contains the message.
    expect(log).toContain("just an info");
    // Sentry.captureException shouldn't have been called.
    expect(sentry.captureException).not.toHaveBeenCalled();
  });
  test("error uses console.log and includes the stack trace", () => {
    const error = new Error("this is an error");
    logger.error("just an error", error);
    expect(mockStdout).toHaveBeenCalledTimes(1);
    // Grab the latest mock call, and get its first (and only) argument.
    const latestCall = mockStdout.mock.calls.pop();
    const log = (latestCall && latestCall[0]) || "";
    // Contains the timestamp.
    expect(log).toContain(now);
    // Contains the message.
    expect(log).toContain("just an error");
    // Contains the error.
    expect(log).toContain("this is an error");
    // ... and contains the stack trace.
    expect(log).toContain(JSON.stringify(error.stack));
    // Sentry.captureException should have been called with the error.
    expect(sentry.captureException).toHaveBeenCalledWith(error);
  });
});
