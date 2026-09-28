import { TRPCError } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
	ADMIN_MFA_REQUIRED_MARKER,
	AdminMfaRequiredError,
} from "~/modules/admin/shared/adminMfaGuard";
import {
	createTRPCRouter,
	logTRPCError,
	publicProcedure,
	UNEXPECTED_ERROR_MESSAGE,
} from "~/server/api/trpc";

vi.mock("~/server/auth", () => ({ auth: vi.fn() }));
vi.mock("~/server/db", () => ({ db: {} }));

const router = createTRPCRouter({
	technical: publicProcedure.query(() => {
		throw new Error("Failed query: SELECT private_value FROM private_table");
	}),
	primitive: publicProcedure.query(() => {
		throw "PRIVATE_PRIMITIVE_4001";
	}),
	business: publicProcedure.query(() => {
		throw new TRPCError({ code: "BAD_REQUEST", message: "Erreur métier" });
	}),
	intentionalInternal: publicProcedure.query(() => {
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "Erreur contrôlée",
			cause: new Error("Erreur contrôlée"),
		});
	}),
	mfa: publicProcedure.query(() => {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Authentification renforcée requise",
			cause: new AdminMfaRequiredError(),
		});
	}),
	validation: publicProcedure
		.input(z.object({ label: z.string().min(2) }))
		.query(() => true),
});

async function requestError(
	path: string,
	input?: unknown,
	isDevelopment = false,
) {
	const url = new URL(`http://localhost/api/trpc/${path}`);
	if (input !== undefined) {
		url.searchParams.set("input", JSON.stringify({ json: input }));
	}
	const response = await fetchRequestHandler({
		endpoint: "/api/trpc",
		req: new Request(url),
		router,
		createContext: async () =>
			({
				db: {},
				session: null,
				headers: new Headers(),
			}) as never,
		onError: ({ error, path: errorPath }) =>
			logTRPCError(error, errorPath, isDevelopment),
	});
	const body = await response.text();
	const parsed = JSON.parse(body);
	return { body, error: parsed.error?.json ?? parsed.error };
}

describe("tRPC HTTP error contract", () => {
	afterEach(() => vi.restoreAllMocks());

	it("hides an unexpected Error and logs its original cause", async () => {
		const logged = vi
			.spyOn(console, "error")
			.mockImplementation(() => undefined);
		const { body, error } = await requestError("technical");
		expect(error.message).toBe(UNEXPECTED_ERROR_MESSAGE);
		expect(error.data.code).toBe("INTERNAL_SERVER_ERROR");
		expect(error.data.stack).toBeUndefined();
		expect(body).not.toContain("private_table");
		expect(body).not.toContain("private_value");
		expect(logged).toHaveBeenCalledWith(
			"tRPC failed on technical",
			expect.objectContaining({
				message: expect.stringContaining("private_table"),
			}),
		);
	});

	it("hides a thrown primitive", async () => {
		vi.spyOn(console, "error").mockImplementation(() => undefined);
		const { body, error } = await requestError("primitive");
		expect(error.message).toBe(UNEXPECTED_ERROR_MESSAGE);
		expect(body).not.toContain("PRIVATE_PRIMITIVE_4001");
	});

	it("preserves explicit errors, including an internal error with matching cause", async () => {
		const logged = vi
			.spyOn(console, "error")
			.mockImplementation(() => undefined);
		const business = await requestError("business");
		expect(business.error.message).toBe("Erreur métier");
		expect(business.error.data.code).toBe("BAD_REQUEST");
		const internal = await requestError("intentionalInternal");
		expect(internal.error.message).toBe("Erreur contrôlée");
		expect(internal.error.data.code).toBe("INTERNAL_SERVER_ERROR");
		expect(logged).not.toHaveBeenCalled();
		await requestError("business", undefined, true);
		expect(logged).toHaveBeenCalledWith(
			"tRPC failed on business",
			expect.objectContaining({ message: "Erreur métier" }),
		);
	});

	it("preserves MFA and Zod validation data", async () => {
		const mfa = await requestError("mfa");
		expect(mfa.error.message).toBe("Authentification renforcée requise");
		expect(mfa.error.data[ADMIN_MFA_REQUIRED_MARKER]).toBe(true);
		const validation = await requestError("validation", { label: "" });
		expect(validation.error.data.code).toBe("BAD_REQUEST");
		expect(validation.error.data.zodError.fieldErrors.label).toHaveLength(1);
	});
});
