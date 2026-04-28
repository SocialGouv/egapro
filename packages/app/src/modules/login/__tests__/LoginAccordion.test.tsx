import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoginAccordion } from "../LoginAccordion";

describe("LoginAccordion", () => {
	it("renders the accordion button with the correct text", () => {
		render(<LoginAccordion />);
		expect(
			screen.getByRole("button", {
				name: /vous n'avez pas de compte/i,
			}),
		).toBeInTheDocument();
	});

	it("has aria-expanded set to false by default", () => {
		render(<LoginAccordion />);
		const button = screen.getByRole("button", {
			name: /vous n'avez pas de compte/i,
		});
		expect(button).toHaveAttribute("aria-expanded", "false");
	});

	it("links the button to the collapse content via aria-controls", () => {
		render(<LoginAccordion />);
		const button = screen.getByRole("button", {
			name: /vous n'avez pas de compte/i,
		});
		const controlsId = button.getAttribute("aria-controls") ?? "";
		expect(controlsId).toBeTruthy();
		expect(document.getElementById(controlsId)).toBeInTheDocument();
	});

	it("has the correct DSFR accordion structure", () => {
		const { container } = render(<LoginAccordion />);
		expect(container.querySelector(".fr-accordion")).toBeInTheDocument();
		expect(container.querySelector(".fr-accordion__title")).toBeInTheDocument();
		expect(container.querySelector(".fr-collapse")).toBeInTheDocument();
	});

	it("lists the six account creation steps in order, ending with the success step", () => {
		const { container } = render(<LoginAccordion />);
		const items = container.querySelectorAll("ol > li");
		expect(items).toHaveLength(6);
		expect(items[0]?.textContent).toMatch(
			/cliquez d'abord sur le bouton.*s'identifier avec proconnect/i,
		);
		expect(items[3]?.textContent).toMatch(
			/entrez le siret du siège social de votre entreprise/i,
		);
		expect(items[5]?.textContent).toMatch(/votre compte est créé/i);
	});

	it("emphasizes the ProConnect button label in the first step", () => {
		const { container } = render(<LoginAccordion />);
		const firstItem = container.querySelector("ol > li:first-child");
		expect(firstItem?.querySelector("strong")?.textContent).toBe(
			'"S\'identifier avec ProConnect"',
		);
	});
});
