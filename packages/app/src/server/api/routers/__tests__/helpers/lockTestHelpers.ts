import { vi } from "vitest";

export const LOCK_HOLDER_USER_ID = "user-1";

export const LOCK_DECLARATION_ID = "decl-1";

export type LockHolderOverrides = {
	userId?: string;
	expiresAt?: Date;
};

export function buildLockHolder(overrides: LockHolderOverrides = {}) {
	return {
		userId: overrides.userId ?? LOCK_HOLDER_USER_ID,
		email: "user-1@example.fr",
		firstName: "Alice",
		lastName: "Martin",
		expiresAt: overrides.expiresAt ?? new Date(Date.now() + 30 * 60_000),
	};
}

type LockOptions = {
	declarationId?: string;
	holder?: ReturnType<typeof buildLockHolder> | null;
};

/**
 * Wrap a test's bespoke mock db so the two middleware selects that
 * `declarationLockedWriteProcedure` runs on `ctx.db` are answered before the
 * handler's own queries. The middleware always issues, in order: the
 * current-year declaration lookup (`fetchCurrentDeclarationId`, a plain
 * select) followed by the active-lock lookup (`getActiveLock`, the only select
 * that calls `.innerJoin`). Both are served here; every other call — the
 * handler's `transaction`, `update`, `insert`, `delete`, and any later
 * top-level `select` — is delegated to the inner db untouched.
 */
export function withLockMiddleware(
	innerDb: unknown,
	options: LockOptions = {},
) {
	const declarationId = options.declarationId ?? LOCK_DECLARATION_ID;
	const holder =
		options.holder === undefined ? buildLockHolder() : options.holder;
	const inner = innerDb as Record<string, unknown>;

	let middlewareSelectIndex = 0;

	const select = vi.fn().mockImplementation((...args: unknown[]) => {
		const callIndex = middlewareSelectIndex;
		middlewareSelectIndex++;

		if (callIndex === 0) {
			// fetchCurrentDeclarationId: plain select → limit(1)
			const limit = vi.fn().mockResolvedValue([{ id: declarationId }]);
			const where = vi.fn().mockReturnValue({ limit });
			const from = vi.fn().mockReturnValue({ where });
			return { from };
		}

		if (callIndex === 1) {
			// getActiveLock: innerJoin → where → limit(1)
			const limit = vi.fn().mockResolvedValue(holder ? [holder] : []);
			const where = vi.fn().mockReturnValue({ limit });
			const innerJoin = vi.fn().mockReturnValue({ where });
			const from = vi.fn().mockReturnValue({ innerJoin });
			return { from };
		}

		const innerSelect = inner.select as
			| ((...a: unknown[]) => unknown)
			| undefined;
		if (!innerSelect) {
			throw new Error("withLockMiddleware: inner db has no select()");
		}
		return innerSelect(...args);
	});

	return new Proxy(inner, {
		get(target, prop, receiver) {
			if (prop === "select") return select;
			return Reflect.get(target, prop, receiver);
		},
	});
}
