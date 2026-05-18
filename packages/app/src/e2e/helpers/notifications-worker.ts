import { type ChildProcess, spawn } from "node:child_process";
import path from "node:path";

const NOTIFICATIONS_DATABASE_URL =
	process.env.NOTIFICATIONS_DATABASE_URL ??
	"postgresql://postgres:postgres@localhost:5439/egapro_notifications";
const DATABASE_URL =
	process.env.DATABASE_URL ??
	"postgresql://postgres:postgres@localhost:5438/egapro";

function workerCwd(): string {
	return path.resolve(process.cwd(), "..", "notifications");
}

export function spawnNotificationsWorker(): ChildProcess {
	const child = spawn("node", ["dist/index.js"], {
		cwd: workerCwd(),
		env: {
			...process.env,
			NOTIFICATIONS_DATABASE_URL,
			DATABASE_URL,
			MAIL_ENABLED: "true",
			SMTP_HOST: process.env.SMTP_HOST ?? "localhost",
			SMTP_PORT: process.env.SMTP_PORT ?? "1025",
			SMTP_SECURE: "false",
			MAIL_FROM: process.env.MAIL_FROM ?? "no-reply@egapro.local",
		},
		stdio: "pipe",
	});
	child.stdout?.on("data", (chunk: Buffer) => {
		process.stdout.write(`[notif-worker] ${chunk.toString()}`);
	});
	child.stderr?.on("data", (chunk: Buffer) => {
		process.stderr.write(`[notif-worker] ${chunk.toString()}`);
	});
	return child;
}

export async function waitForWorkerReady(
	worker: ChildProcess,
	timeoutMs = 15_000,
): Promise<void> {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			reject(
				new Error(`Worker did not log "pg-boss started" in ${timeoutMs}ms`),
			);
		}, timeoutMs);
		const onData = (chunk: Buffer) => {
			if (chunk.toString().includes("pg-boss started")) {
				clearTimeout(timer);
				worker.stdout?.off("data", onData);
				resolve();
			}
		};
		worker.stdout?.on("data", onData);
		worker.once("exit", (code) => {
			clearTimeout(timer);
			reject(new Error(`Worker exited early with code ${code}`));
		});
	});
}

export async function killWorker(worker: ChildProcess): Promise<void> {
	if (worker.killed || worker.exitCode !== null) return;
	await new Promise<void>((resolve) => {
		const timer = setTimeout(() => {
			worker.kill("SIGKILL");
			resolve();
		}, 5_000);
		worker.once("exit", () => {
			clearTimeout(timer);
			resolve();
		});
		worker.kill("SIGTERM");
	});
}

export function isMailFlowEnabled(): boolean {
	return process.env.MAIL_ENABLED === "true";
}
