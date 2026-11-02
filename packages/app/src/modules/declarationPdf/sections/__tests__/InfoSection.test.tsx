import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@react-pdf/renderer", async () => {
	const React = await import("react");
	const styled =
		(tag: string) =>
		({ children, style }: { children: React.ReactNode; style?: unknown }) =>
			React.createElement(
				tag,
				{ "data-style": JSON.stringify(style ?? null) },
				children,
			);
	return {
		Text: styled("span"),
		View: styled("div"),
		StyleSheet: { create: <T,>(styles: T) => styles },
	};
});

vi.mock("~/modules/declarationPdf/pdfFonts", () => ({
	PDF_FONT_FAMILY: "Marianne",
}));

import { styles } from "~/modules/declarationPdf/recapPdfStyles";
import { InfoSection } from "../InfoSection";

function bannerStyleOf(title: string) {
	return screen.getByText(title).parentElement?.getAttribute("data-style");
}

describe("InfoSection", () => {
	it("draws a grey section banner by default", () => {
		render(<InfoSection rows={[]} title="Informations" />);

		expect(bannerStyleOf("Informations")).toBe(
			JSON.stringify(styles.sectionBanner),
		);
	});

	it("draws a blue banner for a category section", () => {
		render(<InfoSection rows={[]} title="Déclarant" tone="category" />);

		expect(bannerStyleOf("Déclarant")).toBe(
			JSON.stringify(styles.categoryBanner),
		);
		expect(screen.getByText("Déclarant")).toHaveAttribute(
			"data-style",
			JSON.stringify(styles.categoryBannerText),
		);
	});

	it("prints a row's detail on its own grey line under the value", () => {
		render(
			<InfoSection
				rows={[
					{
						label: "Fichiers déposés",
						value: "rapport.pdf",
						detail: "PDF · déposé le 1ᵉʳ avril 2027",
					},
				]}
				title="Évaluation conjointe des rémunérations"
			/>,
		);

		const detail = screen.getByText(/déposé le 1ᵉʳ avril 2027/);
		expect(detail.textContent).toBe("\nPDF · déposé le 1ᵉʳ avril 2027");
		expect(detail).toHaveAttribute(
			"data-style",
			JSON.stringify(styles.infoDetail),
		);
		expect(detail.parentElement?.textContent).toMatch(/^rapport\.pdf/);
	});

	it("prints no detail line for a plain row", () => {
		const { container } = render(
			<InfoSection
				rows={[{ label: "SIREN", value: "123 456 789" }]}
				title="Entreprise"
			/>,
		);

		expect(container.textContent).not.toContain("\n");
	});
});
