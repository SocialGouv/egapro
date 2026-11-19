import { describe, expect, it } from "vitest";

import {
	bannerTitle,
	compareBySeverity,
	resolveDisplayStatus,
	statusLabel,
	summarizeServiceStatus,
	summarySentence,
	unreachableSummary,
} from "../shared/statusLabels";
import { NOW, scheduledJob, serviceProbe } from "./fixtures";

function later(seconds: number): Date {
	return new Date(NOW.getTime() + seconds * 1000);
}

describe("resolveDisplayStatus", () => {
	it("keeps the stored status inside the freshness window", () => {
		expect(resolveDisplayStatus("operational", NOW, later(299), 300, 60)).toBe(
			"operational",
		);
	});

	it("keeps it exactly at the threshold", () => {
		expect(resolveDisplayStatus("degraded", NOW, later(300), 300, 60)).toBe(
			"degraded",
		);
	});

	it("reads unknown one second past the threshold", () => {
		expect(resolveDisplayStatus("operational", NOW, later(301), 300, 60)).toBe(
			"unknown",
		);
	});

	it("widens the threshold to two cycles of a slow probe", () => {
		expect(
			resolveDisplayStatus("operational", NOW, later(1800), 300, 900),
		).toBe("operational");
		expect(
			resolveDisplayStatus("operational", NOW, later(1801), 300, 900),
		).toBe("unknown");
	});

	it("never shrinks below the configured floor", () => {
		expect(resolveDisplayStatus("operational", NOW, later(301), 300, 60)).toBe(
			"unknown",
		);
	});
});

describe("statusLabel", () => {
	it("names every status, including unknown and misconfigured", () => {
		expect(statusLabel("operational")).toBe("Opérationnel");
		expect(statusLabel("degraded")).toBe("Dégradé");
		expect(statusLabel("unavailable")).toBe("Indisponible");
		expect(statusLabel("misconfigured")).toBe("Mal configuré");
		expect(statusLabel("unknown")).toBe("Inconnu");
	});
});

describe("summarizeServiceStatus", () => {
	it("reports a supervision that stopped writing", () => {
		const summary = summarizeServiceStatus([], []);

		expect(summary).toMatchObject({
			supervisionLost: true,
			bannerVisible: true,
			tone: "error",
		});
		expect(summarySentence(summary)).toBe("La supervision ne répond plus.");
	});

	it("reports an all-unknown screen as a lost supervision", () => {
		const summary = summarizeServiceStatus(
			[serviceProbe({ status: "unknown" })],
			[],
		);

		expect(summary.supervisionLost).toBe(true);
		expect(summary.bannerVisible).toBe(true);
	});

	it("stays quiet when every service is operational", () => {
		const summary = summarizeServiceStatus([serviceProbe()], [scheduledJob()]);

		expect(summary).toMatchObject({
			supervisionLost: false,
			degradedCount: 0,
			unavailableCount: 0,
			criticalUnavailableCount: 0,
			lateJobCount: 0,
			bannerVisible: false,
			tone: "success",
		});
		expect(summarySentence(summary)).toBe(
			"Tous les services sont opérationnels.",
		);
	});

	it("counts a degraded service without raising the banner", () => {
		const summary = summarizeServiceStatus(
			[
				serviceProbe({
					key: "valkey",
					label: "Valkey",
					criticality: "critical",
					status: "degraded",
				}),
			],
			[],
		);

		expect(summary).toMatchObject({
			degradedCount: 1,
			unavailableCount: 0,
			bannerVisible: false,
			tone: "warning",
		});
		expect(summarySentence(summary)).toBe("1 service dégradé.");
	});

	it("counts a misconfigured probe as degraded", () => {
		const summary = summarizeServiceStatus(
			[serviceProbe({ status: "misconfigured" })],
			[],
		);

		expect(summary.degradedCount).toBe(1);
		expect(summarySentence(summary)).toBe("1 service dégradé.");
	});

	it("raises the banner on an unavailable critical service", () => {
		const summary = summarizeServiceStatus(
			[serviceProbe({ status: "unavailable" })],
			[],
		);

		expect(summary).toMatchObject({
			unavailableCount: 1,
			criticalUnavailableCount: 1,
			bannerVisible: true,
			tone: "error",
		});
		expect(summarySentence(summary)).toBe("1 service indisponible.");
		expect(bannerTitle(summary)).toBe("1 service critique est indisponible");
	});

	it("pluralises the summary counts", () => {
		const summary = summarizeServiceStatus(
			[
				serviceProbe({ key: "a", label: "A", status: "degraded" }),
				serviceProbe({ key: "b", label: "B", status: "degraded" }),
				serviceProbe({ key: "c", label: "C", status: "unavailable" }),
			],
			[],
		);

		expect(summarySentence(summary)).toBe(
			"2 services dégradés, 1 service indisponible.",
		);
	});

	it("raises the banner on a late non-critical job", () => {
		const summary = summarizeServiceStatus(
			[],
			[
				scheduledJob({
					criticality: "important",
					status: "unavailable",
				}),
			],
		);

		expect(summary).toMatchObject({
			criticalUnavailableCount: 0,
			lateJobCount: 1,
			bannerVisible: true,
			tone: "error",
		});
		expect(bannerTitle(summary)).toBe("1 traitement planifié est en retard");
		expect(summarySentence(summary)).toBe("1 traitement planifié en retard.");
	});

	it("keeps services and scheduled jobs apart in the summary", () => {
		const summary = summarizeServiceStatus(
			[serviceProbe({ status: "degraded" })],
			[scheduledJob({ status: "unavailable" })],
		);

		expect(summary).toMatchObject({
			degradedCount: 1,
			unavailableCount: 0,
			lateJobCount: 1,
		});
		expect(summarySentence(summary)).toBe(
			"1 service dégradé, 1 traitement planifié en retard.",
		);
	});

	it("pluralises the critical banner title", () => {
		const summary = summarizeServiceStatus(
			[
				serviceProbe({ key: "a", label: "A", status: "unavailable" }),
				serviceProbe({ key: "b", label: "B", status: "unavailable" }),
			],
			[],
		);

		expect(bannerTitle(summary)).toBe(
			"2 services critiques sont indisponibles",
		);
	});
});

describe("unreachableSummary", () => {
	it("claims a lost supervision with nothing to count", () => {
		const summary = unreachableSummary();

		expect(summary.supervisionLost).toBe(true);
		expect(summary.bannerVisible).toBe(true);
		expect(summary.unavailableCount).toBe(0);
	});
});

describe("compareBySeverity", () => {
	it("puts the worst state first, then the most critical", () => {
		const unavailableLow = serviceProbe({
			key: "low",
			label: "A",
			criticality: "low",
			status: "unavailable",
		});
		const degradedCritical = serviceProbe({
			key: "critical",
			label: "B",
			criticality: "critical",
			status: "degraded",
		});
		const operationalCritical = serviceProbe({
			key: "ok",
			label: "C",
			criticality: "critical",
			status: "operational",
		});

		const sorted = [operationalCritical, degradedCritical, unavailableLow].sort(
			compareBySeverity,
		);

		expect(sorted.map((probe) => probe.key)).toEqual(["low", "critical", "ok"]);
	});

	it("falls back to the label for equal severity and criticality", () => {
		const alpha = serviceProbe({ key: "a", label: "Alpha" });
		const beta = serviceProbe({ key: "b", label: "Bêta" });

		expect([beta, alpha].sort(compareBySeverity).map((p) => p.key)).toEqual([
			"a",
			"b",
		]);
	});
});
