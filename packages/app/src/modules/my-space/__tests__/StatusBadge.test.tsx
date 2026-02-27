import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatusBadge } from "../StatusBadge";

describe("StatusBadge", () => {
	it("renders a warning badge for to_complete status", () => {
		render(<StatusBadge status="to_complete" />);
		const badge = screen.getByText("À compléter");
		expect(badge).toBeInTheDocument();
		expect(badge).toHaveClass("fr-badge--warning");
		expect(badge).toHaveClass("fr-badge--no-icon");
		expect(badge).toHaveClass("fr-badge--sm");
	});

	it("renders an info badge for in_progress status", () => {
		render(<StatusBadge status="in_progress" />);
		const badge = screen.getByText("En cours");
		expect(badge).toBeInTheDocument();
		expect(badge).toHaveClass("fr-badge--info");
		expect(badge).toHaveClass("fr-badge--no-icon");
		expect(badge).toHaveClass("fr-badge--sm");
	});

	it("renders a success badge with icon for done status", () => {
		render(<StatusBadge status="done" />);
		const badge = screen.getByText("Effectué");
		expect(badge).toBeInTheDocument();
		expect(badge).toHaveClass("fr-badge--success");
		expect(badge).toHaveClass("fr-badge--sm");
		expect(badge).not.toHaveClass("fr-badge--no-icon");
	});
});
