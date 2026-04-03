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
});
