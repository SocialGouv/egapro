import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomePlaceholder } from "../HomePlaceholder";

describe("HomePlaceholder", () => {
	it("displays the placeholder title", () => {
		render(<HomePlaceholder />);
		expect(screen.getByText("Section non finalisée")).toBeInTheDocument();
	});

	it("displays the placeholder description", () => {
		render(<HomePlaceholder />);
		expect(
			screen.getByText(/cette section est encore en cours de conception/i),
		).toBeInTheDocument();
	});

	it("applies the placeholder style class", () => {
		const { container } = render(<HomePlaceholder />);
		const wrapper = container.firstElementChild as HTMLElement;
		expect(wrapper.className).toMatch(/placeholder/);
	});
});
