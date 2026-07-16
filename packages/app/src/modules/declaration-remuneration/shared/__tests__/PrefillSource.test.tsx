import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PrefillSource } from "../PrefillSource";

describe("PrefillSource", () => {
	it("renders the DSN source text", () => {
		render(<PrefillSource periodEnd={null} periodStart={null} year={2026} />);

		expect(screen.getByText(/DSN/)).toBeInTheDocument();
		expect(
			screen.getByText(/Déclarations Sociales Nominatives/),
		).toBeInTheDocument();
	});

	it("shows the GIP collection window as the reference period", () => {
		render(
			<PrefillSource
				periodEnd="2026-12-31"
				periodStart="2026-01-01"
				year={2026}
			/>,
		);

		expect(screen.getByText(/période de référence/)).toBeInTheDocument();
		expect(screen.getByText(/01\/01\/2026 - 31\/12\/2026/)).toBeInTheDocument();
	});

	it("falls back to the civil year when a period bound is missing", () => {
		render(<PrefillSource periodEnd={null} periodStart={null} year={2026} />);

		expect(screen.getByText(/01\/01\/2026 - 31\/12\/2026/)).toBeInTheDocument();
	});

	it("renders the tooltip button", () => {
		render(<PrefillSource periodEnd={null} periodStart={null} year={2026} />);

		expect(
			screen.getByRole("button", {
				name: "Information sur la source des données",
			}),
		).toBeInTheDocument();
	});
});
