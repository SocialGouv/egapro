import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
		...props
	}: {
		href: string;
		children: React.ReactNode;
		[key: string]: unknown;
	}) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));

import { DeclarationsSection } from "../DeclarationsSection";
import type { DeclarationItem } from "../types";

const currentYear = new Date().getFullYear();

const declarations: DeclarationItem[] = [
	{
		type: "remuneration",
		siren: "532847196",
		year: currentYear,
		status: "to_complete",
		currentStep: 0,
		updatedAt: null,
	},
	{
		type: "representation",
		siren: "532847196",
		year: currentYear,
		status: "to_complete",
		currentStep: 0,
		updatedAt: null,
	},
	{
		type: "remuneration",
		siren: "532847196",
		year: currentYear - 1,
		status: "done",
		currentStep: 6,
		updatedAt: new Date("2025-03-15"),
	},
];

describe("DeclarationsSection", () => {
	it("renders the 'Déclarations' heading", () => {
		render(
			<DeclarationsSection
				declarations={declarations}
				siren="532847196"
				userPhone="0122334455"
			/>,
		);
		expect(
			screen.getByRole("heading", { level: 2, name: "Déclarations" }),
		).toBeInTheDocument();
	});

	it("renders the table column headers", () => {
		render(
			<DeclarationsSection
				declarations={declarations}
				siren="532847196"
				userPhone="0122334455"
			/>,
		);
		expect(
			screen.getByRole("columnheader", { name: "Déclaration" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("columnheader", { name: "Année" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("columnheader", { name: "Étape" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("columnheader", { name: "Statut" }),
		).toBeInTheDocument();
	});

	it("renders declaration rows with year, status badge, and step label", () => {
		render(
			<DeclarationsSection
				declarations={declarations}
				siren="532847196"
				userPhone="0122334455"
			/>,
		);
		expect(screen.getAllByText(String(currentYear))).toHaveLength(2);
		expect(screen.getByText(String(currentYear - 1))).toBeInTheDocument();
		expect(screen.getByText("Complétée")).toBeInTheDocument();
		expect(screen.getAllByText("À compléter")).toHaveLength(2);
		expect(screen.getByText("Effectué")).toBeInTheDocument();
	});

	it("renders 'Années précédentes' separator when there are past declarations", () => {
		render(
			<DeclarationsSection
				declarations={declarations}
				siren="532847196"
				userPhone="0122334455"
			/>,
		);
		expect(screen.getByText("Années précédentes")).toBeInTheDocument();
	});

	it("renders 'Rémunération' and 'Représentation' links", () => {
		render(
			<DeclarationsSection
				declarations={declarations}
				siren="532847196"
				userPhone="0122334455"
			/>,
		);
		const remuLinks = screen.getAllByRole("link", { name: "Rémunération" });
		expect(remuLinks).toHaveLength(2);
		const represLinks = screen.getAllByRole("link", {
			name: "Représentation",
		});
		expect(represLinks).toHaveLength(1);
	});
});
