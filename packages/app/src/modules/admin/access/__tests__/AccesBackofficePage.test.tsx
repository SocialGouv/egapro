import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRedirect, mockAuth } = vi.hoisted(() => ({
	mockRedirect: vi.fn<(url: string) => never>().mockImplementation(() => {
		throw new Error("NEXT_REDIRECT");
	}),
	mockAuth: vi.fn(),
}));

vi.mock("next/navigation", async (importOriginal) => ({
	...(await importOriginal<Record<string, unknown>>()),
	redirect: mockRedirect,
}));

vi.mock("~/server/auth", () => ({ auth: mockAuth }));

import Page from "~/app/acces-backoffice/page";
import { ADMIN_MFA_WINDOW_SECONDS } from "~/modules/domain";

function nowSeconds(): number {
	return Math.floor(Date.now() / 1000);
}

function renderPage(retour?: string) {
	return Page({ searchParams: Promise.resolve({ retour }) });
}

describe("acces-backoffice page", () => {
	beforeEach(() => {
		mockRedirect.mockClear();
		mockAuth.mockReset();
	});

	it("sends a visitor without a session to the sign-in page, deep link kept", async () => {
		mockAuth.mockResolvedValue(null);

		await expect(renderPage("/admin/declarations")).rejects.toThrow(
			"NEXT_REDIRECT",
		);
		expect(mockRedirect).toHaveBeenCalledWith(
			"/login?callbackUrl=%2Fadmin%2Fdeclarations",
		);
	});

	it("turns a user without the admin grant away towards Mon espace", async () => {
		// The screen refuses exactly what the guard refuses: an exception here
		// would make it the admission the guard declines to make.
		mockAuth.mockResolvedValue({ user: { id: "u1", isAdmin: false } });

		await expect(renderPage("/admin")).rejects.toThrow("NEXT_REDIRECT");
		expect(mockRedirect).toHaveBeenCalledWith("/mon-espace");
	});

	it("sends an agent already authenticated inside the window straight in", async () => {
		mockAuth.mockResolvedValue({
			user: { id: "u1", isAdmin: true, adminMfaAt: nowSeconds() },
		});

		await expect(renderPage("/admin/declarations")).rejects.toThrow(
			"NEXT_REDIRECT",
		);
		expect(mockRedirect).toHaveBeenCalledWith("/admin/declarations");
	});

	it("announces an expiry from the session, not from the URL", async () => {
		mockAuth.mockResolvedValue({
			user: {
				id: "u1",
				isAdmin: true,
				adminMfaAt: nowSeconds() - ADMIN_MFA_WINDOW_SECONDS - 1,
			},
		});

		render(await renderPage("/admin"));

		expect(mockRedirect).not.toHaveBeenCalled();
		expect(
			screen.getByRole("heading", {
				level: 1,
				name: "Votre accès au backoffice a expiré",
			}),
		).toBeInTheDocument();
	});

	it("announces a failed authentication when the session carries no date", async () => {
		mockAuth.mockResolvedValue({ user: { id: "u1", isAdmin: true } });

		render(await renderPage("/admin"));

		expect(
			screen.getByRole("heading", {
				level: 1,
				name: "La double authentification n'a pas abouti",
			}),
		).toBeInTheDocument();
	});

	it("ignores a return path pointing outside the backoffice", async () => {
		// `retour` is attacker-controlled: the screen must never become a
		// redirector towards an arbitrary destination.
		mockAuth.mockResolvedValue({
			user: { id: "u1", isAdmin: true, adminMfaAt: nowSeconds() },
		});

		await expect(renderPage("https://evil.example")).rejects.toThrow(
			"NEXT_REDIRECT",
		);
		expect(mockRedirect).toHaveBeenCalledWith("/admin");
	});
});
