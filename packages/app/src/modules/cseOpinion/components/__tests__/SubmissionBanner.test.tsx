import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock(
	"~/trpc/react",
	async () => await import("~/test/resendReceiptApiMock"),
);

import type { SubmissionBannerVariant } from "../../submissionBanner";
import { SubmissionBanner } from "../SubmissionBanner";

const MODIFIABLE_SENTENCE =
	"Vous pouvez modifier votre dépôt jusqu'à ce que vous transmettiez l'avis ou les avis du CSE.";

function renderBanner(
	variant: SubmissionBannerVariant,
	depositModifiable = false,
	year = 2026,
) {
	return render(
		<SubmissionBanner
			deadline={new Date("2026-08-01T00:00:00Z")}
			depositModifiable={depositModifiable}
			email="declarant@example.fr"
			variant={variant}
			year={year}
		/>,
	);
}

const VARIANTS: SubmissionBannerVariant[] = [
	"joint_evaluation",
	"second_declaration",
];

describe("SubmissionBanner", () => {
	it("announces the transmitted joint evaluation", () => {
		renderBanner("joint_evaluation");

		expect(
			screen.getByText(
				"Votre évaluation conjointe des rémunérations a été transmise",
			),
		).toBeInTheDocument();
	});

	it("announces the transmitted second declaration", () => {
		renderBanner("second_declaration");

		expect(
			screen.getByText("Votre seconde déclaration a été transmise"),
		).toBeInTheDocument();
	});

	it.each(
		VARIANTS,
	)("says the %s deposit stays modifiable, without the deadline, when it is", (variant) => {
		renderBanner(variant, true);

		expect(screen.getByText(MODIFIABLE_SENTENCE)).toBeInTheDocument();
		expect(
			screen.queryByText(/Échéance pour transmettre l'avis ou les avis du CSE/),
		).not.toBeInTheDocument();
	});

	it.each(
		VARIANTS,
	)("gives the CSE opinion deadline when the %s deposit is closed", (variant) => {
		renderBanner(variant, false);

		expect(
			screen.getByText(/Échéance pour transmettre l'avis ou les avis du CSE :/),
		).toHaveTextContent("1ᵉʳ août 2026");
		expect(screen.queryByText(/Vous pouvez modifier/)).not.toBeInTheDocument();
	});

	it("offers the joint evaluation recap of the banner's year as a download", () => {
		renderBanner("joint_evaluation", false, 2027);

		const link = screen.getByRole("link", {
			name: "Télécharger le récapitulatif : Évaluation conjointe des rémunérations 2027",
		});
		expect(link).toHaveAttribute("href", "/api/joint-evaluation-pdf?year=2027");
		expect(link).toHaveClass("fr-icon-download-line");
		expect(screen.getByText("PDF")).toHaveClass("fr-text-mention--grey");
	});

	it("offers the second declaration recap of the banner's year as a download", () => {
		renderBanner("second_declaration", false, 2027);

		const link = screen.getByRole("link", {
			name: "Télécharger le récapitulatif : Seconde déclaration de l'indicateur par catégorie d'emplois 2027",
		});
		expect(link.getAttribute("href")).toMatch(/\?type=correction&year=2027$/);
	});

	it("uses the DSFR mention color for the fallback instruction", () => {
		renderBanner("second_declaration");

		expect(screen.getByText(/vérifiez vos courriers indésirables/)).toHaveClass(
			"fr-text-mention--grey",
		);
		expect(screen.getByText("declarant@example.fr")).toBeInTheDocument();
	});
});
