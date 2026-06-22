import type { Mock } from "vitest";

export const emptyFunnelData = {
	mainFunnel: [] as { step: string; count: number }[],
	complianceFunnel: [] as { step: string; count: number }[],
	revisionFunnel: [] as { step: string; count: number }[],
	cseFunnel: [] as { step: string; count: number }[],
};

export const emptyMatomoFunnelData = {
	declarationFunnel: [] as { key: string; count: number }[],
	cseFunnel: [] as { key: string; count: number }[],
	complianceFunnel: [] as { key: string; count: number }[],
};

type QueryMocks = {
	progressionUseQueryMock: Mock;
	statsUseQueryMock: Mock;
	stepDurationsUseQueryMock: Mock;
	stepDropoffUseQueryMock: Mock;
	funnelUseQueryMock: Mock;
	matomoFunnelUseQueryMock?: Mock;
};

export function setDefaultMocks(mocks: QueryMocks) {
	mocks.progressionUseQueryMock.mockReturnValue({
		data: [],
		isLoading: false,
		isError: false,
	});
	mocks.statsUseQueryMock.mockReturnValue({
		data: { totalObligated: 0, totalSubmitted: 0, submissionRate: 0 },
		isLoading: false,
		isError: false,
	});
	mocks.stepDurationsUseQueryMock.mockReturnValue({
		data: [],
		isLoading: false,
		isError: false,
	});
	mocks.stepDropoffUseQueryMock.mockReturnValue({
		data: [],
		isLoading: false,
		isError: false,
	});
	mocks.funnelUseQueryMock.mockReturnValue({
		data: emptyFunnelData,
		isLoading: false,
		isError: false,
	});
	mocks.matomoFunnelUseQueryMock?.mockReturnValue({
		data: emptyMatomoFunnelData,
		isLoading: false,
		isError: false,
	});
}
