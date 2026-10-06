import { vi } from "vitest";

/**
 * In-memory stand-in for the shared Valkey client, covering the commands the
 * server code issues: GET/SET for the export cache, and the counter scripts —
 * INCR for the rate limiter, INCRBY `arguments[0]` for the export cache budget
 * — which both return the counter after incrementing it.
 */
export function createFakeValkey() {
	const store = new Map<string, string>();
	const counters = new Map<string, number>();
	return {
		store,
		get: vi.fn(async (key: string) => store.get(key) ?? null),
		set: vi.fn(async (key: string, value: string) => {
			store.set(key, value);
			return "OK";
		}),
		eval: vi.fn(
			async (
				script: string,
				options: { keys: string[]; arguments: string[] },
			) => {
				const key = options.keys[0] ?? "";
				const step = script.includes("INCRBY")
					? Number(options.arguments[0])
					: 1;
				const used = (counters.get(key) ?? 0) + step;
				counters.set(key, used);
				return used;
			},
		),
	};
}
