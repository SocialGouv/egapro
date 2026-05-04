import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DownloadDeclarationPdfButton } from "../DownloadDeclarationPdfButton";

describe("DownloadDeclarationPdfButton", () => {
	it("renders a download link with year query param when year is provided", () => {
		render(<DownloadDeclarationPdfButton year={2025} />);

		const link = screen.getByRole("link", {
			name: /Télécharger le récapitulatif/,
		});
		expect(link).toHaveAttribute("href", "/api/declaration-pdf?year=2025");
		expect(link).toHaveAttribute("download");
	});

	it("renders a download link without year param when year is omitted", () => {
		render(<DownloadDeclarationPdfButton />);

		const link = screen.getByRole("link", {
			name: /Télécharger le récapitulatif/,
		});
		expect(link).toHaveAttribute("href", "/api/declaration-pdf");
	});

	it("appends type=correction when correction is true", () => {
		render(<DownloadDeclarationPdfButton correction year={2025} />);

		const link = screen.getByRole("link", {
			name: /Télécharger le récapitulatif/,
		});
		expect(link).toHaveAttribute(
			"href",
			"/api/declaration-pdf?year=2025&type=correction",
		);
	});

	it("appends type=correction without year when year is omitted", () => {
		render(<DownloadDeclarationPdfButton correction />);

		const link = screen.getByRole("link", {
			name: /Télécharger le récapitulatif/,
		});
		expect(link).toHaveAttribute("href", "/api/declaration-pdf?type=correction");
	});

	it("uses tertiary DSFR variant when variant=tertiary", () => {
		render(<DownloadDeclarationPdfButton variant="tertiary" />);

		const link = screen.getByRole("link", {
			name: /Télécharger le récapitulatif/,
		});
		expect(link.className).toContain("fr-btn--tertiary");
		expect(link.className).not.toContain("fr-btn--secondary");
	});

	it("defaults to secondary DSFR variant when variant is omitted", () => {
		render(<DownloadDeclarationPdfButton />);

		const link = screen.getByRole("link", {
			name: /Télécharger le récapitulatif/,
		});
		expect(link.className).toContain("fr-btn--secondary");
	});
});
