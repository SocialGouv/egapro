import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	cachedAuth: vi.fn(),
}));

vi.mock("~/server/audit/cachedAuth", () => ({ cachedAuth: mocks.cachedAuth }));

import { getSessionSiren } from "../sessionSiren";

const SIREN = "123456789";
const SIRET = `${SIREN}00015`;
const IMPERSONATED_SIREN = "987654321";

function request() {
	return new Request("https://egapro.test/api/whatever");
}

function signedIn(user: Record<string, unknown> | null) {
	mocks.cachedAuth.mockResolvedValue(user ? { user } : null);
}

describe("getSessionSiren", () => {
	beforeEach(() => {
		mocks.cachedAuth.mockReset();
	});

	it("resolves the siren from the session siret", async () => {
		signedIn({ id: "user-1", siret: SIRET });

		const { session, siren } = await getSessionSiren(request());

		expect(siren).toBe(SIREN);
		expect(session?.user?.id).toBe("user-1");
	});

	it("returns no session and no siren when the caller is anonymous", async () => {
		signedIn(null);

		expect(await getSessionSiren(request())).toEqual({
			session: null,
			siren: null,
		});
	});

	it.each([
		["a missing siret", undefined],
		["a null siret", null],
		["an empty siret", ""],
		["a siret shorter than a siren", "12345"],
		["a siret whose first nine characters are not digits", "1234A678900015"],
		["a siret padded with spaces", "  1234567800015"],
	])("yields no siren for %s", async (_label, siret) => {
		signedIn({ id: "user-1", siret });

		const { session, siren } = await getSessionSiren(request());

		expect(siren).toBeNull();
		expect(session?.user?.id).toBe("user-1");
	});

	it("resolves the impersonated siren for an admin in mimoquage", async () => {
		signedIn({
			id: "admin-1",
			siret: SIRET,
			isAdmin: true,
			impersonation: { siren: IMPERSONATED_SIREN },
		});

		const { siren } = await getSessionSiren(request());

		expect(siren).toBe(IMPERSONATED_SIREN);
	});

	it("ignores an impersonation field carried by a non-admin session", async () => {
		signedIn({
			id: "user-1",
			siret: SIRET,
			isAdmin: false,
			impersonation: { siren: IMPERSONATED_SIREN },
		});

		const { siren } = await getSessionSiren(request());

		expect(siren).toBe(SIREN);
	});

	it("rejects an impersonated siren that is not nine digits", async () => {
		signedIn({
			id: "admin-1",
			siret: SIRET,
			isAdmin: true,
			impersonation: { siren: "12345" },
		});

		const { siren } = await getSessionSiren(request());

		expect(siren).toBeNull();
	});
});
