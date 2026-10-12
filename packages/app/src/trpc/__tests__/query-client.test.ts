import { TRPCClientError } from "@trpc/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { shouldRetryQuery } from "../query-client";

function trpcClientError(code: string, httpStatus: number) {
	return TRPCClientError.from({
		error: {
			message: "erreur",
			code: -32_000,
			data: { code, httpStatus },
		},
	});
}

describe("shouldRetryQuery", () => {
	afterEach(() => {
		vi.doUnmock("@tanstack/react-query");
		vi.resetModules();
	});

	it("never retries a rate-limited query", () => {
		const error = trpcClientError("TOO_MANY_REQUESTS", 429);

		expect(shouldRetryQuery(0, error)).toBe(false);
	});

	it("retries any other failure up to three times", () => {
		const error = trpcClientError("INTERNAL_SERVER_ERROR", 500);

		expect(shouldRetryQuery(0, error)).toBe(true);
		expect(shouldRetryQuery(2, error)).toBe(true);
		expect(shouldRetryQuery(3, error)).toBe(false);
	});

	it("retries a non-tRPC failure like React Query's default", () => {
		expect(shouldRetryQuery(0, new Error("network down"))).toBe(true);
	});

	it("never retries on the server, like React Query's default", async () => {
		vi.resetModules();
		vi.doMock("@tanstack/react-query", async (importOriginal) => ({
			...(await importOriginal<typeof import("@tanstack/react-query")>()),
			isServer: true,
		}));
		const { shouldRetryQuery: serverShouldRetry } = await import(
			"../query-client"
		);

		expect(serverShouldRetry(0, new Error("network down"))).toBe(false);
	});

	it("wires the predicate as the default query retry policy", async () => {
		const { createQueryClient } = await import("../query-client");

		expect(createQueryClient().getDefaultOptions().queries?.retry).toBe(
			(await import("../query-client")).shouldRetryQuery,
		);
	});
});
