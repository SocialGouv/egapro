import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { signIn } from "next-auth/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminAccessPage } from "../AdminAccessPage";

const mockSignIn = vi.mocked(signIn);

describe("AdminAccessPage", () => {
	beforeEach(() => {
		mockSignIn.mockClear();
	});

	it("renders the main landmark with the skip-link target", () => {
		render(<AdminAccessPage reason="expired" returnPath="/admin" />);

		const main = screen.getByRole("main");
		expect(main).toHaveAttribute("id", "content");
		expect(main).toHaveAttribute("tabIndex", "-1");
	});

	it("announces an expiry when the authentication is out of the window", () => {
		render(<AdminAccessPage reason="expired" returnPath="/admin" />);

		expect(
			screen.getByRole("heading", {
				level: 1,
				name: "Votre accès au backoffice a expiré",
			}),
		).toBeInTheDocument();
		expect(screen.getByText(/arrivée à échéance/)).toBeInTheDocument();
	});

	it("announces a failed authentication when the session carries no date", () => {
		render(<AdminAccessPage reason="missing" returnPath="/admin" />);

		expect(
			screen.getByRole("heading", {
				level: 1,
				name: "La double authentification n'a pas abouti",
			}),
		).toBeInTheDocument();
		expect(screen.getByText(/Votre session n'en porte pas/)).toBeInTheDocument();
	});

	it("keeps Mon espace reachable while the backoffice is refused", () => {
		render(<AdminAccessPage reason="expired" returnPath="/admin" />);

		expect(
			screen.getByRole("link", { name: "Retourner à Mon espace" }),
		).toHaveAttribute("href", "/mon-espace");
	});

	it("does not start the second factor on its own", () => {
		// The passage through ProConnect is triggered by a click, never by the
		// screen itself: an automatic redirect could bounce the agent between
		// Egapro and the issuer.
		render(<AdminAccessPage reason="expired" returnPath="/admin" />);

		expect(mockSignIn).not.toHaveBeenCalled();
	});

	it("aims the resume action at the requested deep link", async () => {
		render(
			<AdminAccessPage reason="missing" returnPath="/admin/declarations/abc" />,
		);

		await userEvent.click(
			screen.getByRole("button", { name: "Refaire la double authentification" }),
		);

		expect(mockSignIn).toHaveBeenCalledWith("proconnect", {
			callbackUrl: "/admin/declarations/abc",
		});
	});
});
