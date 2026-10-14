import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GapBadge } from "../../../shared/GapValueBadge";

describe("GapBadge", () => {
	it("shows the placeholder for a null gap", () => {
		render(<GapBadge gap={null} />);
		expect(screen.getByText("-")).toBeInTheDocument();
		expect(screen.queryByText(/en faveur/)).not.toBeInTheDocument();
	});

	it("shows the absolute value and the men mention for a low gap favoring men", () => {
		render(<GapBadge gap={3} />);

		expect(screen.getByText("3,00 %")).toBeInTheDocument();
		expect(screen.queryByText("élevé")).not.toBeInTheDocument();
		expect(screen.getByText("en faveur des hommes")).toBeInTheDocument();
	});

	it("shows the absolute value, the high badge and the women mention for a high gap favoring women", () => {
		render(<GapBadge gap={-6} />);

		expect(screen.getByText("6,00 %")).toBeInTheDocument();
		expect(screen.queryByText("-6,00 %")).not.toBeInTheDocument();
		expect(screen.getByText("élevé")).toBeInTheDocument();
		expect(screen.getByText("en faveur des femmes")).toBeInTheDocument();
	});

	it("shows no mention once the gap truncates to zero", () => {
		render(<GapBadge gap={0.004} />);

		expect(screen.getByText("0,00 %")).toBeInTheDocument();
		expect(screen.queryByText(/en faveur/)).not.toBeInTheDocument();
	});
});
