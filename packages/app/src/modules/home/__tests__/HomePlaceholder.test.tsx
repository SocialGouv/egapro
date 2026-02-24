import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomePlaceholder } from "../HomePlaceholder";

describe("HomePlaceholder", () => {
	it("displays the placeholder title", () => {
		render(<HomePlaceholder />);
		expect(screen.getByText("Section not finalized")).toBeInTheDocument();
	});

	it("displays the placeholder description", () => {
		render(<HomePlaceholder />);
		expect(
			screen.getByText(
				"This section is still under design and not ready for development.",
			),
		).toBeInTheDocument();
	});

	it("has a visible border", () => {
		const { container } = render(<HomePlaceholder />);
		const wrapper = container.firstElementChild as HTMLElement;
		expect(wrapper.style.border).toBe("1px solid var(--border-default-grey)");
	});
});
