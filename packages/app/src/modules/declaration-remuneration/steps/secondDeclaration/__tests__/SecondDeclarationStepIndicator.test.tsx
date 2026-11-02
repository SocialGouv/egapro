import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SecondDeclarationStepIndicator } from "../SecondDeclarationStepIndicator";

describe("SecondDeclarationStepIndicator", () => {
	it("carries no vertical margin utility so the host container owns the rhythm", () => {
		const { container } = render(
			<SecondDeclarationStepIndicator currentStep={1} />,
		);

		const stepper = container.querySelector(".fr-stepper");

		expect(stepper).not.toBeNull();
		// DSFR fr-m[bty]-Nw utilities are !important: hosts in flex-gap cannot override them, so the shared stepper must carry none
		expect(stepper?.className).not.toMatch(/\bfr-m[bty]-/);
	});

	it.each([
		[1, "Seconde déclaration de l'indicateur par catégorie d'emplois"],
		[2, "Récapitulatif de la déclaration"],
		[3, "Transmettre"],
	] as const)("announces the next step at step %s", (currentStep, nextTitle) => {
		render(<SecondDeclarationStepIndicator currentStep={currentStep} />);

		expect(
			screen.getByText("Étape suivante :").parentElement,
		).toHaveTextContent(`Étape suivante : ${nextTitle}`);
	});

	it("titles the step 2 after the indicator being declared again", () => {
		render(<SecondDeclarationStepIndicator currentStep={2} />);

		expect(
			screen.getByRole("heading", {
				level: 2,
				name: /^Seconde déclaration de l'indicateur par catégorie d'emplois/,
			}),
		).toBeInTheDocument();
	});
});
