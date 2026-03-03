import { render, screen, waitFor, within } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { ContactPage } from "../ContactPage";

const writeText = vi.fn().mockResolvedValue(undefined);

beforeAll(() => {
	Object.defineProperty(Navigator.prototype, "clipboard", {
		value: { writeText },
		configurable: true,
	});
});

afterAll(() => {
	Object.defineProperty(Navigator.prototype, "clipboard", {
		value: undefined,
		configurable: true,
	});
});

describe("ContactPage", () => {
	it("has #content id on main for skip links", () => {
		render(<ContactPage />);
		expect(screen.getByRole("main")).toHaveAttribute("id", "content");
	});

	it("renders the page heading", () => {
		render(<ContactPage />);
		expect(
			screen.getByRole("heading", { level: 1, name: /nous contacter/i }),
		).toBeInTheDocument();
	});

	it("renders the breadcrumb with correct links", () => {
		render(<ContactPage />);
		const breadcrumb = screen.getByRole("navigation", {
			name: /vous êtes ici/i,
		});
		expect(breadcrumb).toBeInTheDocument();

		const accueilLink = within(breadcrumb).getByRole("link", {
			name: /accueil/i,
		});
		expect(accueilLink).toHaveAttribute("href", "/");

		const aideLink = within(breadcrumb).getByRole("link", {
			name: /aide et ressources/i,
		});
		expect(aideLink).toHaveAttribute("href", "/aide");
	});

	it("renders the back link to aide page", () => {
		render(<ContactPage />);
		const backLink = screen.getByRole("link", { name: /retour/i });
		expect(backLink).toHaveAttribute("href", "/aide");
	});

	it("renders the download link for regional referents", () => {
		render(<ContactPage />);
		const downloadLink = screen.getByRole("link", {
			name: /télécharger la liste des référents/i,
		});
		expect(downloadLink).toHaveAttribute(
			"href",
			"/assets/documents/referents-egapro-dreets.xlsx",
		);
	});

	it("displays the contact email address", () => {
		render(<ContactPage />);
		expect(screen.getByText("index@travail.gouv.fr")).toBeInTheDocument();
	});

	it("renders the copy button", () => {
		render(<ContactPage />);
		expect(screen.getByRole("button", { name: /copier/i })).toBeInTheDocument();
	});

	it("copies the email to clipboard on button click", async () => {
		writeText.mockClear();
		render(<ContactPage />);
		screen.getByRole("button", { name: /copier/i }).click();

		await waitFor(() => {
			expect(writeText).toHaveBeenCalledWith("index@travail.gouv.fr");
		});
		expect(screen.getByRole("button", { name: /copiée/i })).toBeInTheDocument();
	});
});
