import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NewTabNotice } from "../NewTabNotice";

describe("NewTabNotice", () => {
	it("renders announcement text for screen readers", () => {
		render(<NewTabNotice />);
		expect(screen.getByText(/ouvre une nouvelle fenêtre/i)).toBeInTheDocument();
	});

	it("is visually hidden via fr-sr-only class", () => {
		render(<NewTabNotice />);
		expect(screen.getByText(/ouvre une nouvelle fenêtre/i)).toHaveClass(
			"fr-sr-only",
		);
	});
});
