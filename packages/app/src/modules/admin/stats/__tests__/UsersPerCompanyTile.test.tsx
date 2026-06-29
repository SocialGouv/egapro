import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { UsersPerCompany } from "../types";

const useQueryMock = vi.fn();

vi.mock("~/trpc/react", () => ({
	api: {
		adminStats: {
			getUsersPerCompany: {
				useQuery: (...args: unknown[]) => useQueryMock(...args),
			},
		},
	},
}));

import { UsersPerCompanyTile } from "../UsersPerCompanyTile";

function mockQuery({
	data,
	isLoading = false,
	isError = false,
}: {
	data?: UsersPerCompany;
	isLoading?: boolean;
	isError?: boolean;
}) {
	useQueryMock.mockReturnValue({ data, isLoading, isError });
}

describe("UsersPerCompanyTile", () => {
	beforeEach(() => useQueryMock.mockReset());

	it("shows a loading message while the query is in flight and no data is cached", () => {
		mockQuery({ isLoading: true });
		render(<UsersPerCompanyTile />);

		expect(screen.getByText(/chargement/i)).toHaveAttribute(
			"aria-live",
			"polite",
		);
	});

	it("shows an error alert when the query errors out", () => {
		mockQuery({ isError: true });
		render(<UsersPerCompanyTile />);

		expect(
			screen.getByText(/erreur est survenue/i).closest(".fr-alert"),
		).toHaveClass("fr-alert--error");
	});

	it("renders the average, the title and the companies/multi/max subtitle", () => {
		mockQuery({
			data: {
				totalCompanies: 3,
				mono: 1,
				multi: 2,
				avgPerCompany: 2.3333,
				maxUsers: 4,
			},
		});
		render(<UsersPerCompanyTile />);

		expect(
			screen.getByRole("heading", { name: "Utilisateurs par entreprise" }),
		).toBeInTheDocument();
		// average formatted to one decimal in fr-FR ("2,3")
		expect(
			screen.getByText((content) => /^2,3$/.test(content.trim())),
		).toBeInTheDocument();
		expect(
			screen.getByText((content) => {
				const normalized = content.replace(/\s/g, " ");
				return (
					/3\s*entreprises/.test(normalized) &&
					/2\s*multi-utilisateurs/.test(normalized) &&
					/max\s*4/.test(normalized)
				);
			}),
		).toBeInTheDocument();
	});

	it("returns null when the query has neither data, loading nor error state", () => {
		mockQuery({});
		const { container } = render(<UsersPerCompanyTile />);
		expect(container).toBeEmptyDOMElement();
	});

	it("passes no input and a placeholderData identity function to the query", () => {
		mockQuery({
			data: {
				totalCompanies: 0,
				mono: 0,
				multi: 0,
				avgPerCompany: 0,
				maxUsers: 0,
			},
		});
		render(<UsersPerCompanyTile />);

		expect(useQueryMock.mock.calls[0]?.[0]).toBeUndefined();
		const options = useQueryMock.mock.calls[0]?.[1] as {
			placeholderData: (prev: unknown) => unknown;
		};
		expect(options.placeholderData("prev")).toBe("prev");
	});
});
