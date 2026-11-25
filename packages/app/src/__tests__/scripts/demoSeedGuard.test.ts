import {
	assertDemoSeedAllowed,
	isDemoSeedAllowed,
} from "#scripts/demoSeedGuard";

describe("isDemoSeedAllowed", () => {
	it.each([undefined, "", "dev"])("allows %s", (deployEnv) => {
		expect(isDemoSeedAllowed(deployEnv)).toBe(true);
	});

	it.each(["preprod", "prod", "staging"])("refuses %s", (deployEnv) => {
		expect(isDemoSeedAllowed(deployEnv)).toBe(false);
	});
});

describe("assertDemoSeedAllowed", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllEnvs();
	});

	it("exits before any write when the environment is not dev", () => {
		vi.stubEnv("NEXT_PUBLIC_EGAPRO_ENV", "prod");
		const exit = vi
			.spyOn(process, "exit")
			.mockImplementation((() => undefined) as never);
		const error = vi.spyOn(console, "error").mockImplementation(() => {});

		assertDemoSeedAllowed();

		expect(exit).toHaveBeenCalledWith(1);
		expect(error).toHaveBeenCalledWith(
			expect.stringContaining('NEXT_PUBLIC_EGAPRO_ENV is "prod"'),
		);
	});

	it("lets the seed run in dev", () => {
		vi.stubEnv("NEXT_PUBLIC_EGAPRO_ENV", "dev");
		const exit = vi.spyOn(process, "exit");

		assertDemoSeedAllowed();

		expect(exit).not.toHaveBeenCalled();
	});
});
