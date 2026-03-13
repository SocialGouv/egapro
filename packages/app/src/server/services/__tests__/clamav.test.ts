import { describe, expect, it, vi } from "vitest";

const scanBufferMock = vi.fn();

vi.mock("clamdjs", () => ({
	createScanner: () => ({ scanBuffer: scanBufferMock }),
	isCleanReply: (reply: string) =>
		reply.includes("OK") && !reply.includes("FOUND"),
}));

describe("clamav service", () => {
	it("returns clean for an OK reply", async () => {
		scanBufferMock.mockResolvedValue("stream: OK\0");

		const { scanBuffer } = await import("../clamav");
		const result = await scanBuffer(Buffer.from("clean content"));

		expect(result.clean).toBe(true);
		expect(result.viruses).toEqual([]);
	});

	it("returns infected for a FOUND reply", async () => {
		scanBufferMock.mockResolvedValue("stream: Eicar-Signature FOUND\0");

		const { scanBuffer } = await import("../clamav");
		const result = await scanBuffer(Buffer.from("infected"));

		expect(result.clean).toBe(false);
		expect(result.viruses).toContain("Eicar-Signature");
	});

	it("throws when ClamAV is unreachable", async () => {
		scanBufferMock.mockRejectedValue(new Error("Timeout connecting to server"));

		const { scanBuffer } = await import("../clamav");

		await expect(scanBuffer(Buffer.from("test"))).rejects.toThrow(
			"Timeout connecting to server",
		);
	});
});
