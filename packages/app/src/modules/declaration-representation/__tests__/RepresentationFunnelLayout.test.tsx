import { render, screen } from "@testing-library/react";
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

vi.mock("~/trpc/server", () => ({ api: { company: { get: vi.fn() } } }));

import RepresentationFunnelLayout from "~/app/declaration-representation/layout";
import { api } from "~/trpc/server";

const SIREN = "123456789";

function renderLayout() {
	return RepresentationFunnelLayout({ children: <p>Contenu de l'étape</p> });
}

beforeEach(() => {
	mockRedirect.mockClear();
	mockAuth.mockReset();
	mockGetEffectiveSiren.mockReset();
	vi.mocked(api.company.get).mockResolvedValue({
		name: "Société Démo",
		siren: SIREN,
		gipWorkforce: 1200,
		hasCse: true,
	} as never);
});

describe("RepresentationFunnelLayout", () => {
	it("redirects unauthenticated users to the login page", async () => {
		mockAuth.mockResolvedValue(null);

		await expect(renderLayout()).rejects.toThrow("NEXT_REDIRECT");
		expect(mockRedirect).toHaveBeenCalledWith("/login");
		expect(api.company.get).not.toHaveBeenCalled();
	});

	it("explains the missing SIRET instead of serving the funnel", async () => {
		mockAuth.mockResolvedValue({ user: { id: "u1" } });
		mockGetEffectiveSiren.mockReturnValue(null);

		render(await renderLayout());

		expect(mockRedirect).not.toHaveBeenCalled();
		expect(
			screen.getByRole("heading", { level: 1, name: "SIRET manquant" }),
		).toBeInTheDocument();
	});

	it("serves the funnel with the company of the session", async () => {
		mockAuth.mockResolvedValue({ user: { id: "u1", siret: `${SIREN}00015` } });
		mockGetEffectiveSiren.mockReturnValue(SIREN);

		render(await renderLayout());

		expect(api.company.get).toHaveBeenCalledWith({ siren: SIREN });
		expect(screen.getByText("123 456 789")).toBeInTheDocument();
		expect(screen.getByText("Contenu de l'étape")).toBeInTheDocument();
	});
});
