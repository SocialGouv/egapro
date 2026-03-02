import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LoginPage } from "../LoginPage";

vi.mock("~/modules/layout", () => ({
	NewTabNotice: () => (
		<span className="fr-sr-only"> (ouvre une nouvelle fenêtre)</span>
	),
}));

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
});
