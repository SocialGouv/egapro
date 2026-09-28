import { render } from "@testing-library/react";
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
});
