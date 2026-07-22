import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@react-pdf/renderer", async () => {
	const React = await import("react");
	return {
		Text: ({
			children,
			render: renderProp,
		}: {
			children?: React.ReactNode;
			render?: (props: { pageNumber: number; totalPages: number }) => string;
		}) =>
			React.createElement(
				"span",
				null,
				renderProp ? renderProp({ pageNumber: 2, totalPages: 4 }) : children,
			),
		View: ({ children }: { children: React.ReactNode }) =>
			React.createElement("div", null, children),
		Image: () => React.createElement("div", { "data-testid": "pdf-image" }),
		StyleSheet: { create: <T,>(styles: T) => styles },
	};
});

import { EgaproBanner } from "../EgaproBanner";
import { InfoSection } from "../InfoSection";
import { PdfPageFooter } from "../PdfPageFooter";
import { PdfPageHeader } from "../PdfPageHeader";

describe("PdfPageFooter", () => {
	it("renders the footer line with formatted SIREN and the dynamic page counter", () => {
		render(
			<PdfPageFooter
				siren="123456789"
				transmittedAt="05/03/2026"
				year={2026}
			/>,
		);
		expect(
			screen.getByText(
				"Déclaration 2026 - SIREN 123 456 789 - transmise le 05/03/2026",
			),
		).toBeInTheDocument();
		expect(screen.getByText("Page 2/4")).toBeInTheDocument();
	});
});

describe("PdfPageHeader", () => {
	it("renders the ministry block with its logo", () => {
		render(<PdfPageHeader />);
		expect(screen.getByTestId("pdf-image")).toBeInTheDocument();
		expect(screen.getByText(/Direction Générale/)).toBeInTheDocument();
	});
});

describe("EgaproBanner", () => {
	it("renders the Egapro banner title and subtitle", () => {
		render(<EgaproBanner />);
		expect(screen.getByText("Egapro")).toBeInTheDocument();
		expect(
			screen.getByText(/Indicateurs d.égalité professionnelle/),
		).toBeInTheDocument();
	});
});

describe("InfoSection", () => {
	it("renders each label/value pair under the section title", () => {
		render(
			<InfoSection
				rows={[
					{ label: "Raison sociale", value: "Société Démo" },
					{ label: "SIREN", value: "123 456 789" },
				]}
				title="Informations entreprise"
			/>,
		);
		expect(screen.getByText("Informations entreprise")).toBeInTheDocument();
		expect(screen.getByText("Raison sociale")).toBeInTheDocument();
		expect(screen.getByText("Société Démo")).toBeInTheDocument();
		expect(screen.getByText("SIREN")).toBeInTheDocument();
		expect(screen.getByText("123 456 789")).toBeInTheDocument();
	});
});
