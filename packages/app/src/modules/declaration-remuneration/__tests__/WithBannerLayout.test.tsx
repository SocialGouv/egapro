import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRedirect, mockAuth, mockGetEffectiveSiren } = vi.hoisted(() => ({
	mockRedirect: vi.fn<(url: string) => never>().mockImplementation(() => {
		throw new Error("NEXT_REDIRECT");
	}),
	mockAuth: vi.fn(),
	mockGetEffectiveSiren: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	usePathname: vi.fn(),
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
		back: vi.fn(),
		refresh: vi.fn(),
	}),
	redirect: mockRedirect,
}));

vi.mock("~/server/auth", () => ({ auth: mockAuth }));

vi.mock("~/server/auth/companyAccess", async (importOriginal) => ({
	...(await importOriginal<typeof import("~/server/auth/companyAccess")>()),
	getEffectiveSiren: mockGetEffectiveSiren,
}));

vi.mock("~/server/db/getCampaignDeadlines", async () => {
	const { getDefaultCampaignDeadlines } =
		await vi.importActual<typeof import("~/modules/domain")>(
			"~/modules/domain",
		);
	return {
		getCampaignDeadlines: vi.fn((year: number) =>
			Promise.resolve(getDefaultCampaignDeadlines(year)),
		),
	};
});

vi.mock("~/trpc/server", () => ({
	api: {
		company: { get: vi.fn() },
		declaration: { getOrCreate: vi.fn() },
		profile: { get: vi.fn() },
	},
}));

// The barrel pulls client components this redirect-only suite never renders.
vi.mock("~/modules/declaration-remuneration", () => ({
	DeclarationLayout: ({ children }: { children: React.ReactNode }) => children,
	MissingSiret: () => "missing-siret",
}));

import WithBannerLayout from "~/app/declaration-remuneration/(with-banner)/layout";
import { COMPANY_SIZE_ANNUAL_MIN } from "~/modules/domain";
import { api } from "~/trpc/server";

const SIREN = "123456789";
const PHONE = "0612345678";
const MY_SPACE_PATH = "/mon-espace";
const DEFAULT_USER = { id: "u1", siret: `${SIREN}00015` };

function mockLayout({
	gipWorkforce = COMPANY_SIZE_ANNUAL_MIN,
	hasCse = true as boolean | null,
	phone = PHONE as string | null,
	profileFails = false,
	user = DEFAULT_USER as Record<string, unknown>,
}: {
	gipWorkforce?: number | null;
	hasCse?: boolean | null;
	phone?: string | null;
	profileFails?: boolean;
	user?: Record<string, unknown>;
} = {}) {
	mockAuth.mockResolvedValue({ user });
	mockGetEffectiveSiren.mockReturnValue(SIREN);
	vi.mocked(api.company.get).mockResolvedValue({
		name: "Société Démo",
		siren: SIREN,
		nafCode: null,
		nafLabel: null,
		gipWorkforce,
		hasCse,
	} as never);
	vi.mocked(api.declaration.getOrCreate).mockResolvedValue({
		declaration: { id: "d1", year: 2026, siren: SIREN, status: "draft" },
	} as never);
	if (profileFails) {
		vi.mocked(api.profile.get).mockRejectedValue(new Error("NOT_FOUND"));
	} else {
		vi.mocked(api.profile.get).mockResolvedValue({ phone } as never);
	}
}

function renderLayout() {
	return WithBannerLayout({ children: "child" as unknown as React.ReactNode });
}

describe("WithBannerLayout", () => {
	beforeEach(() => {
		mockRedirect.mockClear();
		mockAuth.mockReset();
		mockGetEffectiveSiren.mockReset();
		vi.mocked(api.declaration.getOrCreate).mockClear();
	});

	it("redirects unauthenticated users to /login", async () => {
		mockAuth.mockResolvedValue(null);

		await expect(renderLayout()).rejects.toThrow("NEXT_REDIRECT");
		expect(mockRedirect).toHaveBeenCalledWith("/login");
	});

	it("renders the missing-SIRET screen when no company is in scope", async () => {
		mockAuth.mockResolvedValue({ user: { id: "u1" } });
		mockGetEffectiveSiren.mockReturnValue(null);

		await expect(renderLayout()).resolves.toBeDefined();
		expect(mockRedirect).not.toHaveBeenCalled();
	});

	// `false` is a complete CSE answer, not a missing one — truthiness would bounce it.
	it.each([
		true,
		false,
	])("serves the funnel when the phone and the CSE answer are both known (hasCse: %s)", async (hasCse) => {
		mockLayout({ gipWorkforce: COMPANY_SIZE_ANNUAL_MIN, hasCse });

		await expect(renderLayout()).resolves.toBeDefined();
		expect(mockRedirect).not.toHaveBeenCalled();
	});

	// The reported bug: entering the funnel outside Mon espace skipped the prerequisites.
	it.each([
		null,
		"",
	])("sends a user with no phone number back to Mon espace (phone: %s)", async (phone) => {
		mockLayout({ phone });

		await expect(renderLayout()).rejects.toThrow("NEXT_REDIRECT");
		expect(mockRedirect).toHaveBeenCalledWith(MY_SPACE_PATH);
	});

	// `getOrCreate` inserts a draft declaration — bouncing must not leave one behind.
	it("creates no draft declaration when it bounces the visitor", async () => {
		mockLayout({ phone: null });

		await expect(renderLayout()).rejects.toThrow("NEXT_REDIRECT");
		expect(api.declaration.getOrCreate).not.toHaveBeenCalled();
	});

	it("sends a user back to Mon espace when the CSE applies and its answer is missing", async () => {
		mockLayout({ gipWorkforce: COMPANY_SIZE_ANNUAL_MIN, hasCse: null });

		await expect(renderLayout()).rejects.toThrow("NEXT_REDIRECT");
		expect(mockRedirect).toHaveBeenCalledWith(MY_SPACE_PATH);
	});

	// `has_cse` is only collectable above the threshold — requiring it below bounces forever.
	it.each([
		COMPANY_SIZE_ANNUAL_MIN - 1,
		null,
	])("serves the funnel under the CSE threshold with no CSE answer (workforce: %s)", async (gipWorkforce) => {
		mockLayout({ gipWorkforce, hasCse: null });

		await expect(renderLayout()).resolves.toBeDefined();
		expect(mockRedirect).not.toHaveBeenCalled();
	});

	it("sends a user back to Mon espace when the profile row cannot be read", async () => {
		mockLayout({ profileFails: true });

		await expect(renderLayout()).rejects.toThrow("NEXT_REDIRECT");
		expect(mockRedirect).toHaveBeenCalledWith(MY_SPACE_PATH);
	});

	it("lets an admin impersonating a company through despite the missing info", async () => {
		mockLayout({
			hasCse: null,
			phone: null,
			user: {
				...DEFAULT_USER,
				isAdmin: true,
				impersonation: { siren: SIREN },
			},
		});

		await expect(renderLayout()).resolves.toBeDefined();
		expect(mockRedirect).not.toHaveBeenCalled();
	});

	// The exception is scoped to an active impersonation, not to the admin flag.
	it("still guards an admin who is not impersonating", async () => {
		mockLayout({
			phone: null,
			user: { ...DEFAULT_USER, isAdmin: true },
		});

		await expect(renderLayout()).rejects.toThrow("NEXT_REDIRECT");
		expect(mockRedirect).toHaveBeenCalledWith(MY_SPACE_PATH);
	});

	// Mirrors `assertNotImpersonating`: a stray `impersonation` without `isAdmin` unlocks nothing.
	it("still guards a non-admin session carrying a stray impersonation", async () => {
		mockLayout({
			phone: null,
			user: { ...DEFAULT_USER, impersonation: { siren: SIREN } },
		});

		await expect(renderLayout()).rejects.toThrow("NEXT_REDIRECT");
		expect(mockRedirect).toHaveBeenCalledWith(MY_SPACE_PATH);
	});

	// Redirecting inside the guarded route group loops forever — the #4061 regression.
	it("never redirects back into the funnel it guards", async () => {
		mockLayout({ phone: null });

		await expect(renderLayout()).rejects.toThrow("NEXT_REDIRECT");
		for (const [target] of mockRedirect.mock.calls) {
			expect(target).not.toContain("/declaration-remuneration");
		}
	});
});
