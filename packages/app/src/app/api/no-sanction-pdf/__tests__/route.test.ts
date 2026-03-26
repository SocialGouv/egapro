import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	auth: vi.fn(),
	fetchSanctionBySiren: vi.fn(),
	dbSelect: vi.fn(),
	renderToBuffer: vi.fn(),
}));

vi.mock("~/server/auth", () => ({
	auth: mocks.auth,
}));

vi.mock("~/server/services/suit", () => ({
	fetchSanctionBySiren: mocks.fetchSanctionBySiren,
}));

vi.mock("~/server/db", () => {
	const fromMock = vi.fn();
	const whereMock = vi.fn();
	const limitMock = vi.fn();

	mocks.dbSelect.mockReturnValue({
		from: fromMock.mockReturnValue({
			where: whereMock.mockReturnValue({
				limit: limitMock,
			}),
		}),
	});

	return {
		db: {
			select: mocks.dbSelect,
		},
	};
});

vi.mock("~/server/db/schema", () => ({
	companies: { siren: "siren", name: "name", address: "address" },
}));

vi.mock("drizzle-orm", () => ({
	eq: vi.fn((a, b) => `${a}=${b}`),
}));

vi.mock("@react-pdf/renderer", () => ({
	renderToBuffer: mocks.renderToBuffer,
	Document: vi.fn(),
	Page: vi.fn(),
	Text: vi.fn(),
	View: vi.fn(),
	StyleSheet: { create: <T>(s: T) => s },
}));

vi.mock("~/modules/declarationPdf/pdfFonts", () => ({
	PDF_FONT_FAMILY: "Marianne",
	ensurePdfFontsRegistered: vi.fn(),
}));

import { GET } from "../route";

function mockSession(siret: string | null) {
	mocks.auth.mockResolvedValue(
		siret ? { user: { id: "user-1", siret } } : null,
	);
}

function mockDbResult(rows: Array<{ name: string; address: string | null }>) {
	const limitMock = vi.fn().mockResolvedValue(rows);
	const whereMock = vi.fn().mockReturnValue({ limit: limitMock });
	const fromMock = vi.fn().mockReturnValue({ where: whereMock });
	mocks.dbSelect.mockReturnValue({ from: fromMock });
}

describe("GET /api/no-sanction-pdf", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns 401 when user is not authenticated", async () => {
		mocks.auth.mockResolvedValue(null);

		const response = await GET();

		expect(response.status).toBe(401);
		expect(await response.text()).toBe("Non autorisé");
	});

	it("returns 401 when user has no siret", async () => {
		mockSession(null);

		const response = await GET();

		expect(response.status).toBe(401);
	});

	it("returns 403 when company has a sanction", async () => {
		mockSession("12345678901234");
		mocks.fetchSanctionBySiren.mockResolvedValue({
			hasSanction: true,
			validityDate: null,
		});

		const response = await GET();

		expect(response.status).toBe(403);
		expect(await response.text()).toContain("sanction est en cours");
	});

	it("generates PDF when SUIT is unavailable (null)", async () => {
		mockSession("12345678901234");
		mocks.fetchSanctionBySiren.mockResolvedValue(null);
		mockDbResult([{ name: "Acme Corp", address: null }]);
		mocks.renderToBuffer.mockResolvedValue(new Uint8Array([37, 80, 68, 70]));

		const response = await GET();

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("application/pdf");
	});

	it("returns 404 when company is not found", async () => {
		mockSession("12345678901234");
		mocks.fetchSanctionBySiren.mockResolvedValue({
			hasSanction: false,
			validityDate: null,
		});
		mockDbResult([]);

		const response = await GET();

		expect(response.status).toBe(404);
		expect(await response.text()).toBe("Entreprise introuvable");
	});

	it("returns PDF with correct headers on success", async () => {
		mockSession("12345678901234");
		mocks.fetchSanctionBySiren.mockResolvedValue({
			hasSanction: false,
			validityDate: null,
		});
		mockDbResult([{ name: "Acme Corp", address: "1 rue de Paris" }]);
		mocks.renderToBuffer.mockResolvedValue(new Uint8Array([37, 80, 68, 70]));

		const response = await GET();

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("application/pdf");
		expect(response.headers.get("Content-Disposition")).toBe(
			'attachment; filename="attestation-non-sanction-123456789.pdf"',
		);
	});

	it("returns 500 when PDF generation fails", async () => {
		mockSession("12345678901234");
		mocks.fetchSanctionBySiren.mockResolvedValue({
			hasSanction: false,
			validityDate: null,
		});
		mockDbResult([{ name: "Acme Corp", address: null }]);
		mocks.renderToBuffer.mockRejectedValue(new Error("render failed"));

		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const response = await GET();

		expect(response.status).toBe(500);
		expect(await response.text()).toBe("Impossible de générer le PDF");
		consoleSpy.mockRestore();
	});
});
