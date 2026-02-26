import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProConnectButton } from "../ProConnectButton";

vi.mock("next-auth/react", () => ({
	signIn: vi.fn(),
}));

vi.mock("~/modules/layout", () => ({
	NewTabNotice: () => (
		<span className="fr-sr-only"> (ouvre une nouvelle fenêtre)</span>
	),
}));

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
});
