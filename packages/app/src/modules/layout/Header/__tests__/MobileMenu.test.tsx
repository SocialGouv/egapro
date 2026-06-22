import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	auth: vi.fn(),
	profileGet: vi.fn(),
}));

vi.mock("~/server/auth", () => ({
	auth: mocks.auth,
}));

vi.mock("~/trpc/server", () => ({
	api: { profile: { get: mocks.profileGet } },
}));

import { MobileMenu } from "../MobileMenu";

beforeEach(() => {
	vi.mocked(usePathname).mockReturnValue("/");
	mocks.profileGet.mockResolvedValue({ phone: null });
});

describe("MobileMenu", () => {
	it("renders the main navigation when no user is signed in", async () => {
		mocks.auth.mockResolvedValue(null);

		render(await MobileMenu());

		expect(
			screen.getByRole("navigation", { name: "Menu principal" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: "Se connecter" }),
		).toBeInTheDocument();
	});

	it("hides the main navigation and renders the inline user block when signed in", async () => {
		mocks.auth.mockResolvedValue({
			user: {
				email: "jean.dupont@example.fr",
				name: "Jean Dupont",
				phone: null,
			},
		});

		render(await MobileMenu());

		expect(
			screen.queryByRole("navigation", { name: "Menu principal" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("link", { name: "Se connecter" }),
		).not.toBeInTheDocument();

		// User info and actions are rendered inline.
		expect(screen.getByText("Jean Dupont")).toBeInTheDocument();
		expect(screen.getByText("jean.dupont@example.fr")).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: "Mes entreprises" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Voir mon profil" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: "Se déconnecter" }),
		).toBeInTheDocument();
	});

	it("renders the fresh phone from the profile table, ignoring the stale JWT", async () => {
		mocks.auth.mockResolvedValue({
			user: {
				email: "jean.dupont@example.fr",
				name: "Jean Dupont",
				phone: null,
			},
		});
		mocks.profileGet.mockResolvedValue({ phone: "06 12 34 56 78" });

		render(await MobileMenu());

		expect(screen.getByText("06 12 34 56 78")).toBeInTheDocument();
	});
});
