import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PrefillSource } from "../PrefillSource";

describe("PrefillSource", () => {
	it("renders DSN source text", () => {
		render(<PrefillSource periodEnd={null} />);

		expect(screen.getByText(/DSN/)).toBeInTheDocument();
		expect(
			screen.getByText(/Déclarations Sociales Nominatives/),
		).toBeInTheDocument();
	});

	it("formats the date correctly (ISO to French format)", () => {
		render(<PrefillSource periodEnd="2026-12-31" />);

		expect(screen.getByText(/31\/12\/2026/)).toBeInTheDocument();
	});

	it("renders without period end date", () => {
		render(<PrefillSource periodEnd={null} />);

		expect(screen.getByText(/Source/)).toBeInTheDocument();
		expect(screen.queryByText(/mise à jour le/)).not.toBeInTheDocument();
	});

	it("shows update date text when periodEnd is provided", () => {
		render(<PrefillSource periodEnd="2025-03-15" />);

		expect(screen.getByText(/mise à jour le 15\/03\/2025/)).toBeInTheDocument();
	});

	it("renders the tooltip button", () => {
		render(<PrefillSource periodEnd={null} />);

		expect(
			screen.getByLabelText("Information sur la source des données"),
		).toBeInTheDocument();
	});
});
