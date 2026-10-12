import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	handler: vi.fn(),
}));

vi.mock("~/server/auth", () => ({ handler: mocks.handler }));

import { GET, POST } from "../route";

function context(segments: string[]) {
	return { params: Promise.resolve({ nextauth: segments }) };
}

function post(path: string): Request {
	return new Request(`https://egapro.test/api/auth/${path}`, {
		method: "POST",
		body: new URLSearchParams({ level: "error", code: "SIGNIN_OAUTH_ERROR" }),
	});
}

describe("/api/auth/[...nextauth]", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.handler.mockResolvedValue(new Response("handled"));
	});

	it.each([
		[["_log"]],
		[["_log", "x"]],
		[["_log", "a", "b"]],
	])("drops client log beacons without handing them to NextAuth (%j)", async (segments) => {
		const response = await POST(post(segments.join("/")), context(segments));

		expect(response.status).toBe(204);
		expect(mocks.handler).not.toHaveBeenCalled();
	});

	it("hands every other POST action to NextAuth", async () => {
		const request = post("signout");
		const routeContext = context(["signout"]);

		const response = await POST(request, routeContext);

		expect(await response.text()).toBe("handled");
		expect(mocks.handler).toHaveBeenCalledWith(request, routeContext);
	});

	it("serves GET through NextAuth unchanged", () => {
		expect(GET).toBe(mocks.handler);
	});
});
