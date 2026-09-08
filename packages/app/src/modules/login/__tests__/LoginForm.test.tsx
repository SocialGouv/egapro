import { render, screen } from "@testing-library/react";
import { signIn } from "next-auth/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "../LoginForm";

const mockSignIn = vi.mocked(signIn);

describe("LoginForm", () => {
	beforeEach(() => {
		mockSignIn.mockClear();
	});

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

	it("carries the admin step-up requirement when the destination targets the backoffice", () => {
		render(<LoginForm callbackUrl="/admin/declarations" />);
		screen
			.getByRole("button", { name: /s'identifier avec\s*proconnect/i })
			.click();

		expect(mockSignIn).toHaveBeenCalledWith(
			"proconnect",
			{ callbackUrl: "/admin/declarations" },
			expect.objectContaining({ claims: expect.any(String) }),
		);
	});

	it("leaves the sign-in request unchanged for any other destination", () => {
		render(<LoginForm callbackUrl="/mon-espace/mes-entreprises" />);
		screen
			.getByRole("button", { name: /s'identifier avec\s*proconnect/i })
			.click();

		expect(mockSignIn).toHaveBeenCalledWith("proconnect", {
			callbackUrl: "/mon-espace/mes-entreprises",
		});
	});

	it("leaves the sign-in request unchanged when no destination is given", () => {
		render(<LoginForm />);
		screen
			.getByRole("button", { name: /s'identifier avec\s*proconnect/i })
			.click();

		expect(mockSignIn).toHaveBeenCalledWith("proconnect", {
			callbackUrl: "/mon-espace",
		});
	});

	it("does not mistake /administration for the backoffice", () => {
		render(<LoginForm callbackUrl="/administration/secret" />);
		screen
			.getByRole("button", { name: /s'identifier avec\s*proconnect/i })
			.click();

		expect(mockSignIn).toHaveBeenCalledWith("proconnect", {
			callbackUrl: "/administration/secret",
		});
	});
});
