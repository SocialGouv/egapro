import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PrefillSource } from "../PrefillSource";

describe("PrefillSource", () => {
	it("renders the DSN source text", () => {
		render(<PrefillSource year={2026} />);

		expect(screen.getByText(/DSN/)).toBeInTheDocument();
		expect(
			screen.getByText(/Déclarations Sociales Nominatives/),
		).toBeInTheDocument();
	});

	it("shows the preceding civil year (N-1) as the reference period", () => {
		render(<PrefillSource year={2026} />);

		expect(screen.getByText(/période de référence/)).toBeInTheDocument();
		expect(screen.getByText(/01\/01\/2025 - 31\/12\/2025/)).toBeInTheDocument();
	});

	it("derives the reference period from the campaign year", () => {
		render(<PrefillSource year={2025} />);

		expect(screen.getByText(/01\/01\/2024 - 31\/12\/2024/)).toBeInTheDocument();
	});

	it("renders the tooltip button", () => {
		render(<PrefillSource year={2026} />);

		expect(
			screen.getByRole("button", {
				name: "Information sur la source des données",
			}),
		).toBeInTheDocument();
	});
});
