import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SitemapPage } from "../SitemapPage";

function sectionLinks(heading: string): HTMLElement[] {
	const list = screen.getByRole("heading", {
		level: 2,
		name: heading,
	}).nextElementSibling;
	if (!(list instanceof HTMLElement))
		throw new Error(`No list after ${heading}`);
	return within(list).getAllByRole("link");
}

describe("SitemapPage", () => {
	it("gives access to the declarant space among the main pages", () => {
		render(<SitemapPage />);

		const mySpace = sectionLinks("Pages principales").find(
			(link) => link.textContent === "Mon espace",
		);
		expect(mySpace).toHaveAttribute("href", "/mon-espace");
	});

	it("keeps the public sign-in entry next to it", () => {
		render(<SitemapPage />);

		const labels = sectionLinks("Pages principales").map(
			(link) => link.textContent,
		);
		expect(labels).toEqual(expect.arrayContaining(["Mon espace", "Connexion"]));
		expect(labels.indexOf("Connexion")).toBe(labels.indexOf("Mon espace") + 1);
	});

	it("intitules the privacy policy link in the legal pages section", () => {
		render(<SitemapPage />);

		const privacyPolicy = sectionLinks("Pages légales").find(
			(link) => link.textContent === "Politique de confidentialité",
		);
		expect(privacyPolicy).toHaveAttribute("href", "/donnees-personnelles");
	});

	it("lists each page once across both sections", () => {
		render(<SitemapPage />);

		const hrefs = [
			...sectionLinks("Pages principales"),
			...sectionLinks("Pages légales"),
		].map((link) => link.getAttribute("href"));
		expect(new Set(hrefs).size).toBe(hrefs.length);
		expect(screen.getAllByRole("link", { name: "Mon espace" })).toHaveLength(1);
	});
});
