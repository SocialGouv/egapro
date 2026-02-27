import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

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

vi.mock("~/trpc/server", () => ({
	api: {
		company: {
			list: vi.fn().mockResolvedValue([
				{
					siren: "123456789",
					name: "Test Company",
					declarationStatus: "to_complete",
				},
				{
					siren: "987654321",
					name: "Other Company",
					declarationStatus: "done",
				},
			]),
		},
	},
	HydrateClient: ({ children }: { children: React.ReactNode }) => (
		<>{children}</>
	),
}));

import { MyCompaniesPage } from "../MyCompaniesPage";

describe("MyCompaniesPage", () => {
	it("renders the main landmark with id content", async () => {
		const page = await MyCompaniesPage();
		render(page);
		const main = screen.getByRole("main");
		expect(main).toHaveAttribute("id", "content");
	});

	it("renders the welcome banner", async () => {
		const page = await MyCompaniesPage();
		render(page);
		expect(
			screen.getByText("Bienvenue sur votre espace Egapro"),
		).toBeInTheDocument();
	});

	it("renders the page title", async () => {
		const page = await MyCompaniesPage();
		render(page);
		expect(
			screen.getByRole("heading", { level: 2, name: "Mes entreprises" }),
		).toBeInTheDocument();
	});

	it("renders companies from the API", async () => {
		const page = await MyCompaniesPage();
		render(page);
		expect(screen.getByText("Test Company")).toBeInTheDocument();
		expect(screen.getByText("Other Company")).toBeInTheDocument();
	});

	it("renders the company count", async () => {
		const page = await MyCompaniesPage();
		render(page);
		expect(screen.getByText("2 entreprises")).toBeInTheDocument();
	});
});
