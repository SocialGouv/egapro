import { describe, expect, it } from "vitest";

import {
	NON_PRODUCTION_TRACES_SAMPLE_RATE,
	PRODUCTION_TRACES_SAMPLE_RATE,
	resolveTracesSampleRate,
} from "../sampling";

describe("resolveTracesSampleRate", () => {
	it("samples a tenth of the transactions in production", () => {
		expect(
			resolveTracesSampleRate({ nodeEnv: "production", override: undefined }),
		).toBe(PRODUCTION_TRACES_SAMPLE_RATE);
	});

	it("samples everything outside production", () => {
		expect(
			resolveTracesSampleRate({ nodeEnv: "development", override: undefined }),
		).toBe(NON_PRODUCTION_TRACES_SAMPLE_RATE);
		expect(
			resolveTracesSampleRate({ nodeEnv: undefined, override: undefined }),
		).toBe(NON_PRODUCTION_TRACES_SAMPLE_RATE);
	});

	it("lets an explicit value override the environment default", () => {
		expect(
			resolveTracesSampleRate({ nodeEnv: "production", override: "0.5" }),
		).toBe(0.5);
		expect(resolveTracesSampleRate({ nodeEnv: "test", override: "0" })).toBe(0);
		expect(resolveTracesSampleRate({ nodeEnv: "test", override: "1" })).toBe(1);
	});

	it("treats an empty value as absent, not as zero", () => {
		expect(
			resolveTracesSampleRate({ nodeEnv: "production", override: "" }),
		).toBe(PRODUCTION_TRACES_SAMPLE_RATE);
		expect(
			resolveTracesSampleRate({ nodeEnv: "production", override: "  " }),
		).toBe(PRODUCTION_TRACES_SAMPLE_RATE);
	});

	it.each([
		"not-a-number",
		"-0.1",
		"1.1",
		"NaN",
		"Infinity",
	])("falls back to the default rather than crashing on %s", (override) => {
		expect(resolveTracesSampleRate({ nodeEnv: "production", override })).toBe(
			PRODUCTION_TRACES_SAMPLE_RATE,
		);
	});
});
