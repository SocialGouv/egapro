import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { RepresentationDraftContextValue } from "../DraftContext";
import {
	RepresentationDraftProvider,
	useRepresentationDraftContext,
} from "../DraftContext";

const value: RepresentationDraftContextValue = {
	year: 2025,
	step: 2,
	draft: { currentStep: 2, executiveWomenPercent: 60 },
	setDraftValues: vi.fn(),
	isSaving: false,
	isPendingSave: true,
	isReadOnly: true,
	setStepValid: vi.fn(),
};

function Consumer() {
	const context = useRepresentationDraftContext();
	return (
		<span data-testid="probe">
			{`${context.year}|${context.step}|${context.draft.executiveWomenPercent}|${context.isPendingSave}|${context.isReadOnly}`}
		</span>
	);
}

describe("RepresentationDraftProvider", () => {
	it("exposes the draft state to the step components", () => {
		render(
			<RepresentationDraftProvider value={value}>
				<Consumer />
			</RepresentationDraftProvider>,
		);

		expect(screen.getByTestId("probe")).toHaveTextContent(
			"2025|2|60|true|true",
		);
	});

	it("fails loudly when a step is rendered outside the provider", () => {
		const consoleError = vi
			.spyOn(console, "error")
			.mockImplementation(() => undefined);

		expect(() => render(<Consumer />)).toThrow(
			"useRepresentationDraftContext doit être utilisé dans un RepresentationDraftProvider.",
		);

		consoleError.mockRestore();
	});
});
