import { TRPCError } from "@trpc/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("~/server/auth", () => ({ auth: vi.fn() }));
vi.mock("~/server/db", () => ({ db: {} }));

import { adminProcedure, createTRPCRouter } from "../trpc";

const pingRouter = createTRPCRouter({
	ping: adminProcedure.query(() => "pong"),
});

function createCaller(isAdmin: boolean | null) {
	const session =
		isAdmin === null
			? null
			: {
					user: { id: "user-1", email: "u@example.com", isAdmin },
					expires: "",
				};
	return pingRouter.createCaller({
		db: {},
		session,
		headers: new Headers(),
	} as never);
}

describe("adminProcedure", () => {
	it("throws UNAUTHORIZED when there is no session", async () => {
		await expect(createCaller(null).ping()).rejects.toMatchObject({
			code: "UNAUTHORIZED",
		});
	});

	it("throws FORBIDDEN when the user is not admin", async () => {
		await expect(createCaller(false).ping()).rejects.toBeInstanceOf(TRPCError);
		await expect(createCaller(false).ping()).rejects.toMatchObject({
			code: "FORBIDDEN",
		});
	});

	it("resolves for an admin user", async () => {
		await expect(createCaller(true).ping()).resolves.toBe("pong");
	});
});
