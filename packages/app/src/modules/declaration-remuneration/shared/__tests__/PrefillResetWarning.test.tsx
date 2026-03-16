import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PrefillResetWarning } from "../PrefillResetWarning";

describe("PrefillResetWarning", () => {
	it("renders the warning alert", () => {
		render(<PrefillResetWarning />);
		expect(
			screen.getByText(/toute modification de l'effectif/),
		).toBeInTheDocument();
	});

	it("mentions the consequence of modifying data", () => {
		render(<PrefillResetWarning />);
		expect(
			screen.getByText(/devront alors être ressaisis manuellement/),
		).toBeInTheDocument();
	});

	it("has the warning alert class", () => {
		const { container } = render(<PrefillResetWarning />);
		const alert = container.querySelector(".fr-alert--warning");
		expect(alert).toBeInTheDocument();
	});
});
