import type { PlaywrightReport } from "#scripts/report-grille";

export function reportWith(
	suites: PlaywrightReport["suites"],
): PlaywrightReport {
	return {
		suites,
		stats: {
			startTime: "2033-03-15T09:00:00.000Z",
			duration: 1000,
			expected: 1,
			unexpected: 0,
			skipped: 0,
			flaky: 0,
		},
	};
}
