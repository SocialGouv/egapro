import { render, screen } from "@testing-library/react";
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

import { HeaderQuickAccess } from "../HeaderQuickAccess";

beforeEach(() => {
	mocks.auth.mockResolvedValue(null);
	mocks.profileGet.mockResolvedValue({ phone: null });
});

describe("HeaderQuickAccess", () => {
	it("wraps the quick access links in a 'Accès rapides' navigation landmark (RGAA 9.2)", async () => {
		render(await HeaderQuickAccess());

		const nav = screen.getByRole("navigation", { name: "Accès rapides" });
		expect(nav).toContainElement(screen.getByRole("link", { name: "Aide" }));
		expect(nav).toContainElement(
			screen.getByRole("link", { name: "Se connecter" }),
		);
	});

	it("keeps the DSFR tools-links class on the navigation element (DSFR HeaderLinks hook)", async () => {
		render(await HeaderQuickAccess());

		expect(
			screen.getByRole("navigation", { name: "Accès rapides" }),
		).toHaveClass("fr-header__tools-links");
	});

	it("renders the account menu inside the landmark when signed in", async () => {
		mocks.auth.mockResolvedValue({
			user: {
				email: "jean.dupont@example.fr",
				name: "Jean Dupont",
				phone: null,
			},
		});

		render(await HeaderQuickAccess());

		expect(
			screen.getByRole("navigation", { name: "Accès rapides" }),
		).toContainElement(screen.getByRole("button", { name: "Mon espace" }));
	});
});
