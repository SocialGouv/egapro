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

	it("offers the joint evaluation recap of the banner's year as a download", () => {
		render(
			<SubmissionBanner
				deadline={new Date("2026-08-01T00:00:00Z")}
				email="declarant@example.fr"
				year={2027}
			/>,
		);

		const link = screen.getByRole("link", {
			name: "Télécharger le récapitulatif de l'évaluation conjointe des rémunérations",
		});
		expect(link).toHaveAttribute("href", "/api/joint-evaluation-pdf?year=2027");
		expect(link).toHaveClass("fr-icon-download-line");
		expect(screen.getByText("PDF")).toHaveClass("fr-text-mention--grey");
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
