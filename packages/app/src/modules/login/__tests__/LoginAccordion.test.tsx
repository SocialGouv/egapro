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
});
