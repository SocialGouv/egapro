import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StepIndicator } from "../StepIndicator";

describe("StepIndicator", () => {
	it("renders current step title", () => {
		render(<StepIndicator currentStep={2} indicatorGRequired />);

		expect(screen.getByText("Écart de rémunération")).toBeInTheDocument();
	});

	it("renders 'Étape X sur 6' text", () => {
		render(<StepIndicator currentStep={3} indicatorGRequired />);

		expect(screen.getByText("Étape 3 sur 6")).toBeInTheDocument();
	});

	it("renders next step title when not on last step", () => {
		render(<StepIndicator currentStep={2} indicatorGRequired />);

		expect(
			screen.getByText("Écart de rémunération variable ou complémentaire"),
		).toBeInTheDocument();
	});

	it("does not render next step on last step", () => {
		render(<StepIndicator currentStep={6} indicatorGRequired />);

		expect(screen.queryByText(/Étape suivante/)).not.toBeInTheDocument();
	});

	it("shows 'Étape 4 sur 6' and announces step 5 as next when indicatorGRequired is true", () => {
		const { container } = render(
			<StepIndicator currentStep={4} indicatorGRequired />,
		);

		expect(screen.getByText("Étape 4 sur 6")).toBeInTheDocument();
		expect(
			screen.getByText("Écart de rémunération par catégories de salariés"),
		).toBeInTheDocument();
		const steps = container.querySelector(".fr-stepper__steps");
		expect(steps).toHaveAttribute("data-fr-current-step", "4");
		expect(steps).toHaveAttribute("data-fr-steps", "6");
	});

	it("shows 'Étape 4 sur 5' and skips to step 6 as next when indicatorGRequired is false", () => {
		const { container } = render(
			<StepIndicator currentStep={4} indicatorGRequired={false} />,
		);

		expect(screen.getByText("Étape 4 sur 5")).toBeInTheDocument();
		expect(
			screen.getByText("Récapitulatif de votre déclaration"),
		).toBeInTheDocument();
		expect(
			screen.queryByText("Écart de rémunération par catégories de salariés"),
		).not.toBeInTheDocument();
		const steps = container.querySelector(".fr-stepper__steps");
		expect(steps).toHaveAttribute("data-fr-current-step", "4");
		expect(steps).toHaveAttribute("data-fr-steps", "5");
	});
});
