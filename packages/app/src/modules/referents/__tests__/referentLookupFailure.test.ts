import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";

import {
	REFERENT_LOOKUP_RATE_LIMITED,
	toReferentLookupFailure,
} from "../shared/referentLookupFailure";

describe("toReferentLookupFailure", () => {
	it("flags a quota hit instead of reporting the referent as missing", () => {
		expect(
			toReferentLookupFailure(new TRPCError({ code: "TOO_MANY_REQUESTS" })),
		).toBe(REFERENT_LOOKUP_RATE_LIMITED);
	});

	it.each([
		"NOT_FOUND",
		"BAD_REQUEST",
	] as const)("reads a %s as a missing referent", (code) => {
		expect(toReferentLookupFailure(new TRPCError({ code }))).toBeNull();
	});

	it("rethrows any other tRPC error", () => {
		const error = new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
		expect(() => toReferentLookupFailure(error)).toThrow(error);
	});

	it("rethrows a non-tRPC error", () => {
		const error = new Error("database unreachable");
		expect(() => toReferentLookupFailure(error)).toThrow(error);
	});
});
