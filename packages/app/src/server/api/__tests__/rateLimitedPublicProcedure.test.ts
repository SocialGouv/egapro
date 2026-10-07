import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ checkPublicApiRateLimit: vi.fn() }));

vi.mock("~/server/auth", () => ({ auth: vi.fn() }));
vi.mock("~/server/db", () => ({ db: {} }));
vi.mock("~/server/services/publicApiRateLimit", async (importOriginal) => ({
	...(await importOriginal<
		typeof import("~/server/services/publicApiRateLimit")
	>()),
	checkPublicApiRateLimit: mocks.checkPublicApiRateLimit,
}));

import { createTRPCRouter, rateLimitedPublicProcedure } from "../trpc";

const handlerSpy = vi.fn();
const throttledRouter = createTRPCRouter({
	ping: rateLimitedPublicProcedure.query(() => {
		handlerSpy();
		return "pong";
	}),
});

const headers = new Headers({ "x-real-ip": "203.0.113.30" });

function createCaller() {
	return throttledRouter.createCaller({
		db: {},
		session: null,
		headers,
	} as never);
}

describe("rateLimitedPublicProcedure", () => {
	beforeEach(() => {
		mocks.checkPublicApiRateLimit.mockReset();
		handlerSpy.mockReset();
	});

	it("checks the quota against the request headers and runs the procedure when allowed", async () => {
		mocks.checkPublicApiRateLimit.mockResolvedValue("allowed");

		await expect(createCaller().ping()).resolves.toBe("pong");

		expect(mocks.checkPublicApiRateLimit).toHaveBeenCalledWith(headers);
		expect(handlerSpy).toHaveBeenCalledOnce();
	});

	it("throws TOO_MANY_REQUESTS without running the procedure once the quota is spent", async () => {
		mocks.checkPublicApiRateLimit.mockResolvedValue("limited");

		await expect(createCaller().ping()).rejects.toMatchObject({
			code: "TOO_MANY_REQUESTS",
			message: "Quota d’appels dépassé. Réessayez dans une minute.",
		});
		expect(handlerSpy).not.toHaveBeenCalled();
	});

	it("throws UNAUTHORIZED without running the procedure for an unknown bearer token", async () => {
		mocks.checkPublicApiRateLimit.mockResolvedValue("invalid_token");

		await expect(createCaller().ping()).rejects.toMatchObject({
			code: "UNAUTHORIZED",
			message: "Jeton d’API invalide.",
		});
		expect(handlerSpy).not.toHaveBeenCalled();
	});
});
