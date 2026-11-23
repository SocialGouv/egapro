import { describe, expect, it } from "vitest";
import { sentryTracesSampleRate } from "../sentrySampling";

describe("sentryTracesSampleRate", () => {
	it("samples every trace in development", () => {
		expect(sentryTracesSampleRate("dev")).toBe(1);
	});

	it("samples every trace on preprod", () => {
		expect(sentryTracesSampleRate("preprod")).toBe(1);
	});

	it("samples one trace in ten in production", () => {
		expect(sentryTracesSampleRate("prod")).toBe(0.1);
	});

	it("falls back to the production rate when the environment is missing", () => {
		expect(sentryTracesSampleRate(undefined)).toBe(0.1);
	});

	it("falls back to the production rate on an unknown environment", () => {
		expect(sentryTracesSampleRate("recette")).toBe(0.1);
	});
});
