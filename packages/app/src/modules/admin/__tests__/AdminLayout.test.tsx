import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRedirect, mockAuth } = vi.hoisted(() => ({
	mockRedirect: vi.fn<(url: string) => never>().mockImplementation(() => {
		throw new Error("NEXT_REDIRECT");
	}),
	mockAuth: vi.fn(),
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
vi.mock("~/modules/domain", async (importOriginal) => {
	const actual = await importOriginal<typeof import("~/modules/domain")>();
	return {
		...actual,
		resolveAdminAccess: vi.fn(actual.resolveAdminAccess),
	};
});

import AdminLayout from "~/app/admin/layout";
import { ADMIN_MFA_WINDOW_SECONDS, resolveAdminAccess } from "~/modules/domain";

function nowSeconds(): number {
	return Math.floor(Date.now() / 1000);
}

describe("AdminLayout", () => {
	beforeEach(() => {
		mockRedirect.mockClear();
		mockAuth.mockReset();
	});

	it("redirects unauthenticated users to /login", async () => {
		mockAuth.mockResolvedValue(null);
		await expect(
			AdminLayout({ children: "child" as unknown as React.ReactNode }),
		).rejects.toThrow("NEXT_REDIRECT");
		expect(mockRedirect).toHaveBeenCalledWith("/login");
	});

	it("redirects non-admin users to /mon-espace", async () => {
		mockAuth.mockResolvedValue({ user: { id: "u1", isAdmin: false } });
		await expect(
			AdminLayout({ children: "child" as unknown as React.ReactNode }),
		).rejects.toThrow("NEXT_REDIRECT");
		expect(mockRedirect).toHaveBeenCalledWith("/mon-espace");
	});

	it("sends an admin whose two-factor authentication is missing to the resume screen", async () => {
		mockAuth.mockResolvedValue({ user: { id: "u1", isAdmin: true } });
		await expect(
			AdminLayout({ children: "child" as unknown as React.ReactNode }),
		).rejects.toThrow("NEXT_REDIRECT");
		expect(mockRedirect).toHaveBeenCalledWith("/acces-backoffice");
	});

	it("sends an admin whose two-factor authentication expired to the resume screen", async () => {
		mockAuth.mockResolvedValue({
			user: {
				id: "u1",
				isAdmin: true,
				adminMfaAt: nowSeconds() - ADMIN_MFA_WINDOW_SECONDS - 1,
			},
		});
		await expect(
			AdminLayout({ children: "child" as unknown as React.ReactNode }),
		).rejects.toThrow("NEXT_REDIRECT");
		expect(mockRedirect).toHaveBeenCalledWith("/acces-backoffice");
	});

	it("renders children for an admin authenticated inside the window", async () => {
		mockAuth.mockResolvedValue({
			user: { id: "u1", isAdmin: true, adminMfaAt: nowSeconds() },
		});
		const result = await AdminLayout({
			children: "admin-child" as unknown as React.ReactNode,
		});
		expect(mockRedirect).not.toHaveBeenCalled();
		expect(result).toBeDefined();
	});

	it("fails closed to /login on a decision the switch does not recognize", async () => {
		mockAuth.mockResolvedValue({
			user: { id: "u1", isAdmin: true, adminMfaAt: nowSeconds() },
		});
		vi.mocked(resolveAdminAccess).mockReturnValueOnce({
			type: "unknown",
		} as unknown as ReturnType<typeof resolveAdminAccess>);
		await expect(
			AdminLayout({ children: "child" as unknown as React.ReactNode }),
		).rejects.toThrow("NEXT_REDIRECT");
		expect(mockRedirect).toHaveBeenCalledWith("/login");
	});
});
