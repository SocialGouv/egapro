import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DraftLoadingState } from "../DraftLoadingState";

describe("DraftLoadingState", () => {
	it("renders an accessible loading status with French label", () => {
		render(<DraftLoadingState />);
		const status = screen.getByRole("status");
		expect(status).toHaveAttribute("aria-live", "polite");
		expect(status).toHaveAttribute("aria-busy", "true");
		expect(status).toHaveTextContent(/Chargement du brouillon/i);
	});
});
