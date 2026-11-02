import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CampaignStats } from "../types";

const useQueryMock = vi.fn();

vi.mock("~/trpc/react", () => ({
	api: {
		adminStats: {
			getCampaignStats: {
				useQuery: (...args: unknown[]) => useQueryMock(...args),
			},
		},
	},
}));

import { CampaignRateTile } from "../CampaignRateTile";

function mockQuery({
	data,
	isLoading = false,
	isError = false,
}: {
	data?: CampaignStats;
	isLoading?: boolean;
	isError?: boolean;
}) {
	useQueryMock.mockReturnValue({ data, isLoading, isError });
}

describe("CampaignRateTile", () => {
	beforeEach(() => {
		useQueryMock.mockReset();
	});

	it("shows a loading message while the query is in flight and no data is cached", () => {
		mockQuery({ isLoading: true });
		render(<CampaignRateTile sizeRange={undefined} year={2026} />);

		expect(screen.getByText(/chargement du taux/i)).toBeInTheDocument();
		expect(screen.getByText(/chargement du taux/i)).toHaveAttribute(
			"aria-live",
			"polite",
		);
	});

	it("shows an error alert when the query errors out", () => {
		mockQuery({ isError: true });
		render(<CampaignRateTile sizeRange={undefined} year={2026} />);

		expect(
			screen.getByText(/erreur est survenue/i).closest(".fr-alert"),
		).toHaveClass("fr-alert--error");
	});

	it("renders the tile with rate, both counts and a positive badge against year-1", () => {
		mockQuery({
			data: {
				totalObligated: 5738,
				totalIndicatorsSubmitted: 4800,
				totalDemarcheCompleted: 4213,
				completionRate: 73.4,
				previousYearRate: 71.3,
			},
		});
		const { container } = render(
			<CampaignRateTile sizeRange={undefined} year={2026} />,
		);

		expect(
			screen.getByRole("heading", { name: "Taux de déclaration 2026" }),
		).toBeInTheDocument();
		expect(screen.getByText(/73,4/)).toBeInTheDocument();
		expect(
			screen.getByText((content) =>
				/^4\s?800\s*\/\s*5\s?738 ont transmis leurs indicateurs$/.test(
					content.replace(/\s/g, " "),
				),
			),
		).toBeInTheDocument();
		expect(
			screen.getByText((content) =>
				/^4\s?213\s*\/\s*5\s?738 ont terminé leur démarche$/.test(
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
				totalIndicatorsSubmitted: 50,
				totalDemarcheCompleted: 50,
				completionRate: 50,
				previousYearRate: null,
			},
		});
		const { container } = render(
			<CampaignRateTile sizeRange={undefined} year={2026} />,
		);

		expect(container.querySelector(".fr-badge")).toBeNull();
	});

	it("renders zeros gracefully when totalObligated is 0", () => {
		mockQuery({
			data: {
				totalObligated: 0,
				totalIndicatorsSubmitted: 0,
				totalDemarcheCompleted: 0,
				completionRate: 0,
				previousYearRate: null,
			},
		});
		render(<CampaignRateTile sizeRange="<50" year={2026} />);

		expect(screen.getByText(/0,0/)).toBeInTheDocument();
		expect(
			screen.getByText((content) =>
				/^0\s*\/\s*0 ont terminé leur démarche$/.test(
					content.replace(/\s/g, " "),
				),
			),
		).toBeInTheDocument();
	});

	it("returns null when the query has neither data, loading nor error state", () => {
		mockQuery({});
		const { container } = render(
			<CampaignRateTile sizeRange={undefined} year={2026} />,
		);
		expect(container).toBeEmptyDOMElement();
	});

	it("passes year and sizeRange through to the underlying query", () => {
		mockQuery({
			data: {
				totalObligated: 10,
				totalIndicatorsSubmitted: 5,
				totalDemarcheCompleted: 5,
				completionRate: 50,
				previousYearRate: null,
			},
		});
		render(<CampaignRateTile sizeRange="100-149" year={2025} />);

		expect(useQueryMock).toHaveBeenCalled();
		const firstCallArg = useQueryMock.mock.calls[0]?.[0] as
			| { year: number; sizeRange: string | undefined }
			| undefined;
		expect(firstCallArg).toMatchObject({ year: 2025, sizeRange: "100-149" });
	});

	it("uses the previous data as placeholder while a new query is running", () => {
		mockQuery({
			data: {
				totalObligated: 10,
				totalIndicatorsSubmitted: 5,
				totalDemarcheCompleted: 5,
				completionRate: 50,
				previousYearRate: null,
			},
		});
		render(<CampaignRateTile sizeRange={undefined} year={2026} />);

		const options = useQueryMock.mock.calls[0]?.[1] as
			| { placeholderData: (prev: unknown) => unknown }
			| undefined;
		expect(options?.placeholderData).toBeInstanceOf(Function);
		expect(options?.placeholderData("previous-data")).toBe("previous-data");
	});
});
