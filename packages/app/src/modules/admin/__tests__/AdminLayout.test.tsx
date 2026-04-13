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

import AdminLayout from "~/app/admin/layout";

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

	it("renders children for an admin user", async () => {
		mockAuth.mockResolvedValue({ user: { id: "u1", isAdmin: true } });
		const result = await AdminLayout({
			children: "admin-child" as unknown as React.ReactNode,
		});
		expect(mockRedirect).not.toHaveBeenCalled();
		expect(result).toBeDefined();
	});
});
