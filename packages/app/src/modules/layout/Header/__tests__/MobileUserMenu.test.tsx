import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MobileUserMenu } from "../MobileUserMenu";

const defaultProps = {
	userName: "Jean Dupont",
	userEmail: "jean.dupont@example.fr",
};

describe("MobileUserMenu", () => {
	it("displays the user name and email inline", () => {
		render(<MobileUserMenu {...defaultProps} />);
		expect(screen.getByText("Jean Dupont")).toBeInTheDocument();
		expect(screen.getByText("jean.dupont@example.fr")).toBeInTheDocument();
	});

	it("does not display a phone number when userPhone is not provided", () => {
		render(<MobileUserMenu {...defaultProps} />);
		expect(screen.queryByText(/\+?\d{2}/)).not.toBeInTheDocument();
	});

	it("displays the phone number when userPhone is provided", () => {
		render(<MobileUserMenu {...defaultProps} userPhone="01 23 45 67 89" />);
		expect(screen.getByText("01 23 45 67 89")).toBeInTheDocument();
	});

	it("renders the 'Mes entreprises' link", () => {
		render(<MobileUserMenu {...defaultProps} />);
		const link = screen.getByRole("link", { name: "Mes entreprises" });
		expect(link).toHaveAttribute("href", "/mon-espace/mes-entreprises");
	});

	it("renders the 'Voir mon profil' button", () => {
		render(<MobileUserMenu {...defaultProps} />);
		expect(
			screen.getByRole("button", { name: "Voir mon profil" }),
		).toBeInTheDocument();
	});

	it("renders the 'Se déconnecter' link pointing to the signout endpoint", () => {
		render(<MobileUserMenu {...defaultProps} />);
		const link = screen.getByRole("link", { name: "Se déconnecter" });
		expect(link).toHaveAttribute("href", "/api/auth/logout");
	});

	it("closes the mobile menu and opens the profile modal on 'Voir mon profil' click", () => {
		const conceal = vi.fn();
		const disclose = vi.fn();
		Object.defineProperty(window, "dsfr", {
			value: (el: HTMLElement) => ({
				modal: el.id === "modal-menu" ? { conceal } : { disclose },
			}),
			writable: true,
			configurable: true,
		});

		const menuModal = document.createElement("div");
		menuModal.id = "modal-menu";
		document.body.appendChild(menuModal);
		const profileModal = document.createElement("dialog");
		profileModal.id = "profile-modal";
		document.body.appendChild(profileModal);

		render(<MobileUserMenu {...defaultProps} />);
		fireEvent.click(screen.getByRole("button", { name: "Voir mon profil" }));

		expect(conceal).toHaveBeenCalled();
		expect(disclose).toHaveBeenCalled();

		document.body.removeChild(menuModal);
		document.body.removeChild(profileModal);
	});
});
