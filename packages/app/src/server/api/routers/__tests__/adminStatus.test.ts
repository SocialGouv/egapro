import { describe, expect, it, vi } from "vitest";

import type { DB } from "~/server/db";

const { logAction } = vi.hoisted(() => ({ logAction: vi.fn() }));

vi.mock("~/server/audit/log", () => ({ logAction }));
vi.mock("~/server/db", () => ({ db: {} }));

const adminSession = {
	user: {
		id: "admin-1",
		email: "[EMAIL_REDACTED]",
		isAdmin: true,
		adminMfaAt: Math.floor(Date.now() / 1000),
	},
	expires: "",
};

function buildDb() {
	const now = new Date();
	const probes = [
		{
			key: "postgres-app",
			label: "PostgreSQL (application)",
			criticality: "critical" as const,
			kind: "internal" as const,
			intervalSeconds: 60,
			status: "operational" as const,
			latencyMs: 4,
			checkedAt: now,
			changedAt: now,
			lastError: null,
			nextExpectedAt: null,
			lastSuccessAt: null,
			lastFailureAt: null,
		},
	];

	let selectCall = 0;
	const select = vi.fn(() => {
		selectCall++;
		if (selectCall === 1) {
			return { from: vi.fn(() => Promise.resolve(probes)) };
		}
		return {
			from: vi.fn().mockReturnThis(),
			innerJoin: vi.fn().mockReturnThis(),
			where: vi.fn().mockReturnThis(),
			orderBy: vi.fn().mockReturnThis(),
			limit: vi.fn(() => Promise.resolve([])),
		};
	});

	return { db: { select } as unknown as DB, select };
}

async function caller(db: DB, session: unknown = adminSession) {
	const { createTRPCRouter, createCallerFactory } = await import(
		"~/server/api/trpc"
	);
	const { adminStatusRouter } = await import("../adminStatus");
	// Mounted under its real name so the audit middleware recognises the
	// `adminStatus.getOverview` path, without pulling the whole app router in.
	return createCallerFactory(
		createTRPCRouter({ adminStatus: adminStatusRouter }),
	)({
		db,
		session,
		headers: new Headers(),
	} as never);
}

describe("adminStatus.getOverview", () => {
	it("refuses an authenticated user who is not an administrator", async () => {
		const { db, select } = buildDb();

		const adminCaller = await caller(db, {
			...adminSession,
			user: { ...adminSession.user, isAdmin: false },
		});

		await expect(adminCaller.adminStatus.getOverview()).rejects.toMatchObject({
			code: "FORBIDDEN",
		});
		expect(select).not.toHaveBeenCalled();
	});

	it("refuses an administrator whose second factor expired", async () => {
		const { db } = buildDb();

		const adminCaller = await caller(db, {
			...adminSession,
			user: { ...adminSession.user, adminMfaAt: 0 },
		});

		await expect(adminCaller.adminStatus.getOverview()).rejects.toMatchObject({
			code: "FORBIDDEN",
		});
	});

	it("returns the overview for an administrator", async () => {
		const { db } = buildDb();

		const overview = await (await caller(db)).adminStatus.getOverview();

		expect(overview.probes).toHaveLength(1);
		expect(overview.summary.supervisionLost).toBe(false);
		expect(overview.staleAfterSeconds).toBe(300);
	});

	it("does not audit the overview, which the page polls every 30 seconds", async () => {
		logAction.mockClear();
		const { db } = buildDb();

		await (await caller(db)).adminStatus.getOverview();

		expect(logAction).not.toHaveBeenCalled();
	});
});
