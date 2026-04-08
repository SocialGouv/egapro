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

import AdminPage from "~/app/admin/page";

describe("AdminPage", () => {
	beforeEach(() => {
		mockRedirect.mockClear();
		mockAuth.mockReset();
	});

	it("redirects to /login when there is no session", async () => {
		mockAuth.mockResolvedValue(null);
		await expect(AdminPage()).rejects.toThrow("NEXT_REDIRECT");
		expect(mockRedirect).toHaveBeenCalledWith("/login");
	});

	it("redirects to /mon-espace for non-admin users", async () => {
		mockAuth.mockResolvedValue({
			user: { id: "u1", isAdmin: false, name: "Bob", email: "bob@example.com" },
		});
		await expect(AdminPage()).rejects.toThrow("NEXT_REDIRECT");
		expect(mockRedirect).toHaveBeenCalledWith("/mon-espace");
	});

	it("renders the admin home page for admin users", async () => {
		mockAuth.mockResolvedValue({
			user: {
				id: "u1",
				isAdmin: true,
				name: "Alice",
				email: "alice@example.com",
			},
		});
		const result = await AdminPage();
		expect(mockRedirect).not.toHaveBeenCalled();
		expect(result).toBeDefined();
	});

	it("falls back to email when name is missing", async () => {
		mockAuth.mockResolvedValue({
			user: {
				id: "u1",
				isAdmin: true,
				name: null,
				email: "alice@example.com",
			},
		});
		const result = await AdminPage();
		expect(result).toBeDefined();
	});
});
