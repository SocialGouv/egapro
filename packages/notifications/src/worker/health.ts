import {
	createServer,
	type IncomingMessage,
	type ServerResponse,
} from "node:http";
import type { Sql } from "postgres";

const READINESS_DEADLINE_MS = 2000;

export type HealthServer = {
	port: number;
	close: () => Promise<void>;
};

export type HealthServerOptions = {
	port: number;
	checkQueueDb: () => Promise<boolean>;
	host?: string;
};

/**
 * Reads `NOTIFICATIONS_HEALTH_PORT`. Absent or invalid → `null`, and the worker
 * starts without a listener: a bare `node dist/index.js` (local run, E2E
 * helper) must not compete for a port. Kubernetes deployments set it
 * explicitly, next to the probes that consume it.
 */
export function resolveHealthPort(raw: string | undefined): number | null {
	if (!raw) return null;

	const port = Number.parseInt(raw, 10);
	return Number.isInteger(port) && port > 0 && port < 65_536 ? port : null;
}

export async function startHealthServer({
	port,
	checkQueueDb,
	host = "0.0.0.0",
}: HealthServerOptions): Promise<HealthServer> {
	const server = createServer((request, response) => {
		void handleRequest(request, response, checkQueueDb);
	});

	await new Promise<void>((resolve, reject) => {
		const onError = (error: Error) => reject(error);
		server.once("error", onError);
		server.listen(port, host, () => {
			server.off("error", onError);
			resolve();
		});
	});

	const address = server.address();
	return {
		port: typeof address === "object" && address !== null ? address.port : port,
		close: () =>
			new Promise<void>((resolve) => {
				server.close(() => resolve());
				server.closeAllConnections();
			}),
	};
}

// The queue database only: a broken SMTP relay must not pull the worker out of
// the service — pg-boss retries the jobs until the relay comes back.
export function createQueueDbCheck(
	sql: Sql,
	deadlineMs = READINESS_DEADLINE_MS,
): () => Promise<boolean> {
	return async () => {
		try {
			await withDeadline(sql`SELECT 1`, deadlineMs);
			return true;
		} catch {
			return false;
		}
	};
}

async function handleRequest(
	request: IncomingMessage,
	response: ServerResponse,
	checkQueueDb: () => Promise<boolean>,
): Promise<void> {
	try {
		if (request.method !== "GET") {
			response.writeHead(405).end();
			return;
		}

		const path = (request.url ?? "/").split("?")[0];

		if (path === "/healthz") {
			response.writeHead(200, { "Content-Type": "text/plain" }).end("OK");
			return;
		}

		if (path === "/readyz") {
			const ready = await checkQueueDb();
			response
				.writeHead(ready ? 200 : 503, { "Content-Type": "text/plain" })
				.end(ready ? "OK" : "unavailable");
			return;
		}

		response.writeHead(404).end();
	} catch {
		if (!response.headersSent) response.writeHead(500);
		response.end();
	}
}

function withDeadline<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const timer = setTimeout(
			() => reject(new Error("readiness deadline exceeded")),
			ms,
		);
		promise.then(
			(value) => {
				clearTimeout(timer);
				resolve(value);
			},
			(error: unknown) => {
				clearTimeout(timer);
				reject(error);
			},
		);
	});
}
