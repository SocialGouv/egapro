import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { mockRedirect } = vi.hoisted(() => ({
	mockRedirect: vi.fn<(url: string) => never>().mockImplementation(() => {
		throw new Error("NEXT_REDIRECT");
	}),
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

vi.mock("~/trpc/react", () => ({
	api: {
		company: {
			updateHasCse: {
				useMutation: vi.fn().mockReturnValue({
					mutate: vi.fn(),
					isPending: false,
				}),
			},
		},
		profile: {
			updatePhone: {
				useMutation: vi.fn().mockReturnValue({
					mutate: vi.fn(),
					isPending: false,
				}),
			},
		},
	},
}));

vi.mock("~/trpc/server", () => ({
	api: {
		company: {
			getWithDeclarations: vi.fn().mockResolvedValue({
				company: {
					siren: "123456789",
					name: "Test Company",
					address: "1 rue de Test",
					nafCode: "6201Z",
					workforce: 150,
					hasCse: true,
				},
				declarations: [
					{
						type: "remuneration",
						siren: "123456789",
						year: 2026,
						status: "to_complete",
						currentStep: 1,
						updatedAt: null,
					},
				],
			}),
			getSanctionStatus: vi
				.fn()
				.mockResolvedValue({ hasSanction: false, validityDate: null }),
		},
	},
	HydrateClient: ({ children }: { children: React.ReactNode }) => (
		<>{children}</>
	),
}));

import { MonEspacePage } from "../MonEspacePage";

describe("MonEspacePage", () => {
	it("redirects to mes-entreprises when siret is null", async () => {
		await expect(
			MonEspacePage({ siret: null, userPhone: null }),
		).rejects.toThrow("NEXT_REDIRECT");
		expect(mockRedirect).toHaveBeenCalledWith("/mon-espace/mes-entreprises");
	});

	it("redirects to mes-entreprises when siret is too short", async () => {
		await expect(
			MonEspacePage({ siret: "1234", userPhone: null }),
		).rejects.toThrow("NEXT_REDIRECT");
		expect(mockRedirect).toHaveBeenCalledWith("/mon-espace/mes-entreprises");
	});

	it("renders company declarations for valid siret", async () => {
		const page = await MonEspacePage({
			siret: "12345678901234",
			userPhone: "0612345678",
		});
		render(page);
		expect(screen.getByRole("main")).toHaveAttribute("id", "content");
		expect(
			screen.getByRole("heading", { level: 2, name: "Test Company" }),
		).toBeInTheDocument();
	});

	it("passes userPhone to CompanyDeclarationsPage", async () => {
		const page = await MonEspacePage({
			siret: "12345678901234",
			userPhone: null,
		});
		render(page);
		expect(screen.getByRole("main")).toHaveAttribute("id", "content");
	});
});
