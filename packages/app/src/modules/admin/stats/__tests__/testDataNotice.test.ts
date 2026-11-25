import { shouldShowTestDataNotice } from "../testDataNotice";

describe("shouldShowTestDataNotice", () => {
	it("shows the notice in dev", () => {
		expect(shouldShowTestDataNotice("dev")).toBe(true);
	});

	it.each([
		"preprod",
		"prod",
		undefined,
	])("hides the notice in %s", (deployEnv) => {
		expect(shouldShowTestDataNotice(deployEnv)).toBe(false);
	});
});
