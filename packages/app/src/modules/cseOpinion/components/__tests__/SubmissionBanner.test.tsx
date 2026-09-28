import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock(
	"~/trpc/react",
	async () => await import("~/test/resendReceiptApiMock"),
);

import { SubmissionBanner } from "../SubmissionBanner";

describe("SubmissionBanner", () => {
	it("announces the joint evaluation report and gives the CSE opinion deadline as information", () => {
		render(
			<SubmissionBanner
				deadline={new Date("2026-08-01T00:00:00Z")}
				email="declarant@example.fr"
				year={2026}
			/>,
		);

		expect(
			screen.getByText(
				"Votre rapport de l'évaluation conjointe a été transmis",
			),
		).toBeInTheDocument();
		expect(
			screen.getByText(/Échéance pour transmettre l'avis ou les avis du CSE :/),
		).toHaveTextContent("1ᵉʳ août 2026");
		expect(screen.queryByText(/Vous pouvez modifier/)).not.toBeInTheDocument();
	});

	it("uses the DSFR mention color for the fallback instruction", () => {
		render(
			<SubmissionBanner
				deadline={new Date("2026-08-01T00:00:00Z")}
				email="declarant@example.fr"
				year={2026}
			/>,
		);

		expect(screen.getByText(/vérifiez vos courriers indésirables/)).toHaveClass(
			"fr-text-mention--grey",
		);
	});
});
