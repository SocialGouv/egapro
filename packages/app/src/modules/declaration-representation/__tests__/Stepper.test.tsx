import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Stepper } from "../Stepper";
import { TOTAL_REPRESENTATION_STEPS } from "../types";

describe("Stepper", () => {
	it("announces the current step, its title and the next one", () => {
		render(<Stepper currentStep={2} />);

		const heading = screen.getByRole("heading", { level: 2 });
		expect(heading).toHaveTextContent(
			"Écarts de représentation - Cadres dirigeants",
		);
		expect(screen.getByText("Étape 2 sur 5")).toBeInTheDocument();
		expect(
			screen.getByText("Étape suivante :").parentElement,
		).toHaveTextContent(
			"Étape suivante : Écarts de représentation - Instances dirigeantes",
		);
	});

	it("exposes the DSFR progress attributes", () => {
		const { container } = render(<Stepper currentStep={3} />);

		const steps = container.querySelector(".fr-stepper__steps");
		expect(steps).toHaveAttribute("data-fr-current-step", "3");
		expect(steps).toHaveAttribute(
			"data-fr-steps",
			String(TOTAL_REPRESENTATION_STEPS),
		);
	});

	it("drops the next-step mention on the last step", () => {
		render(<Stepper currentStep={TOTAL_REPRESENTATION_STEPS} />);

		expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
			"Récapitulatif",
		);
		expect(screen.getByText("Étape 5 sur 5")).toBeInTheDocument();
		expect(screen.queryByText("Étape suivante :")).not.toBeInTheDocument();
	});

	it.each([
		0,
		TOTAL_REPRESENTATION_STEPS + 1,
	])("renders nothing for the out-of-range step %i", (step) => {
		const { container } = render(<Stepper currentStep={step} />);

		expect(container).toBeEmptyDOMElement();
	});
});
