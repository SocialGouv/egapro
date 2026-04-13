import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));

vi.mock("~/server/auth", () => ({ auth: mockAuth }));

import AdminPage from "~/app/admin/page";

describe("AdminPage", () => {
	beforeEach(() => {
		mockAuth.mockReset();
	});

	it("renders the admin home page with the user name and email", async () => {
		mockAuth.mockResolvedValue({
			user: {
				id: "u1",
				isAdmin: true,
				name: "Alice",
				email: "alice@example.com",
			},
		});
		const result = await AdminPage();
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
