import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FaqPage } from "../FaqPage";
import { FAQ_SECTIONS } from "../faqData";

describe("FaqPage", () => {
	it("has #content id on main for skip links", () => {
		render(<FaqPage />);
		expect(screen.getByRole("main")).toHaveAttribute("id", "content");
	});

	it("renders the page heading", () => {
		render(<FaqPage />);
		expect(
			screen.getByRole("heading", {
				level: 1,
				name: /questions fréquentes/i,
			}),
		).toBeInTheDocument();
	});

	it("renders the subtitle", () => {
		render(<FaqPage />);
		expect(
			screen.getByText(/indicateurs sur l'égalité professionnelle/i),
		).toBeInTheDocument();
	});

	it("renders the breadcrumb navigation", () => {
		render(<FaqPage />);
		expect(
			screen.getByRole("navigation", { name: /vous êtes ici/i }),
		).toBeInTheDocument();
		expect(screen.getByRole("link", { name: /accueil/i })).toHaveAttribute(
			"href",
			"/",
		);
	});

	it("renders the back link pointing to home", () => {
		render(<FaqPage />);
		const backLinks = screen.getAllByRole("link", { name: /retour/i });
		expect(backLinks.length).toBeGreaterThanOrEqual(1);
		expect(backLinks[0]).toHaveAttribute("href", "/");
	});

	it("renders the sommaire navigation with all sections", () => {
		render(<FaqPage />);
		const sommaire = screen.getByRole("navigation", {
			name: /sommaire/i,
		});
		expect(sommaire).toBeInTheDocument();

		for (const section of FAQ_SECTIONS) {
			const link = within(sommaire).getByRole("link", {
				name: section.title,
			});
			expect(link).toHaveAttribute("href", `#${section.id}`);
		}
	});

	it("renders all section headings (h2)", () => {
		render(<FaqPage />);
		for (const section of FAQ_SECTIONS) {
			expect(
				screen.getByRole("heading", { level: 2, name: section.title }),
			).toBeInTheDocument();
		}
	});

	it("renders accordion buttons for FAQ items", () => {
		render(<FaqPage />);
		const firstItem = FAQ_SECTIONS[0]?.subsections[0]?.items[0];
		if (firstItem) {
			const button = screen.getByRole("button", {
				name: firstItem.question,
			});
			expect(button).toHaveAttribute("aria-expanded", "false");
		}
	});

	it("renders the decorative illustration as aria-hidden", () => {
		render(<FaqPage />);
		const wrapper = screen
			.getByRole("main")
			.querySelector("[aria-hidden='true']");
		const img = wrapper?.querySelector("img");
		expect(wrapper).toHaveAttribute("aria-hidden", "true");
		expect(img).toHaveAttribute("alt", "");
	});
});
