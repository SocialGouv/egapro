import {
	getMockFileTracingIncludes,
	isDevEnvironment,
} from "~/server/config/mockAssets.js";

const DEV_INCLUDES = {
	"/api/gip-mds/mock": ["./data/mock-gip-mds.csv"],
};

describe("isDevEnvironment", () => {
	it.each([undefined, "", "dev"])("allows %s", (deployEnv) => {
		expect(isDevEnvironment(deployEnv)).toBe(true);
	});

	it.each(["preprod", "prod", "staging"])("refuses %s", (deployEnv) => {
		expect(isDevEnvironment(deployEnv)).toBe(false);
	});
});

describe("getMockFileTracingIncludes", () => {
	it("traces the GIP mock CSV in dev", () => {
		expect(getMockFileTracingIncludes("dev")).toEqual(DEV_INCLUDES);
	});

	it("traces the GIP mock CSV when the environment is absent", () => {
		expect(getMockFileTracingIncludes(undefined)).toEqual(DEV_INCLUDES);
	});

	it("traces nothing in preprod", () => {
		expect(getMockFileTracingIncludes("preprod")).toEqual({});
	});

	it("traces nothing in prod", () => {
		expect(getMockFileTracingIncludes("prod")).toEqual({});
	});

	it("traces nothing for an unknown environment", () => {
		expect(getMockFileTracingIncludes("staging")).toEqual({});
	});
});
