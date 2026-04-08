import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MobileUserBlock } from "../MobileUserBlock";

const defaultProps = {
	userName: "Jean Dupont",
	userEmail: "jean.dupont@example.fr",
};

describe("MobileUserBlock", () => {
	it("displays the user name and email inline", () => {
		render(<MobileUserBlock {...defaultProps} />);
		expect(screen.getByText("Jean Dupont")).toBeInTheDocument();
		expect(screen.getByText("jean.dupont@example.fr")).toBeInTheDocument();
	});

	it("does not display a phone number when userPhone is not provided", () => {
		render(<MobileUserBlock {...defaultProps} />);
		expect(screen.queryByText(/\+?\d{2}/)).not.toBeInTheDocument();
	});

	it("displays the phone number when userPhone is provided", () => {
		render(<MobileUserBlock {...defaultProps} userPhone="01 23 45 67 89" />);
		expect(screen.getByText("01 23 45 67 89")).toBeInTheDocument();
	});

	it("renders the 'Mes entreprises' link", () => {
		render(<MobileUserBlock {...defaultProps} />);
		const link = screen.getByRole("link", { name: "Mes entreprises" });
		expect(link).toHaveAttribute("href", "/mon-espace/mes-entreprises");
	});

	it("renders the 'Voir mon profil' button", () => {
		render(<MobileUserBlock {...defaultProps} />);
		expect(
			screen.getByRole("button", { name: "Voir mon profil" }),
		).toBeInTheDocument();
	});

	it("renders the 'Se déconnecter' link pointing to the signout endpoint", () => {
		render(<MobileUserBlock {...defaultProps} />);
		const link = screen.getByRole("link", { name: "Se déconnecter" });
		expect(link).toHaveAttribute("href", "/api/auth/logout");
	});

	it("opens the profile modal when 'Voir mon profil' is clicked", () => {
		const disclose = vi.fn();
		Object.defineProperty(window, "dsfr", {
			value: () => ({ modal: { disclose } }),
			writable: true,
			configurable: true,
		});

		const profileModal = document.createElement("dialog");
		profileModal.id = "profile-modal";
		document.body.appendChild(profileModal);

		render(<MobileUserBlock {...defaultProps} />);
		fireEvent.click(screen.getByRole("button", { name: "Voir mon profil" }));

		expect(disclose).toHaveBeenCalled();

		document.body.removeChild(profileModal);
	});
});
