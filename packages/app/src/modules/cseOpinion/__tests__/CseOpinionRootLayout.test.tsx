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

vi.mock("~/server/auth/companyAccess", () => ({
	getEffectiveSiren: mockGetEffectiveSiren,
}));

vi.mock("~/server/db", () => ({ db: {} }));

vi.mock("~/server/services/declarationLockService", () => ({
	getLockReadState: vi
		.fn()
		.mockResolvedValue({ isReadOnly: false, lockHolder: null }),
}));

vi.mock("~/trpc/server", () => ({
	api: {
		company: { get: vi.fn() },
		declaration: { getOrCreate: vi.fn() },
	},
}));

// The funnel chrome is irrelevant here and pulls the module's client components
// through the barrel; this suite only judges the layout's redirect decision.
vi.mock("~/modules/cseOpinion", () => ({
	CseOpinionLayout: ({ children }: { children: React.ReactNode }) => children,
}));

import CseOpinionRootLayout from "~/app/avis-cse/layout";
import { COMPANY_SIZE_ANNUAL_MIN } from "~/modules/domain";
import { api } from "~/trpc/server";

const SIREN = "123456789";
const CSE_OPINION_PATH = "/avis-cse";
const CONFIRMATION_PATH =
	"/declaration-remuneration/parcours-conformite/confirmation";

function mockCompany(gipWorkforce: number | null, hasCse: boolean | null) {
	mockAuth.mockResolvedValue({ user: { id: "u1", siret: `${SIREN}00015` } });
	mockGetEffectiveSiren.mockReturnValue(SIREN);
	vi.mocked(api.company.get).mockResolvedValue({
		name: "Société Démo",
		siren: SIREN,
		gipWorkforce,
		hasCse,
	} as never);
	vi.mocked(api.declaration.getOrCreate).mockResolvedValue({
		declaration: { id: "d1", year: 2026, siren: SIREN },
	} as never);
}

function renderLayout() {
	return CseOpinionRootLayout({
		children: "child" as unknown as React.ReactNode,
	});
}

describe("CseOpinionRootLayout", () => {
	beforeEach(() => {
		mockRedirect.mockClear();
		mockAuth.mockReset();
		mockGetEffectiveSiren.mockReset();
	});

	it("redirects unauthenticated users to /login", async () => {
		mockAuth.mockResolvedValue(null);

		await expect(renderLayout()).rejects.toThrow("NEXT_REDIRECT");
		expect(mockRedirect).toHaveBeenCalledWith("/login");
	});

	it("redirects to the home page when no company is in scope", async () => {
		mockAuth.mockResolvedValue({ user: { id: "u1" } });
		mockGetEffectiveSiren.mockReturnValue(null);

		await expect(renderLayout()).rejects.toThrow("NEXT_REDIRECT");
		expect(mockRedirect).toHaveBeenCalledWith("/");
	});

	it("serves the funnel to a company that owes an opinion", async () => {
		mockCompany(COMPANY_SIZE_ANNUAL_MIN, true);

		await expect(renderLayout()).resolves.toBeDefined();
		expect(mockRedirect).not.toHaveBeenCalled();
	});

	// `has_cse` persists across years while the workforce is re-read from the
	// current GIP row, so a company that shrinks under the threshold keeps
	// hasCse=true. Deciding on hasCse alone sent it back to /avis-cse — this very
	// layout — and the redirect looped until the browser gave up.
	it("does not bounce a company with a CSE back into the funnel once it falls under the threshold", async () => {
		mockCompany(COMPANY_SIZE_ANNUAL_MIN - 25, true);

		await expect(renderLayout()).rejects.toThrow("NEXT_REDIRECT");
		expect(mockRedirect).toHaveBeenCalledWith(CONFIRMATION_PATH);
		expect(mockRedirect).not.toHaveBeenCalledWith(CSE_OPINION_PATH);
	});

	it("sends a company just under the threshold to the confirmation page", async () => {
		mockCompany(COMPANY_SIZE_ANNUAL_MIN - 1, true);

		await expect(renderLayout()).rejects.toThrow("NEXT_REDIRECT");
		expect(mockRedirect).toHaveBeenCalledWith(CONFIRMATION_PATH);
	});

	it("sends a company absent from the GIP file to the confirmation page", async () => {
		mockCompany(null, true);

		await expect(renderLayout()).rejects.toThrow("NEXT_REDIRECT");
		expect(mockRedirect).toHaveBeenCalledWith(CONFIRMATION_PATH);
	});

	it.each([
		false,
		null,
	])("sends a large company owing no opinion to the confirmation page (hasCse: %s)", async (hasCse) => {
		mockCompany(COMPANY_SIZE_ANNUAL_MIN + 150, hasCse);

		await expect(renderLayout()).rejects.toThrow("NEXT_REDIRECT");
		expect(mockRedirect).toHaveBeenCalledWith(CONFIRMATION_PATH);
	});
});
