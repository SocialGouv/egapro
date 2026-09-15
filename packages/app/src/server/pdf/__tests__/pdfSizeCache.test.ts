import { beforeEach, describe, expect, it } from "vitest";

import {
	clearPdfSizeCache,
	getPdfSize,
	PDF_SIZE_CACHE_MAX_ENTRIES,
	pdfSizeKey,
	setPdfSize,
} from "../pdfSizeCache";

describe("pdfSizeKey", () => {
	beforeEach(() => {
		clearPdfSizeCache();
	});

	it("gives the same key to the same route and data", () => {
		const data = { siren: "123456789", year: 2026 };

		expect(pdfSizeKey("declaration-pdf", data)).toBe(
			pdfSizeKey("declaration-pdf", { siren: "123456789", year: 2026 }),
		);
	});

	it("separates two routes carrying identical data", () => {
		const data = { siren: "123456789", year: 2026 };

		expect(pdfSizeKey("declaration-pdf", data)).not.toBe(
			pdfSizeKey("transmitted-pdf", data),
		);
	});

	it("changes as soon as the data changes", () => {
		expect(pdfSizeKey("declaration-pdf", { year: 2026 })).not.toBe(
			pdfSizeKey("declaration-pdf", { year: 2027 }),
		);
	});

	// Without this the key differs on every call and the cache is dead weight.
	it("ignores the moment the document was generated", () => {
		expect(
			pdfSizeKey("representation-pdf", {
				campaignYear: 2026,
				generatedAt: new Date("2026-01-01T00:00:00.000Z"),
			}),
		).toBe(
			pdfSizeKey("representation-pdf", {
				campaignYear: 2026,
				generatedAt: new Date("2026-06-30T23:59:59.999Z"),
			}),
		);
	});

	it("still separates two documents that differ elsewhere", () => {
		expect(
			pdfSizeKey("representation-pdf", {
				campaignYear: 2026,
				generatedAt: new Date("2026-01-01T00:00:00.000Z"),
			}),
		).not.toBe(
			pdfSizeKey("representation-pdf", {
				campaignYear: 2027,
				generatedAt: new Date("2026-01-01T00:00:00.000Z"),
			}),
		);
	});
});

describe("pdf size cache", () => {
	beforeEach(() => {
		clearPdfSizeCache();
	});

	it("returns null for a key that was never stored", () => {
		expect(
			getPdfSize(pdfSizeKey("declaration-pdf", { year: 2026 })),
		).toBeNull();
	});

	it("returns the stored size on a hit", () => {
		const key = pdfSizeKey("declaration-pdf", { year: 2026 });
		setPdfSize(key, 63365);

		expect(getPdfSize(key)).toBe(63365);
	});

	it("overwrites the size stored for a key", () => {
		const key = pdfSizeKey("declaration-pdf", { year: 2026 });
		setPdfSize(key, 63365);
		setPdfSize(key, 70000);

		expect(getPdfSize(key)).toBe(70000);
	});

	it("evicts the least recently used entry past the bound", () => {
		const firstKey = pdfSizeKey("declaration-pdf", { n: 0 });
		for (let n = 0; n < PDF_SIZE_CACHE_MAX_ENTRIES; n++) {
			setPdfSize(pdfSizeKey("declaration-pdf", { n }), 1000 + n);
		}
		expect(getPdfSize(firstKey)).toBe(1000);

		setPdfSize(
			pdfSizeKey("declaration-pdf", { n: PDF_SIZE_CACHE_MAX_ENTRIES }),
			9999,
		);

		expect(getPdfSize(firstKey)).toBe(1000);
		expect(getPdfSize(pdfSizeKey("declaration-pdf", { n: 1 }))).toBeNull();
	});

	it("keeps the bound after many insertions", () => {
		for (let n = 0; n < PDF_SIZE_CACHE_MAX_ENTRIES * 3; n++) {
			setPdfSize(pdfSizeKey("declaration-pdf", { n }), n);
		}

		expect(
			getPdfSize(
				pdfSizeKey("declaration-pdf", {
					n: PDF_SIZE_CACHE_MAX_ENTRIES * 3 - 1,
				}),
			),
		).toBe(PDF_SIZE_CACHE_MAX_ENTRIES * 3 - 1);
		expect(getPdfSize(pdfSizeKey("declaration-pdf", { n: 0 }))).toBeNull();
	});
});
