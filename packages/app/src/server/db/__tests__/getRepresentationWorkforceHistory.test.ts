import { beforeEach, describe, expect, it, vi } from "vitest";

import { REPRESENTATION_SUBJECTION_WINDOW_YEARS } from "~/modules/domain";

const limitMock = vi.fn();
const orderByMock = vi.fn().mockReturnValue({ limit: limitMock });
const dbMock = {
	select: vi.fn().mockReturnValue({
		from: vi.fn().mockReturnValue({
			where: vi.fn().mockReturnValue({ orderBy: orderByMock }),
		}),
	}),
};

vi.mock("..", () => ({
	db: dbMock,
}));

async function loadGetRepresentationWorkforceHistory() {
	vi.resetModules();
	const { getRepresentationWorkforceHistory } = await import(
		"../getRepresentationWorkforceHistory"
	);
	return getRepresentationWorkforceHistory;
}

describe("getRepresentationWorkforceHistory", () => {
	beforeEach(() => {
		limitMock.mockReset();
		orderByMock.mockClear();
	});

	it("returns an empty history when the company has no known workforce", async () => {
		limitMock.mockResolvedValueOnce([]);
		const getRepresentationWorkforceHistory =
			await loadGetRepresentationWorkforceHistory();

		expect(await getRepresentationWorkforceHistory("339787277", 2026)).toEqual(
			[],
		);
	});

	// `workforce_ema` is a numeric column: the driver hands it back as a string.
	it("parses the numeric workforce column into numbers", async () => {
		limitMock.mockResolvedValueOnce([
			{ year: 2026, workforceEma: "1200.00" },
			{ year: 2025, workforceEma: "1050.50" },
		]);
		const getRepresentationWorkforceHistory =
			await loadGetRepresentationWorkforceHistory();

		expect(await getRepresentationWorkforceHistory("339787277", 2026)).toEqual([
			{ year: 2026, workforceEma: 1200 },
			{ year: 2025, workforceEma: 1050.5 },
		]);
	});

	it("drops years whose workforce value is unusable", async () => {
		limitMock.mockResolvedValueOnce([
			{ year: 2026, workforceEma: "1200.00" },
			{ year: 2025, workforceEma: null },
			{ year: 2024, workforceEma: "not-a-number" },
		]);
		const getRepresentationWorkforceHistory =
			await loadGetRepresentationWorkforceHistory();

		expect(await getRepresentationWorkforceHistory("339787277", 2026)).toEqual([
			{ year: 2026, workforceEma: 1200 },
		]);
	});

	it("reads at most the subjection window worth of years", async () => {
		limitMock.mockResolvedValueOnce([]);
		const getRepresentationWorkforceHistory =
			await loadGetRepresentationWorkforceHistory();

		await getRepresentationWorkforceHistory("339787277", 2026);

		expect(limitMock).toHaveBeenCalledWith(
			REPRESENTATION_SUBJECTION_WINDOW_YEARS,
		);
	});
});
