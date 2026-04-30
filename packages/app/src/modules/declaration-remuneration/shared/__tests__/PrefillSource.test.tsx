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

	it("renders without period end date", () => {
		render(<PrefillSource periodEnd={null} />);

		expect(screen.getByText(/Source/)).toBeInTheDocument();
		expect(screen.queryByText(/mise à jour le/)).not.toBeInTheDocument();
		expect(screen.queryByText(/Période de référence/)).not.toBeInTheDocument();
	});

	it("shows update date when only periodEnd is provided", () => {
		render(<PrefillSource periodEnd="2025-03-15" />);

		expect(screen.getByText(/mise à jour le 15\/03\/2025/)).toBeInTheDocument();
		expect(screen.queryByText(/Période de référence/)).not.toBeInTheDocument();
	});

	it("renders the reference period range when both periodStart and periodEnd are provided", () => {
		render(<PrefillSource periodEnd="2026-12-31" periodStart="2026-01-01" />);

		expect(screen.getByText(/Période de référence/)).toBeInTheDocument();
		expect(screen.getByText(/01\/01\/2026/)).toBeInTheDocument();
		expect(screen.getByText(/31\/12\/2026/)).toBeInTheDocument();
		expect(screen.queryByText(/mise à jour le/)).not.toBeInTheDocument();
	});

	it("does not render a tooltip button", () => {
		render(<PrefillSource periodEnd={null} />);

		expect(
			screen.queryByLabelText("Information sur la source des données"),
		).not.toBeInTheDocument();
	});
});
