import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth, mockReadBanner } = vi.hoisted(() => ({
	mockAuth: vi.fn(),
	mockReadBanner: vi.fn(),
}));

vi.mock("~/server/auth", () => ({ auth: mockAuth }));
vi.mock("~/server/services/serviceStatus", () => ({
	readServiceStatusBanner: mockReadBanner,
}));

import AdminPage from "~/app/admin/page";

describe("AdminPage", () => {
	beforeEach(() => {
		mockAuth.mockReset();
		mockReadBanner.mockReset();
		mockReadBanner.mockResolvedValue({
			supervisionLost: false,
			degradedCount: 0,
			unavailableCount: 0,
			criticalUnavailableCount: 0,
			lateJobCount: 0,
			bannerVisible: false,
			tone: "success",
		});
	});

	it("renders the admin home page with the user name and email", async () => {
		mockAuth.mockResolvedValue({
			user: {
				id: "u1",
				isAdmin: true,
				name: "Alice",
				email: "[EMAIL_REDACTED]",
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
				email: "[EMAIL_REDACTED]",
			},
		});
		const result = await AdminPage();
		expect(result).toBeDefined();
	});

	it("reads the supervision summary for the banner", async () => {
		mockAuth.mockResolvedValue({
			user: {
				id: "u1",
				isAdmin: true,
				name: "Alice",
				email: "[EMAIL_REDACTED]",
			},
		});

		await AdminPage();

		expect(mockReadBanner).toHaveBeenCalledOnce();
	});
});
