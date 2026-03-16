import { afterEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();
global.fetch = fetchMock;

describe("clamav service", () => {
	afterEach(() => {
		fetchMock.mockReset();
	});

	it("returns clean when CLAMAV_URL is not set", async () => {
		const { env } = await import("~/env");
		Object.defineProperty(env, "CLAMAV_URL", {
			value: undefined,
			writable: true,
			configurable: true,
		});

		const { scanBuffer } = await import("../clamav");
		const result = await scanBuffer(Buffer.from("test"), "test.pdf");
		expect(result.clean).toBe(true);
	});

	it("returns clean for an uninfected file", async () => {
		const { env } = await import("~/env");
		Object.defineProperty(env, "CLAMAV_URL", {
			value: "http://localhost:3000",
			writable: true,
			configurable: true,
		});

		fetchMock.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				success: true,
				data: {
					result: [{ is_infected: false, viruses: [] }],
				},
			}),
		});

		const { scanBuffer } = await import("../clamav");
		const result = await scanBuffer(Buffer.from("clean"), "clean.pdf");

		expect(result.clean).toBe(true);
		expect(fetchMock).toHaveBeenCalledWith(
			"http://localhost:3000/api/v1/scan",
			expect.objectContaining({ method: "POST" }),
		);
	});

	it("returns infected for a FOUND reply", async () => {
		const { env } = await import("~/env");
		Object.defineProperty(env, "CLAMAV_URL", {
			value: "http://localhost:3000",
			writable: true,
			configurable: true,
		});

		fetchMock.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				success: true,
				data: {
					result: [{ is_infected: true, viruses: ["Eicar-Signature"] }],
				},
			}),
		});

		const { scanBuffer } = await import("../clamav");
		const result = await scanBuffer(Buffer.from("infected"), "virus.pdf");

		expect(result.clean).toBe(false);
		if (!result.clean) {
			expect(result.virus).toBe("Eicar-Signature");
		}
	});

	it("throws when ClamAV REST API returns an error", async () => {
		const { env } = await import("~/env");
		Object.defineProperty(env, "CLAMAV_URL", {
			value: "http://localhost:3000",
			writable: true,
			configurable: true,
		});

		fetchMock.mockResolvedValueOnce({
			ok: false,
			status: 500,
		});

		const { scanBuffer } = await import("../clamav");
		await expect(scanBuffer(Buffer.from("test"), "test.pdf")).rejects.toThrow(
			"ClamAV scan failed with status 500",
		);
	});
});
