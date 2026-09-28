import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CseStatusConfirmations } from "../types";

const useQueryMock = vi.fn();

vi.mock("~/trpc/react", () => ({
	api: {
		adminStats: {
			getMatomoCseStatusConfirmations: {
				useQuery: (...args: unknown[]) => useQueryMock(...args),
			},
		},
	},
}));

import { CseStatusConfirmationsTile } from "../CseStatusConfirmationsTile";

function mockQuery({
	data,
	isLoading = false,
	isError = false,
}: {
	data?: CseStatusConfirmations;
	isLoading?: boolean;
	isError?: boolean;
}) {
	useQueryMock.mockReturnValue({ data, isLoading, isError });
}

describe("CseStatusConfirmationsTile", () => {
	beforeEach(() => useQueryMock.mockReset());

	it("shows a loading message while the query is in flight and no data is cached", () => {
		mockQuery({ isLoading: true });
		render(<CseStatusConfirmationsTile year={2026} />);

		expect(screen.getByText(/chargement/i)).toHaveAttribute(
			"aria-live",
			"polite",
		);
	});

	it("shows an error alert when the query errors out", () => {
		mockQuery({ isError: true });
		render(<CseStatusConfirmationsTile year={2026} />);

		expect(
			screen.getByText(/erreur est survenue/i).closest(".fr-alert"),
		).toHaveClass("fr-alert--error");
	});

	it("renders the total, the year in the title and the oui/non split", () => {
		mockQuery({ data: { total: 1234, yes: 1000, no: 234 } });
		render(<CseStatusConfirmationsTile year={2026} />);

		expect(
			screen.getByRole("heading", {
				name: "Confirmations de statut CSE (2026)",
			}),
		).toBeInTheDocument();
		expect(
			screen.getByText((content) => /^1\s?234$/.test(content)),
		).toBeInTheDocument();
		expect(
			screen.getByText((content) =>
				/1\s?000\s*«\s*oui\s*».*234\s*«\s*non\s*»/.test(
					content.replace(/\s/g, " "),
				),
			),
		).toBeInTheDocument();
	});

	it("returns null when the query has neither data, loading nor error state", () => {
		mockQuery({});
		const { container } = render(<CseStatusConfirmationsTile year={2026} />);
		expect(container).toBeEmptyDOMElement();
	});

	it("passes the year through and a placeholderData identity function to the query", () => {
		mockQuery({ data: { total: 0, yes: 0, no: 0 } });
		render(<CseStatusConfirmationsTile year={2025} />);

		expect(useQueryMock.mock.calls[0]?.[0]).toEqual({ year: 2025 });
		const options = useQueryMock.mock.calls[0]?.[1] as {
			placeholderData: (prev: unknown) => unknown;
		};
		expect(options.placeholderData("prev")).toBe("prev");
	});
});
