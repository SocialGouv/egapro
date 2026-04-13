import { render, screen } from "@testing-library/react";
import type { Session } from "next-auth";
import { describe, expect, it } from "vitest";

import { HeaderQuickAccessLinks } from "../HeaderQuickAccessLinks";

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
});
