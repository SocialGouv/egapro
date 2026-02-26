import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
		...props
	}: {
		href: string;
		children: React.ReactNode;
		[key: string]: unknown;
	}) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));

import { UserAccountMenu } from "../UserAccountMenu";

const defaultProps = {
	userName: "Jean Dupont",
	userEmail: "jean.dupont@example.fr",
};

describe("UserAccountMenu", () => {
	it("renders the toggle button with 'Mon espace' label", () => {
		render(<UserAccountMenu {...defaultProps} />);
		expect(
			screen.getByRole("button", { name: "Mon espace" }),
		).toBeInTheDocument();
	});

	it("has aria-expanded=false by default", () => {
		render(<UserAccountMenu {...defaultProps} />);
		expect(screen.getByRole("button", { name: "Mon espace" })).toHaveAttribute(
			"aria-expanded",
			"false",
		);
	});

	it("does not display the dropdown menu by default", () => {
		render(<UserAccountMenu {...defaultProps} />);
		expect(screen.queryByRole("menu")).not.toBeInTheDocument();
	});

	describe("when opened", () => {
		it("displays the dropdown menu on button click", () => {
			render(<UserAccountMenu {...defaultProps} />);
			fireEvent.click(screen.getByRole("button", { name: "Mon espace" }));
			expect(screen.getByRole("menu")).toBeInTheDocument();
		});

		it("sets aria-expanded=true when open", () => {
			render(<UserAccountMenu {...defaultProps} />);
			fireEvent.click(screen.getByRole("button", { name: "Mon espace" }));
			expect(
				screen.getByRole("button", { name: "Mon espace" }),
			).toHaveAttribute("aria-expanded", "true");
		});

		it("displays the user name", () => {
			render(<UserAccountMenu {...defaultProps} />);
			fireEvent.click(screen.getByRole("button", { name: "Mon espace" }));
			expect(screen.getByText("Jean Dupont")).toBeInTheDocument();
		});

		it("displays the user email", () => {
			render(<UserAccountMenu {...defaultProps} />);
			fireEvent.click(screen.getByRole("button", { name: "Mon espace" }));
			expect(screen.getByText("jean.dupont@example.fr")).toBeInTheDocument();
		});

		it("displays 'Mes entreprises' menu item", () => {
			render(<UserAccountMenu {...defaultProps} />);
			fireEvent.click(screen.getByRole("button", { name: "Mon espace" }));
			expect(
				screen.getByRole("menuitem", { name: "Mes entreprises" }),
			).toBeInTheDocument();
		});

		it("displays 'Voir mon profil' menu item", () => {
			render(<UserAccountMenu {...defaultProps} />);
			fireEvent.click(screen.getByRole("button", { name: "Mon espace" }));
			expect(
				screen.getByRole("menuitem", { name: "Voir mon profil" }),
			).toBeInTheDocument();
		});

		it("displays 'Se déconnecter' menu item linking to signout", () => {
			render(<UserAccountMenu {...defaultProps} />);
			fireEvent.click(screen.getByRole("button", { name: "Mon espace" }));
			const logoutLink = screen.getByRole("menuitem", {
				name: "Se déconnecter",
			});
			expect(logoutLink).toBeInTheDocument();
			expect(logoutLink).toHaveAttribute("href", "/api/auth/signout");
		});
	});

	describe("closing behavior", () => {
		it("closes the menu when clicking the toggle button again", () => {
			render(<UserAccountMenu {...defaultProps} />);
			const button = screen.getByRole("button", { name: "Mon espace" });
			fireEvent.click(button);
			expect(screen.getByRole("menu")).toBeInTheDocument();
			fireEvent.click(button);
			expect(screen.queryByRole("menu")).not.toBeInTheDocument();
		});

		it("closes the menu on Escape key", () => {
			render(<UserAccountMenu {...defaultProps} />);
			fireEvent.click(screen.getByRole("button", { name: "Mon espace" }));
			expect(screen.getByRole("menu")).toBeInTheDocument();
			fireEvent.keyDown(document, { key: "Escape" });
			expect(screen.queryByRole("menu")).not.toBeInTheDocument();
		});

		it("closes the menu when clicking outside", () => {
			render(
				<div>
					<span data-testid="outside">Outside</span>
					<UserAccountMenu {...defaultProps} />
				</div>,
			);
			fireEvent.click(screen.getByRole("button", { name: "Mon espace" }));
			expect(screen.getByRole("menu")).toBeInTheDocument();
			fireEvent.mouseDown(screen.getByTestId("outside"));
			expect(screen.queryByRole("menu")).not.toBeInTheDocument();
		});

		it("closes the menu when clicking a menu item link", () => {
			render(<UserAccountMenu {...defaultProps} />);
			fireEvent.click(screen.getByRole("button", { name: "Mon espace" }));
			fireEvent.click(
				screen.getByRole("menuitem", { name: "Mes entreprises" }),
			);
			expect(screen.queryByRole("menu")).not.toBeInTheDocument();
		});
	});
});
