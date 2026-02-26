import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LoginForm } from "../LoginForm";

vi.mock("next-auth/react", () => ({
	signIn: vi.fn(),
}));

vi.mock("~/modules/layout", () => ({
	NewTabNotice: () => (
		<span className="fr-sr-only"> (ouvre une nouvelle fenêtre)</span>
	),
}));

describe("LoginForm", () => {
	it("displays the login heading", () => {
		render(<LoginForm />);
		expect(
			screen.getByRole("heading", {
				level: 1,
				name: /connectez-vous avec proconnect/i,
			}),
		).toBeInTheDocument();
	});

	it("displays the description text", () => {
		render(<LoginForm />);
		expect(
			screen.getByText(/espace de déclaration egapro/i),
		).toBeInTheDocument();
	});

	it("contains the ProConnect button", () => {
		render(<LoginForm />);
		expect(
			screen.getByRole("button", {
				name: /s'identifier avec\s*proconnect/i,
			}),
		).toBeInTheDocument();
	});

	it("contains the no-account accordion", () => {
		render(<LoginForm />);
		expect(
			screen.getByRole("button", {
				name: /vous n'avez pas de compte/i,
			}),
		).toBeInTheDocument();
	});
});
