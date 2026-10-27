import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ResultsPublicationNotice } from "../ResultsPublicationNotice";

const COMPANY_NAME = "Société Démo";

describe("ResultsPublicationNotice", () => {
	it("titles the section", () => {
		render(<ResultsPublicationNotice companyName={COMPANY_NAME} />);

		expect(
			screen.getByRole("heading", {
				level: 2,
				name: "Publication des résultats",
			}),
		).toBeInTheDocument();
	});

	it("names the company and excludes the job category indicator", () => {
		render(<ResultsPublicationNotice companyName={COMPANY_NAME} />);

		const notice = screen.getByText(
			new RegExp(`Les résultats déclarés par ${COMPANY_NAME}`),
		);
		expect(notice).toHaveTextContent(
			"seront rendus publics dans l'onglet « Observatoire » d'Egapro",
		);
		expect(notice).toHaveTextContent(
			"à l'exception de l'indicateur concernant les écarts de rémunération par catégorie d'emplois.",
		);
	});

	it("wraps the notice in the DSFR highlight block", () => {
		const { container } = render(
			<ResultsPublicationNotice companyName={COMPANY_NAME} />,
		);

		expect(container.querySelector(".fr-highlight")).toBeInTheDocument();
	});

	it("links to the observatory search, in the same tab, as a normal-size tertiary button", () => {
		render(<ResultsPublicationNotice companyName={COMPANY_NAME} />);

		const link = screen.getByRole("link", {
			name: "Consulter l'observatoire",
		});
		expect(link).toHaveAttribute("href", "/index-egapro/recherche");
		expect(link).not.toHaveAttribute("target");
		expect(link).toHaveClass("fr-btn", "fr-btn--tertiary");
		expect(link).not.toHaveClass("fr-btn--sm");
	});
});
