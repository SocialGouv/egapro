// @ts-ignore
global.console = {
    log: jest.fn(),
    info: jest.fn(),
    // error: jest.fn()
    error: global.console.error
};

const someDate = new Date("2019-10-01 23:18:02");
// @ts-ignore
global.Date = class extends Date {
    constructor() {
        // @ts-ignore
        return super(someDate);
    }
}

describe("test the output of the logger", () => {
    const logger = require("./");
    test("info uses color escape sequences", () => {
        logger.logger.info("just an info");
        expect(global.console.log).toHaveBeenCalledWith("2019-10-01 23:18:02 \u001b[32minfo\u001b[39m: just an info ");
    });
    test("error uses color escape sequences and includes the stack trace", () => {
        const error = new Error("this is an error");
        logger.logger.error("just an error", error);
        // @ts-ignore
        // Grab the latest mock call, and get its first (and only) argument.
        const latestMockCall = global.console.log.mock.calls.pop()[0];
        // This argument starts with the timestamped colored message...
        expect(latestMockCall.startsWith(
            "2019-10-01 23:18:02 \u001b[31merror\u001b[39m: just an errorthis is an error\n"
        )).toBeTruthy();
        // ... and contains the stack trace.
        expect(latestMockCall).toContain(error.stack);
    });
});