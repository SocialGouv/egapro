import { vi } from "vitest";

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
				_script: string,
				options: { keys: string[]; arguments: string[] },
			) => {
				const key = options.keys[0] ?? "";
				const used =
					(counters.get(key) ?? 0) + Number(options.arguments[0] ?? 0);
				counters.set(key, used);
				return used;
			},
		),
	};
}

export function mockValkeyModule(exportCacheClient: () => Promise<unknown>) {
	return {
		exportCacheValkey: { client: exportCacheClient, discard: vi.fn() },
		rateLimitValkey: { client: async () => null, discard: vi.fn() },
		withValkeyTimeout: <T>(promise: Promise<T>) => promise,
	};
}
