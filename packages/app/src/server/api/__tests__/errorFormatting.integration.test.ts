import { TRPCError } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { env } from "~/env.js";
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
import { db } from "~/server/db";

const sensitiveValue = "PRIVATE_PARAMETER_4001";

const router = createTRPCRouter({
	sqlFailure: publicProcedure.query(async ({ ctx }) => {
		await ctx.db.execute(
			sql`INSERT INTO egapro_error_format_test (value) VALUES (${sensitiveValue})`,
		);
		return true;
	}),
	unexpected: publicProcedure.query(() => {
		throw new Error("PRIVATE_UNEXPECTED_4001");
	}),
	unexpectedPrimitive: publicProcedure.query(() => {
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

async function getError(path: string, input?: unknown) {
	const url = new URL(`http://localhost/api/trpc/${path}`);
	if (input !== undefined) {
		url.searchParams.set("input", JSON.stringify({ json: input }));
	}
	const response = await fetchRequestHandler({
		endpoint: "/api/trpc",
		req: new Request(url),
		router,
		createContext: async () => ({
			db,
			session: null,
			headers: new Headers(),
		}),
		onError: ({ error, path: errorPath }) =>
			logTRPCError(error, errorPath, false),
	});
	const body = await response.text();
	const parsed = JSON.parse(body);
	return { body, error: parsed.error?.json ?? parsed.error };
}

describe("tRPC error formatting over HTTP", () => {
	let database: ReturnType<typeof postgres>;

	beforeAll(async () => {
		database = postgres(env.DATABASE_URL, { max: 1 });
		await database`CREATE TABLE egapro_error_format_test (value varchar(3) NOT NULL)`;
	});

	afterAll(async () => {
		await database`DROP TABLE IF EXISTS egapro_error_format_test`;
		await database.end();
	});

	it("hides a real Postgres constraint failure and logs its original error", async () => {
		const logged = vi
			.spyOn(console, "error")
			.mockImplementation(() => undefined);
		try {
			const { body, error } = await getError("sqlFailure");
			expect(error.message).toBe(UNEXPECTED_ERROR_MESSAGE);
			expect(error.data.code).toBe("INTERNAL_SERVER_ERROR");
			expect(body).not.toContain("egapro_error_format_test");
			expect(body).not.toContain("INSERT INTO");
			expect(body).not.toContain("value");
			expect(body).not.toContain(sensitiveValue);
			expect(error.data.stack).toBeUndefined();
			expect(logged).toHaveBeenCalledWith(
				"tRPC failed on sqlFailure",
				expect.objectContaining({
					message: expect.stringContaining(sensitiveValue),
				}),
			);
		} finally {
			logged.mockRestore();
		}
	});

	it("hides an unexpected non-database exception", async () => {
		const logged = vi
			.spyOn(console, "error")
			.mockImplementation(() => undefined);
		try {
			const { body, error } = await getError("unexpected");
			expect(error.message).toBe(UNEXPECTED_ERROR_MESSAGE);
			expect(body).not.toContain("PRIVATE_UNEXPECTED_4001");
			const primitive = await getError("unexpectedPrimitive");
			expect(primitive.error.message).toBe(UNEXPECTED_ERROR_MESSAGE);
			expect(primitive.body).not.toContain("PRIVATE_PRIMITIVE_4001");
			expect(logged).toHaveBeenCalled();
		} finally {
			logged.mockRestore();
		}
	});

	it("preserves explicit business and internal errors", async () => {
		const business = await getError("business");
		expect(business.error.message).toBe("Erreur métier");
		expect(business.error.data.code).toBe("BAD_REQUEST");
		const internal = await getError("intentionalInternal");
		expect(internal.error.message).toBe("Erreur contrôlée");
		expect(internal.error.data.code).toBe("INTERNAL_SERVER_ERROR");
	});

	it("preserves the MFA marker and Zod field errors", async () => {
		const mfa = await getError("mfa");
		expect(mfa.error.message).toBe("Authentification renforcée requise");
		expect(mfa.error.data[ADMIN_MFA_REQUIRED_MARKER]).toBe(true);
		const validation = await getError("validation", { label: "" });
		expect(validation.error.data.code).toBe("BAD_REQUEST");
		expect(validation.error.data.zodError.fieldErrors.label).toHaveLength(1);
	});
});
