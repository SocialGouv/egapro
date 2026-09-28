import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { signInMock, assignMock } = vi.hoisted(() => ({
	signInMock: vi.fn(),
	assignMock: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
	signIn: signInMock,
	useSession: () => ({ data: null, status: "unauthenticated" }),
}));

import { DevLoginForm } from "../DevLoginForm";

Object.defineProperty(window, "location", {
	configurable: true,
	value: { assign: assignMock },
});

function fillAndSubmit(email: string, siret: string) {
	fireEvent.change(screen.getByLabelText(/adresse e-mail/i), {
		target: { value: email },
	});
	fireEvent.change(screen.getByLabelText(/SIRET/), {
		target: { value: siret },
	});
	fireEvent.click(screen.getByRole("button", { name: /se connecter/i }));
}

beforeEach(() => {
	signInMock.mockReset();
	assignMock.mockReset();
});

describe("DevLoginForm", () => {
	it("renders the email and SIRET fields with a submit button", () => {
		render(<DevLoginForm />);
		expect(screen.getByLabelText(/adresse e-mail/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/SIRET/)).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /se connecter/i })).toBeEnabled();
	});

	it("signs in through the dev-auth provider then navigates to the callback", async () => {
		signInMock.mockResolvedValue({ error: null });
		render(<DevLoginForm callbackUrl="/declaration-remuneration" />);

		fillAndSubmit("dev@example.fr", "12345678901234");

		await waitFor(() => {
			expect(signInMock).toHaveBeenCalledWith("dev-auth", {
				callbackUrl: "/declaration-remuneration",
				email: "dev@example.fr",
				redirect: false,
				siret: "12345678901234",
			});
		});
		await waitFor(() => {
			expect(assignMock).toHaveBeenCalledWith("/declaration-remuneration");
		});
	});

	it("falls back to /mon-espace when the callbackUrl is not a same-site path", async () => {
		signInMock.mockResolvedValue({ error: null });
		render(<DevLoginForm callbackUrl="https://evil.example/phish" />);

		fillAndSubmit("dev@example.fr", "12345678901234");

		await waitFor(() => {
			expect(assignMock).toHaveBeenCalledWith("/mon-espace");
		});
	});

	it("shows a server error and stays put when sign-in is refused", async () => {
		signInMock.mockResolvedValue({ error: "CredentialsSignin" });
		render(<DevLoginForm />);

		fillAndSubmit("dev@example.fr", "12345678901234");

		await waitFor(() => {
			expect(screen.getByText(/connexion refusée/i)).toBeInTheDocument();
		});
		expect(assignMock).not.toHaveBeenCalled();
	});

	it("rejects an invalid SIRET without calling signIn", async () => {
		render(<DevLoginForm />);

		fillAndSubmit("dev@example.fr", "123");

		await waitFor(() => {
			expect(
				screen.getByText(/le SIRET doit contenir exactement 14 chiffres/i),
			).toBeInTheDocument();
		});
		expect(signInMock).not.toHaveBeenCalled();
	});
});
