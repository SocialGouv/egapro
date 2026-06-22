import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CurrentCampaignRate } from "../types";

const useQueryMock = vi.fn();

vi.mock("~/trpc/react", () => ({
	api: {
		publicStats: {
			getCurrentCampaignRate: {
				useQuery: (...args: unknown[]) => useQueryMock(...args),
			},
		},
	},
}));

import { CurrentCampaignRateTile } from "../CurrentCampaignRateTile";

function mockQuery({
	data,
	isLoading = false,
	isError = false,
}: {
	data?: CurrentCampaignRate;
	isLoading?: boolean;
	isError?: boolean;
}) {
	useQueryMock.mockReturnValue({ data, isLoading, isError });
}

describe("CurrentCampaignRateTile", () => {
	beforeEach(() => {
		useQueryMock.mockReset();
	});

	it("shows a loading message while the query is in flight and no data is cached", () => {
		mockQuery({ isLoading: true });
		render(<CurrentCampaignRateTile />);

		expect(screen.getByText(/chargement du taux/i)).toBeInTheDocument();
		expect(screen.getByText(/chargement du taux/i)).toHaveAttribute(
			"aria-live",
			"polite",
		);
	});

	it("shows an error alert when the query errors out", () => {
		mockQuery({ isError: true });
		render(<CurrentCampaignRateTile />);

		expect(
			screen.getByText(/erreur est survenue/i).closest(".fr-alert"),
		).toHaveClass("fr-alert--error");
	});

	it("renders the tile with rate, subtitle and a positive badge against year-1", () => {
		mockQuery({
			data: {
				totalObligated: 5738,
				totalSubmitted: 4213,
				submissionRate: 73.4,
				previousYearRate: 71.3,
				year: 2026,
			},
		});
		const { container } = render(<CurrentCampaignRateTile />);

		expect(
			screen.getByRole("heading", { name: "Taux de déclaration 2026" }),
		).toBeInTheDocument();
		expect(screen.getByText(/73,4/)).toBeInTheDocument();
		expect(
			screen.getByText((content) =>
				/4\s?213\s*\/\s*5\s?738\s+entreprises/.test(
					content.replace(/\s/g, " "),
				),
			),
		).toBeInTheDocument();

		const badge = container.querySelector(".fr-badge");
		expect(badge).toHaveClass("fr-badge--success");
		expect(badge?.textContent).toContain("vs 2025");
	});

	it("renders the tile without a badge when previousYearRate is null (no history)", () => {
		mockQuery({
			data: {
				totalObligated: 100,
				totalSubmitted: 50,
				submissionRate: 50,
				previousYearRate: null,
				year: 2026,
			},
		});
		const { container } = render(<CurrentCampaignRateTile />);

		expect(container.querySelector(".fr-badge")).toBeNull();
	});

	it("renders zeros gracefully when totalObligated is 0", () => {
		mockQuery({
			data: {
				totalObligated: 0,
				totalSubmitted: 0,
				submissionRate: 0,
				previousYearRate: null,
				year: 2026,
			},
		});
		render(<CurrentCampaignRateTile />);

		expect(screen.getByText(/0,0/)).toBeInTheDocument();
		expect(
			screen.getByText((content) =>
				/0\s*\/\s*0\s+entreprises/.test(content.replace(/\s/g, " ")),
			),
		).toBeInTheDocument();
	});

	it("returns null when the query has neither data, loading nor error state", () => {
		mockQuery({});
		const { container } = render(<CurrentCampaignRateTile />);
		expect(container).toBeEmptyDOMElement();
	});

	it("uses the previous data as placeholder while a new query is running", () => {
		mockQuery({
			data: {
				totalObligated: 10,
				totalSubmitted: 5,
				submissionRate: 50,
				previousYearRate: null,
				year: 2026,
			},
		});
		render(<CurrentCampaignRateTile />);

		const options = useQueryMock.mock.calls[0]?.[1] as
			| { placeholderData: (prev: unknown) => unknown }
			| undefined;
		expect(options?.placeholderData).toBeInstanceOf(Function);
		expect(options?.placeholderData("previous-data")).toBe("previous-data");
	});

	it("renders a negative delta as an error badge with comparison label from data.year", () => {
		mockQuery({
			data: {
				totalObligated: 100,
				totalSubmitted: 40,
				submissionRate: 40,
				previousYearRate: 50,
				year: 2026,
			},
		});
		const { container } = render(<CurrentCampaignRateTile />);

		const badge = container.querySelector(".fr-badge");
		expect(badge).toHaveClass("fr-badge--error");
		expect(badge?.textContent).toContain("vs 2025");
		expect(badge?.textContent).toContain("-10,0");
	});

	it("renders a neutral delta when submissionRate equals previousYearRate", () => {
		mockQuery({
			data: {
				totalObligated: 100,
				totalSubmitted: 50,
				submissionRate: 50,
				previousYearRate: 50,
				year: 2026,
			},
		});
		const { container } = render(<CurrentCampaignRateTile />);

		const badge = container.querySelector(".fr-badge");
		expect(badge).not.toHaveClass("fr-badge--success");
		expect(badge).not.toHaveClass("fr-badge--error");
		expect(badge?.textContent).toContain("=");
	});
});
