import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { signInMock } = vi.hoisted(() => ({ signInMock: vi.fn() }));

vi.mock("next-auth/react", () => ({
	signIn: signInMock,
	useSession: () => ({ data: null, status: "unauthenticated" }),
}));

import { LoginPage } from "../LoginPage";

beforeEach(() => {
	signInMock.mockReset();
});

describe("LoginPage", () => {
	it("renders the main landmark with id content", () => {
		render(<LoginPage />);
		expect(screen.getByRole("main")).toHaveAttribute("id", "content");
	});

	it("displays the login heading", () => {
		render(<LoginPage />);
		expect(
			screen.getByRole("heading", {
				level: 1,
				name: /connectez-vous avec proconnect/i,
			}),
		).toBeInTheDocument();
	});

	it("renders the decorative illustration", () => {
		render(<LoginPage />);
		const illustration = screen.getByTestId("next-image");
		expect(illustration).toHaveAttribute(
			"data-src",
			"/assets/images/login-illustration.svg",
		);
	});

	it("contains the ProConnect authentication button", () => {
		render(<LoginPage />);
		expect(
			screen.getByRole("button", {
				name: /s'identifier avec\s*proconnect/i,
			}),
		).toBeInTheDocument();
	});

	it("forwards callbackUrl through to ProConnect signIn", () => {
		// Observable behavior of the prop drill LoginPage → LoginForm →
		// ProConnectButton: the deepest call receives the propagated URL.
		render(<LoginPage callbackUrl="/admin/users" />);
		screen
			.getByRole("button", { name: /s'identifier avec\s*proconnect/i })
			.click();
		expect(signInMock).toHaveBeenCalledWith("proconnect", {
			callbackUrl: "/admin/users",
		});
	});

	it("falls back to /mon-espace when no callbackUrl is provided", () => {
		render(<LoginPage />);
		screen
			.getByRole("button", { name: /s'identifier avec\s*proconnect/i })
			.click();
		expect(signInMock).toHaveBeenCalledWith("proconnect", {
			callbackUrl: "/mon-espace",
		});
	});
});
