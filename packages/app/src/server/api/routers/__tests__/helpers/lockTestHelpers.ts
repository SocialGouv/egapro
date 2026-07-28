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
	/**
	 * Declaration status returned to the `declarationModifiableWriteProcedure`
	 * deadline guard (`select({ status, year, secondDeclarationStep,
	 * secondDeclarationPathChoice })`). Defaults to `"draft"`, which makes the
	 * guard a no-op (it only checks the deadline for submitted declarations).
	 * Override to a submitted status to exercise the guard.
	 */
	declarationStatus?: string;
	/** Declaration year fed to the deadline guard (only read when not draft). */
	declarationYear?: number;
	/**
	 * Second-declaration signal fed to the deadline guard. Since the guard now
	 * routes the applicable deadline through
	 * `isSecondDeclarationDeadlineApplicable`, these disambiguate the terminal
	 * states (`awaiting_cse_opinion` / `demarche_completed`) between round 1 and
	 * round 2. Default null → phase-1 for those states.
	 */
	secondDeclarationStep?: number | null;
	secondDeclarationPathChoice?:
		| "justify"
		| "corrective_action"
		| "joint_evaluation"
		| null;
};

// Fixed fallback year for the deadline-guard mock. Irrelevant while the status
// is "draft" (the guard short-circuits before reading the year / deadline).
const GUARD_FALLBACK_YEAR = 2024;

/**
 * Wrap a test's bespoke mock db so the two middleware selects that
 * `declarationLockedWriteProcedure` runs on `ctx.db` are answered before the
 * handler's own queries. The middleware always issues, in order: the
 * current-year declaration lookup (`fetchCurrentDeclarationId`, a plain
 * select) followed by the active-lock lookup (`getActiveLock`, the only select
 * that calls `.innerJoin`). Both are served here. Mutations on
 * `declarationModifiableWriteProcedure` add a third middleware select — the
 * deadline guard `select({ status, year, secondDeclarationStep,
 * secondDeclarationPathChoice })` — which is also served here (detected by its
 * projection, defaulting to a draft no-op). Every other call — the handler's
 * `transaction`, `update`, `insert`, `delete`, and any later top-level
 * `select` — is delegated to the inner db untouched.
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
		// declarationModifiableWriteProcedure deadline guard: a top-level
		// `select({ status, year, secondDeclarationStep,
		// secondDeclarationPathChoice })` issued after the two lock-middleware
		// selects. Detected by its distinctive projection (status + year, unique
		// across the router + middlewares) rather than by call order, so it stays
		// robust whether the procedure under test is 2-select (locked) or 3-select
		// (modifiable). Defaulting to "draft" makes the guard a no-op.
		const cols = args[0];
		if (cols && typeof cols === "object" && !Array.isArray(cols)) {
			const keys = Object.keys(cols as Record<string, unknown>);
			if (keys.includes("status") && keys.includes("year")) {
				const limit = vi.fn().mockResolvedValue([
					{
						status: options.declarationStatus ?? "draft",
						year: options.declarationYear ?? GUARD_FALLBACK_YEAR,
						secondDeclarationStep: options.secondDeclarationStep ?? null,
						secondDeclarationPathChoice:
							options.secondDeclarationPathChoice ?? null,
					},
				]);
				const where = vi.fn().mockReturnValue({ limit });
				const from = vi.fn().mockReturnValue({ where });
				return { from };
			}
		}

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
