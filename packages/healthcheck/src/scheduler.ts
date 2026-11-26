import { startTimer } from "./probes/timing.js";
import type { Probe, ProbeResult } from "./probes/types.js";
import { sanitizeMessage } from "./sanitize.js";

export type ProbeSchedulerOptions = {
	probes: readonly Probe[];
	onResult(
		probe: Probe,
		result: ProbeResult,
		checkedAt: Date,
	): Promise<void> | void;
	onError?(probe: Probe, error: unknown): void;
	now?: () => Date;
};

export type ProbeScheduler = {
	start(): void;
	stop(): Promise<void>;
};

export function createScheduler({
	probes,
	onResult,
	onError,
	now = () => new Date(),
}: ProbeSchedulerOptions): ProbeScheduler {
	const controller = new AbortController();
	let loops: Promise<void>[] = [];

	async function runProbe(probe: Probe): Promise<void> {
		const checkedAt = now();
		const elapsed = startTimer();
		const signal = AbortSignal.any([
			controller.signal,
			AbortSignal.timeout(probe.timeoutMs),
		]);

		let result: ProbeResult;
		try {
			result = await raceAbort(probe.probe(signal), signal, probe.timeoutMs);
		} catch (error) {
			if (controller.signal.aborted) return;
			result = {
				status: "unavailable",
				latencyMs: elapsed(),
				message: sanitizeMessage(error),
			};
		}

		try {
			await onResult(probe, result, checkedAt);
		} catch (error) {
			onError?.(probe, error);
		}
	}

	async function loop(probe: Probe): Promise<void> {
		while (!controller.signal.aborted) {
			await runProbe(probe);
			if (controller.signal.aborted) return;
			await wait(probe.intervalSeconds * 1000, controller.signal);
		}
	}

	return {
		start() {
			loops = probes.map(loop);
		},
		async stop() {
			controller.abort();
			await Promise.allSettled(loops);
			loops = [];
		},
	};
}

function raceAbort<T>(
	promise: Promise<T>,
	signal: AbortSignal,
	timeoutMs: number,
): Promise<T> {
	if (signal.aborted) {
		return Promise.reject(new Error(`timeout after ${timeoutMs} ms`));
	}

	return new Promise<T>((resolve, reject) => {
		const onAbort = () => reject(new Error(`timeout after ${timeoutMs} ms`));
		signal.addEventListener("abort", onAbort, { once: true });
		promise.then(
			(value) => {
				signal.removeEventListener("abort", onAbort);
				resolve(value);
			},
			(error: unknown) => {
				signal.removeEventListener("abort", onAbort);
				reject(error);
			},
		);
	});
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
	return new Promise((resolve) => {
		if (signal.aborted) {
			resolve();
			return;
		}

		const finish = () => {
			clearTimeout(timer);
			signal.removeEventListener("abort", finish);
			resolve();
		};

		const timer = setTimeout(finish, ms);
		signal.addEventListener("abort", finish, { once: true });
	});
}
