import net from "node:net";
import { describe, expect, it } from "vitest";

import { createClamavProbe } from "../clamav.js";

const connection = { host: "127.0.0.1", port: 0 };

async function withServer(
	handler: (socket: net.Socket) => void,
	run: (port: number) => Promise<void>,
): Promise<void> {
	const sockets = new Set<net.Socket>();
	const server = net.createServer((socket) => {
		sockets.add(socket);
		socket.once("close", () => sockets.delete(socket));
		handler(socket);
	});
	await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
	const address = server.address();
	if (address === null || typeof address === "string") {
		throw new Error("no port assigned");
	}

	try {
		await run(address.port);
	} finally {
		for (const socket of sockets) socket.destroy();
		await new Promise<void>((resolve) => server.close(() => resolve()));
	}
}

async function refusedPort(): Promise<number> {
	const server = net.createServer();
	await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
	const address = server.address();
	if (address === null || typeof address === "string") {
		throw new Error("no port assigned");
	}
	await new Promise<void>((resolve) => server.close(() => resolve()));
	return address.port;
}

describe("clamav probe", () => {
	it("declares itself as a critical internal probe", () => {
		const probe = createClamavProbe({ connection, secrets: [] });

		expect(probe).toMatchObject({
			key: "clamav",
			label: "ClamAV (antivirus)",
			criticality: "critical",
			kind: "internal",
			intervalSeconds: 60,
			timeoutMs: 5000,
		});
	});

	it("is operational when clamd answers PONG", async () => {
		await withServer(
			(socket) => {
				socket.once("data", () => socket.write("PONG\0"));
			},
			async (port) => {
				const result = await createClamavProbe({
					connection: { host: "127.0.0.1", port },
					secrets: [],
				}).probe(new AbortController().signal);

				expect(result.status).toBe("operational");
				expect(result.latencyMs).toBeGreaterThanOrEqual(0);
				expect(result.message).toBeUndefined();
			},
		);
	});

	it("is unavailable when clamd answers something else", async () => {
		await withServer(
			(socket) => {
				socket.once("data", () => socket.write("UNKNOWN\0"));
			},
			async (port) => {
				const result = await createClamavProbe({
					connection: { host: "127.0.0.1", port },
					secrets: [],
				}).probe(new AbortController().signal);

				expect(result.status).toBe("unavailable");
				expect(result.message).toBe("réponse inattendue de clamd");
			},
		);
	});

	it("is unavailable and leaks no host when the connection is refused", async () => {
		const port = await refusedPort();
		const result = await createClamavProbe({
			connection: { host: "127.0.0.1", port },
			secrets: [],
		}).probe(new AbortController().signal);

		expect(result.status).toBe("unavailable");
		expect(result.message).toBe("connexion refusée");
		expect(result.message).not.toContain("127.0.0.1");
	});

	it("is unavailable when clamd never answers", async () => {
		await withServer(
			() => undefined,
			async (port) => {
				const result = await createClamavProbe({
					connection: { host: "127.0.0.1", port },
					secrets: [],
					timeoutMs: 50,
				}).probe(AbortSignal.timeout(50));

				expect(result.status).toBe("unavailable");
			},
		);
	});

	it("is unavailable when clamd closes without replying", async () => {
		await withServer(
			(socket) => {
				socket.once("data", () => socket.end());
			},
			async (port) => {
				const result = await createClamavProbe({
					connection: { host: "127.0.0.1", port },
					secrets: [],
				}).probe(new AbortController().signal);

				expect(result.status).toBe("unavailable");
			},
		);
	});

	it("is operational with 'non configuré' when CLAMAV_HOST is absent", async () => {
		const result = await createClamavProbe({
			connection: null,
			secrets: [],
		}).probe(new AbortController().signal);

		expect(result).toEqual({
			status: "operational",
			latencyMs: 0,
			message: "non configuré",
		});
	});
});
