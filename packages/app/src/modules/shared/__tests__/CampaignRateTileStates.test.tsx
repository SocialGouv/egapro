import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CampaignRateTileLoading } from "../CampaignRateTileStates";

describe("CampaignRateTileLoading", () => {
	it("exposes the loading message as an atomic status", () => {
		render(<CampaignRateTileLoading />);

		const status = screen.getByRole("status");
		expect(status).toHaveAttribute("aria-live", "polite");
		expect(status).toHaveAttribute("aria-atomic", "true");
		expect(status).toHaveTextContent("Chargement du taux de déclaration…");
	});
});
