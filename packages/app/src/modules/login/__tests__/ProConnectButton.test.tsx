import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { signInMock, trackEventMock } = vi.hoisted(() => ({
	signInMock: vi.fn(),
	trackEventMock: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
	signIn: signInMock,
	useSession: () => ({ data: null, status: "unauthenticated" }),
}));

vi.mock("~/modules/analytics", async (importOriginal) => {
	const actual = await importOriginal<typeof import("~/modules/analytics")>();
	return { ...actual, trackEvent: trackEventMock };
});

import { MATOMO_ACTION, MATOMO_EVENT_CATEGORY } from "~/modules/analytics";
import { ProConnectButton } from "../ProConnectButton";

beforeEach(() => {
	signInMock.mockReset();
	trackEventMock.mockReset();
});

describe("ProConnectButton", () => {
	it("renders a button to trigger ProConnect sign-in", () => {
		render(<ProConnectButton />);
		const button = screen.getByRole("button", {
			name: /s'identifier avec\s*proconnect/i,
		});
		expect(button).toHaveAttribute("type", "button");
	});

	it("displays the login and brand text", () => {
		render(<ProConnectButton />);
		expect(screen.getByText("S'identifier avec")).toBeInTheDocument();
		expect(screen.getByText("ProConnect")).toBeInTheDocument();
	});

	it("renders the info link about ProConnect", () => {
		render(<ProConnectButton />);
		const infoLink = screen.getByRole("link", {
			name: /qu'est-ce que proconnect/i,
		});
		expect(infoLink).toHaveAttribute("href", "https://www.proconnect.gouv.fr/");
		expect(infoLink).toHaveAttribute("target", "_blank");
		expect(infoLink).toHaveAttribute("rel", "noopener");
	});

	it("uses the fr-connect-group container", () => {
		const { container } = render(<ProConnectButton />);
		expect(container.querySelector(".fr-connect-group")).toBeInTheDocument();
	});

	it("calls signIn with the provided callbackUrl on click", () => {
		render(<ProConnectButton callbackUrl="/admin/users" />);
		screen
			.getByRole("button", { name: /s'identifier avec\s*proconnect/i })
			.click();
		expect(signInMock).toHaveBeenCalledWith(
			"proconnect",
			{ callbackUrl: "/admin/users" },
			expect.objectContaining({ claims: expect.any(String) }),
		);
	});

	it("falls back to /mon-espace when no callbackUrl is provided", () => {
		render(<ProConnectButton />);
		screen
			.getByRole("button", { name: /s'identifier avec\s*proconnect/i })
			.click();
		expect(signInMock).toHaveBeenCalledWith(
			"proconnect",
			{ callbackUrl: "/mon-espace" },
			expect.objectContaining({ claims: expect.any(String) }),
		);
	});

	it("emits a LOGIN_START analytics event on click", () => {
		render(<ProConnectButton callbackUrl="/admin/users" />);
		screen
			.getByRole("button", { name: /s'identifier avec\s*proconnect/i })
			.click();
		expect(trackEventMock).toHaveBeenCalledWith({
			category: MATOMO_EVENT_CATEGORY.AUTH,
			action: MATOMO_ACTION.LOGIN_START,
		});
	});

	describe("when requiresAdminStepUp is set", () => {
		it("attaches the admin step-up authorization params to the sign-in request", () => {
			render(<ProConnectButton callbackUrl="/admin" requiresAdminStepUp />);
			screen
				.getByRole("button", { name: /s'identifier avec\s*proconnect/i })
				.click();
			expect(signInMock).toHaveBeenCalledWith(
				"proconnect",
				{ callbackUrl: "/admin" },
				expect.objectContaining({ claims: expect.any(String) }),
			);
		});

		it("falls back to /mon-espace even when requiresAdminStepUp is set", () => {
			// ProConnectButton's own `callbackUrl ?? "/mon-espace"` default is
			// independent of `requiresAdminStepUp` — it does not fall back to the
			// backoffice home just because a step-up was requested.
			render(<ProConnectButton requiresAdminStepUp />);
			screen
				.getByRole("button", { name: /s'identifier avec\s*proconnect/i })
				.click();
			expect(signInMock).toHaveBeenCalledWith(
				"proconnect",
				{ callbackUrl: "/mon-espace" },
				expect.objectContaining({ claims: expect.any(String) }),
			);
		});

		it("still emits the LOGIN_START analytics event", () => {
			render(<ProConnectButton callbackUrl="/admin" requiresAdminStepUp />);
			screen
				.getByRole("button", { name: /s'identifier avec\s*proconnect/i })
				.click();
			expect(trackEventMock).toHaveBeenCalledWith({
				category: MATOMO_EVENT_CATEGORY.AUTH,
				action: MATOMO_ACTION.LOGIN_START,
			});
		});
	});

	describe("when requiresAdminStepUp is not set", () => {
		it("uses the declarant MFA claim even on an admin-shaped callbackUrl", () => {
			// Regression guard for the rule the epic does not negotiate: only an
			// explicit `requiresAdminStepUp` may add the step-up params — the
			// button never infers it from the shape of the URL on its own. The
			// declarant floor is still requested, so this is not a bare sign-in.
			render(<ProConnectButton callbackUrl="/admin" />);
			screen
				.getByRole("button", { name: /s'identifier avec\s*proconnect/i })
				.click();
			expect(signInMock).toHaveBeenCalledWith(
				"proconnect",
				{ callbackUrl: "/admin" },
				expect.objectContaining({ claims: expect.any(String) }),
			);
			const params = signInMock.mock.calls[0]?.[2] as {
				claims: string;
			};
			const claims = JSON.parse(params.claims) as {
				id_token: { acr: { values: string[] } };
			};
			expect(claims.id_token.acr.values).toEqual([
				"eidas0-mfa",
				"eidas1-mfa",
				"eidas2",
				"eidas3",
			]);
		});
	});
});
