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

	it("has a visible border", () => {
		const { container } = render(<HomePlaceholder />);
		const wrapper = container.firstElementChild as HTMLElement;
		expect(wrapper.style.border).toBe("1px solid var(--border-default-grey)");
	});
});
