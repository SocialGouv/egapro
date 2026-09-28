import { fireEvent, render, screen } from "@testing-library/react";
import type { Session } from "next-auth";
import { signIn } from "next-auth/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HeaderQuickAccessLinks } from "../HeaderQuickAccessLinks";

const mockSignIn = vi.mocked(signIn);

const buildSession = (overrides: Partial<Session["user"]> = {}): Session => ({
	expires: "2099-01-01T00:00:00.000Z",
	user: {
		email: "jean.dupont@example.fr",
		name: "Jean Dupont",
		phone: null,
		...overrides,
	} as Session["user"],
});

describe("HeaderQuickAccessLinks", () => {
	beforeEach(() => {
		mockSignIn.mockClear();
	});

	it("renders the help link and login button when no session", () => {
		render(<HeaderQuickAccessLinks session={null} />);

		expect(screen.getByRole("link", { name: "Aide" })).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: "Se connecter" }),
		).toBeInTheDocument();
	});

	it("renders the user account menu when a session exists", () => {
		render(<HeaderQuickAccessLinks session={buildSession()} />);

		expect(screen.getByRole("link", { name: "Aide" })).toBeInTheDocument();
		expect(
			screen.queryByRole("link", { name: "Se connecter" }),
		).not.toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Mon espace" }),
		).toBeInTheDocument();
	});

	it("carries the session's admin MFA freshness through to the menu's Administration entry", () => {
		render(
			<HeaderQuickAccessLinks
				session={buildSession({ isAdmin: true, adminMfaAt: null })}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Mon espace" }));
		fireEvent.click(screen.getByRole("menuitem", { name: "Administration" }));

		// No date at all in the session is exactly the "missing" case the menu
		// must catch before it lets the click reach `/admin`.
		expect(mockSignIn).toHaveBeenCalledWith(
			"proconnect",
			{ callbackUrl: "/admin" },
			expect.anything(),
		);
	});
});
