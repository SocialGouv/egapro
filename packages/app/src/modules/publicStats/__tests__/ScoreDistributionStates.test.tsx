import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
	ScoreDistributionLoading,
	ScoreDistributionTileError,
} from "../ScoreDistributionStates";

describe("ScoreDistributionLoading", () => {
	it("renders a polite live region with a loading message", () => {
		render(<ScoreDistributionLoading />);
		const message = screen.getByText(/chargement de la distribution/i);
		expect(message).toHaveAttribute("aria-live", "polite");
	});
});

describe("ScoreDistributionTileError", () => {
	it("renders a DSFR error alert with role=alert", () => {
		const { container } = render(<ScoreDistributionTileError />);
		expect(
			screen.getByText(/erreur est survenue lors du chargement/i),
		).toBeInTheDocument();
		const alert = container.querySelector(".fr-alert");
		expect(alert).toHaveClass("fr-alert--error");
		expect(alert).toHaveAttribute("role", "alert");
	});
});
