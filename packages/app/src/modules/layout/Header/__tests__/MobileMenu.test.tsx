import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	auth: vi.fn(),
}));

vi.mock("~/server/auth", () => ({
	auth: mocks.auth,
}));

import { MobileMenu } from "../MobileMenu";

beforeEach(() => {
	vi.mocked(usePathname).mockReturnValue("/");
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

	it("hides the main navigation when a user is signed in", async () => {
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
			screen.getByRole("button", { name: "Mon espace" }),
		).toBeInTheDocument();
	});
});
