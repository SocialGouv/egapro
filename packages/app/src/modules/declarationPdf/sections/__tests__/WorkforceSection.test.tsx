import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { DeclarationPdfData } from "~/modules/declarationPdf/types";

vi.mock("@react-pdf/renderer", async () => {
	const React = await import("react");
	return {
		Text: ({ children }: { children: React.ReactNode }) =>
			React.createElement("span", null, children),
		View: ({ children }: { children: React.ReactNode }) =>
			React.createElement("div", null, children),
		StyleSheet: { create: <T,>(styles: T) => styles },
	};
});

import { WorkforceSection } from "../WorkforceSection";

const baseData = {
	totalWomen: 50,
	totalMen: 60,
} as unknown as DeclarationPdfData;

describe("WorkforceSection", () => {
	it("renders the women, men and total workforce counts", () => {
		render(<WorkforceSection data={baseData} />);
		expect(screen.getByText("50")).toBeInTheDocument();
		expect(screen.getByText("60")).toBeInTheDocument();
		// 50 + 60 = 110
		expect(screen.getByText("110")).toBeInTheDocument();
		expect(screen.getByText("Nombre de femmes")).toBeInTheDocument();
	});
});
