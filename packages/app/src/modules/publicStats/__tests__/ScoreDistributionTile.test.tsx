import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useQueryMock = vi.fn();

vi.mock("~/trpc/react", () => ({
	api: {
		publicStats: {
			getScoreDistribution: {
				useQuery: (...args: unknown[]) => useQueryMock(...args),
			},
		},
	},
}));

vi.mock("../ScoreDistributionChart", () => ({
	ScoreDistributionChart: () =>
		React.createElement("div", { "data-testid": "chart" }),
}));

vi.mock("../ScoreDistributionTable", () => ({
	ScoreDistributionTable: ({ captionId }: { captionId: string }) =>
		React.createElement("div", {
			"data-captionid": captionId,
			"data-testid": "table",
		}),
}));

import { ScoreDistributionTile } from "../ScoreDistributionTile";

const sampleData = {
	brackets: [
		{ id: "lt50" as const, label: "<50", count: 1, percentage: 5 },
		{ id: "50-59" as const, label: "50-59", count: 2, percentage: 10 },
		{ id: "60-69" as const, label: "60-69", count: 0, percentage: 0 },
		{ id: "70-79" as const, label: "70-79", count: 0, percentage: 0 },
		{ id: "80-89" as const, label: "80-89", count: 0, percentage: 0 },
		{ id: "90-99" as const, label: "90-99", count: 0, percentage: 0 },
		{ id: "100" as const, label: "100", count: 0, percentage: 0 },
		{ id: "nc" as const, label: "NC", count: 17, percentage: 85 },
	],
	total: 20,
	year: 2026,
};

describe("ScoreDistributionTile", () => {
	beforeEach(() => {
		useQueryMock.mockReset();
	});

	it("shows the loading message while the query has no cached data", () => {
		useQueryMock.mockReturnValue({
			data: undefined,
			isLoading: true,
			isError: false,
		});
		render(<ScoreDistributionTile />);
		expect(
			screen.getByText(/chargement de la distribution/i),
		).toBeInTheDocument();
	});

	it("shows the error alert when the query errors out", () => {
		useQueryMock.mockReturnValue({
			data: undefined,
			isLoading: false,
			isError: true,
		});
		const { container } = render(<ScoreDistributionTile />);
		expect(container.querySelector(".fr-alert--error")).toBeInTheDocument();
	});

	it("returns null when the query has neither data, loading nor error state", () => {
		useQueryMock.mockReturnValue({
			data: undefined,
			isLoading: false,
			isError: false,
		});
		const { container } = render(<ScoreDistributionTile />);
		expect(container).toBeEmptyDOMElement();
	});

	it("renders the heading with the current year from the query payload", () => {
		useQueryMock.mockReturnValue({
			data: sampleData,
			isLoading: false,
			isError: false,
		});
		render(<ScoreDistributionTile />);
		expect(
			screen.getByRole("heading", {
				level: 2,
				name: /distribution des scores 2026/i,
			}),
		).toBeInTheDocument();
	});

	it("renders both the chart and the accessible table when data is present", () => {
		useQueryMock.mockReturnValue({
			data: sampleData,
			isLoading: false,
			isError: false,
		});
		render(<ScoreDistributionTile />);
		expect(screen.getByTestId("chart")).toBeInTheDocument();
		expect(screen.getByTestId("table")).toBeInTheDocument();
	});

	it("renders a descriptive paragraph mentioning the NC bracket", () => {
		useQueryMock.mockReturnValue({
			data: sampleData,
			isLoading: false,
			isError: false,
		});
		render(<ScoreDistributionTile />);
		expect(screen.getByText(/NC/)).toBeInTheDocument();
		expect(
			screen.getByText(/Répartition des entreprises ayant déclaré/i),
		).toBeInTheDocument();
	});

	it("uses placeholderData (prev) to preserve the previous result during refetch", () => {
		useQueryMock.mockReturnValue({
			data: sampleData,
			isLoading: false,
			isError: false,
		});
		render(<ScoreDistributionTile />);
		const options = useQueryMock.mock.calls[0]?.[1] as
			| { placeholderData: (prev: unknown) => unknown }
			| undefined;
		expect(options?.placeholderData("prev-value")).toBe("prev-value");
	});

	it("links the section to its heading via aria-labelledby", () => {
		useQueryMock.mockReturnValue({
			data: sampleData,
			isLoading: false,
			isError: false,
		});
		const { container } = render(<ScoreDistributionTile />);
		const section = container.querySelector("section");
		const heading = container.querySelector("h2");
		expect(section?.getAttribute("aria-labelledby")).toBe(heading?.id);
	});

	it("propagates the caption id to the alternative table component", () => {
		useQueryMock.mockReturnValue({
			data: sampleData,
			isLoading: false,
			isError: false,
		});
		render(<ScoreDistributionTile />);
		const table = screen.getByTestId("table");
		expect(table.getAttribute("data-captionid")).toMatch(/.+/);
	});
});
