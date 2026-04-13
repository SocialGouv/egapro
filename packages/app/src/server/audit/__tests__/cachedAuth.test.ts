import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAuth = vi.fn();

vi.mock("~/server/auth", () => ({
	auth: mockAuth,
}));

const { cachedAuth } = await import("../cachedAuth");

describe("cachedAuth", () => {
	beforeEach(() => {
		mockAuth.mockReset();
		mockAuth.mockResolvedValue({ user: { id: "user-1" } });
	});

	it("calls auth() only once when the same request is passed twice", async () => {
		const request = new Request("http://localhost/test");

		const first = await cachedAuth(request);
		const second = await cachedAuth(request);

		expect(mockAuth).toHaveBeenCalledTimes(1);
		expect(first).toBe(second);
	});

	it("calls auth() again for a different request object", async () => {
		const requestA = new Request("http://localhost/a");
		const requestB = new Request("http://localhost/b");

		await cachedAuth(requestA);
		await cachedAuth(requestB);

		expect(mockAuth).toHaveBeenCalledTimes(2);
	});

	it("shares the in-flight promise when called concurrently", async () => {
		const request = new Request("http://localhost/test");
		let resolver: ((value: unknown) => void) | undefined;
		mockAuth.mockReturnValueOnce(
			new Promise((resolve) => {
				resolver = resolve;
			}),
		);

		const p1 = cachedAuth(request);
		const p2 = cachedAuth(request);
		resolver?.({ user: { id: "user-1" } });

		const [first, second] = await Promise.all([p1, p2]);
		expect(first).toBe(second);
		expect(mockAuth).toHaveBeenCalledTimes(1);
	});
});
