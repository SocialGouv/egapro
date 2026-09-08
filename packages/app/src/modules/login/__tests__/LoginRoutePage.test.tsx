import { render, screen } from "@testing-library/react";
import { signIn } from "next-auth/react";
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

import Page from "~/app/login/page";
import { ADMIN_MFA_WINDOW_SECONDS } from "~/modules/domain";

function nowSeconds(): number {
	return Math.floor(Date.now() / 1000);
}

function renderPage(searchParams: { callbackUrl?: string; error?: string }) {
	return Page({ searchParams: Promise.resolve(searchParams) });
}

const mockSignIn = vi.mocked(signIn);

describe("login page — interrupted step-up (S10)", () => {
	beforeEach(() => {
		mockRedirect.mockClear();
		mockAuth.mockReset();
		mockSignIn.mockClear();
	});

	it("shows the login form to a visitor without a session, error param or not", async () => {
		mockAuth.mockResolvedValue(null);

		render(await renderPage({ error: "OAuthCallback" }));

		expect(mockRedirect).not.toHaveBeenCalled();
		expect(
			screen.getByRole("heading", {
				level: 1,
				name: /connectez-vous avec proconnect/i,
			}),
		).toBeInTheDocument();
	});

	it("redirects a signed-in agent without an error param, as before", async () => {
		mockAuth.mockResolvedValue({
			user: { id: "u1", isAdmin: false },
		});

		await expect(renderPage({ callbackUrl: "/mon-espace" })).rejects.toThrow(
			"NEXT_REDIRECT",
		);
		expect(mockRedirect).toHaveBeenCalledWith("/mon-espace");
	});

	it("falls back to /mon-espace for a signed-in agent with no callbackUrl at all", async () => {
		mockAuth.mockResolvedValue({
			user: { id: "u1", isAdmin: false },
		});

		await expect(renderPage({})).rejects.toThrow("NEXT_REDIRECT");
		expect(mockRedirect).toHaveBeenCalledWith("/mon-espace");
	});

	it("explains the failed step-up to an agent still signed in, admin MFA missing", async () => {
		mockAuth.mockResolvedValue({
			user: { id: "u1", isAdmin: true },
		});

		render(await renderPage({ error: "OAuthCallback" }));

		expect(mockRedirect).not.toHaveBeenCalled();
		expect(
			screen.getByRole("heading", {
				level: 1,
				name: "La double authentification n'a pas abouti",
			}),
		).toBeInTheDocument();
	});

	it("explains an expired step-up the same way", async () => {
		mockAuth.mockResolvedValue({
			user: {
				id: "u1",
				isAdmin: true,
				adminMfaAt: nowSeconds() - ADMIN_MFA_WINDOW_SECONDS - 1,
			},
		});

		render(await renderPage({ error: "OAuthCallback" }));

		expect(mockRedirect).not.toHaveBeenCalled();
		expect(
			screen.getByRole("heading", {
				level: 1,
				name: "Votre accès au backoffice a expiré",
			}),
		).toBeInTheDocument();
	});

	it("keeps the declarant session usable: it is never closed nor degraded by the resume screen", async () => {
		mockAuth.mockResolvedValue({
			user: { id: "u1", isAdmin: true },
		});

		render(await renderPage({ error: "OAuthCallback" }));

		expect(
			screen.getByRole("link", { name: "Retourner à Mon espace" }),
		).toHaveAttribute("href", "/mon-espace");
	});

	it("does not show the resume screen when the admin MFA is already fresh — nothing left to resume", async () => {
		mockAuth.mockResolvedValue({
			user: { id: "u1", isAdmin: true, adminMfaAt: nowSeconds() },
		});

		await expect(
			renderPage({ callbackUrl: "/admin", error: "OAuthCallback" }),
		).rejects.toThrow("NEXT_REDIRECT");
		expect(mockRedirect).toHaveBeenCalledWith("/admin");
	});

	it("does not show the resume screen to a non-admin agent, error param or not", async () => {
		mockAuth.mockResolvedValue({
			user: { id: "u1", isAdmin: false },
		});

		await expect(
			renderPage({ callbackUrl: "/mon-espace", error: "OAuthCallback" }),
		).rejects.toThrow("NEXT_REDIRECT");
		expect(mockRedirect).toHaveBeenCalledWith("/mon-espace");
	});

	it("confines the resume screen's return path to the backoffice", async () => {
		// `callbackUrl` is attacker-controlled: the screen it falls through to
		// must never become a redirector towards an arbitrary destination.
		mockAuth.mockResolvedValue({
			user: { id: "u1", isAdmin: true },
		});

		render(
			await renderPage({
				callbackUrl: "/mon-espace/mes-entreprises",
				error: "OAuthCallback",
			}),
		);
		screen
			.getByRole("button", { name: "Refaire la double authentification" })
			.click();

		expect(mockSignIn).toHaveBeenCalledWith(
			"proconnect",
			{ callbackUrl: "/admin" },
			expect.anything(),
		);
	});
});
