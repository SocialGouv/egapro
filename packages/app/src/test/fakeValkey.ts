import { vi } from "vitest";

export function createFakeValkey() {
	const store = new Map<string, string>();
	return {
		store,
		get: vi.fn(async (key: string) => store.get(key) ?? null),
		set: vi.fn(async (key: string, value: string) => {
			store.set(key, value);
			return "OK";
		}),
	};
}

export function mockValkeyModule(exportCacheClient: () => Promise<unknown>) {
	return {
		exportCacheValkey: { client: exportCacheClient, discard: vi.fn() },
		rateLimitValkey: { client: async () => null, discard: vi.fn() },
		withValkeyTimeout: <T>(promise: Promise<T>) => promise,
	};
}
