import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StepIndicator } from "../StepIndicator";

describe("StepIndicator", () => {
	it("renders current step title", () => {
		render(<StepIndicator currentStep={2} />);

		expect(screen.getByText("Écart de rémunération")).toBeInTheDocument();
	});

	it("renders 'Étape X sur 6' text", () => {
		render(<StepIndicator currentStep={3} />);

		expect(screen.getByText("Étape 3 sur 6")).toBeInTheDocument();
	});

	it("renders next step title when not on last step", () => {
		render(<StepIndicator currentStep={2} />);

		expect(
			screen.getByText("Écart de rémunération variable ou complémentaire"),
		).toBeInTheDocument();
	});

	it("does not render next step on last step", () => {
		render(<StepIndicator currentStep={6} />);

		expect(screen.queryByText(/Étape suivante/)).not.toBeInTheDocument();
	});
});
