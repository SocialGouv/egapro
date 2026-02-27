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

import { CompanyTable } from "../CompanyTable";
import type { CompanyItem } from "../types";

const companies: CompanyItem[] = [
	{ siren: "111111111", name: "Company A", declarationStatus: "to_complete" },
	{ siren: "222222222", name: "Company B", declarationStatus: "done" },
];

describe("CompanyTable", () => {
	it("renders the table with correct column headers", () => {
		render(<CompanyTable companies={companies} />);
		expect(
			screen.getByRole("columnheader", { name: "Entreprise" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("columnheader", { name: "SIREN" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("columnheader", { name: "Statut" }),
		).toBeInTheDocument();
	});

	it("renders one row per company", () => {
		render(<CompanyTable companies={companies} />);
		const rows = screen.getAllByRole("row");
		// 1 header row + 2 data rows
		expect(rows).toHaveLength(3);
	});

	it("renders company names as links", () => {
		render(<CompanyTable companies={companies} />);
		const linkA = screen.getByRole("link", { name: "Company A" });
		expect(linkA).toHaveAttribute(
			"href",
			"/declaration-remuneration?siren=111111111",
		);
		const linkB = screen.getByRole("link", { name: "Company B" });
		expect(linkB).toHaveAttribute(
			"href",
			"/declaration-remuneration?siren=222222222",
		);
	});

	it("renders SIREN numbers in cells", () => {
		render(<CompanyTable companies={companies} />);
		expect(screen.getByText("111111111")).toBeInTheDocument();
		expect(screen.getByText("222222222")).toBeInTheDocument();
	});

	it("renders status badges", () => {
		render(<CompanyTable companies={companies} />);
		expect(screen.getByText("À compléter")).toBeInTheDocument();
		expect(screen.getByText("Effectué")).toBeInTheDocument();
	});

	it("has an accessible caption", () => {
		render(<CompanyTable companies={companies} />);
		expect(screen.getByText("Liste des entreprises")).toBeInTheDocument();
	});
});
