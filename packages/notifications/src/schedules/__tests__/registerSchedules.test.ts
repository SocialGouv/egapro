import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { registerSchedules, SCHEDULES } from "../index.js";

type BossStub = {
	createQueue: ReturnType<typeof vi.fn>;
	work: ReturnType<typeof vi.fn>;
	schedule: ReturnType<typeof vi.fn>;
};

function buildBoss(): BossStub {
	return {
		createQueue: vi.fn().mockResolvedValue(undefined),
		work: vi.fn().mockResolvedValue(undefined),
		schedule: vi.fn().mockResolvedValue(undefined),
	};
}

describe("SCHEDULES", () => {
	it("declares the expected 8 schedules", () => {
		expect(SCHEDULES.length).toBe(8);
	});

	it("drives the deadline reminders from a single daily tick", () => {
		const tick = SCHEDULES.find(
			(s) => s.name === "reminder-deadline-daily-tick",
		);
		expect(tick).toBeDefined();
		expect(tick?.cron).toBe("0 8 * * *");
	});

	it("uses unique queue names", () => {
		const names = SCHEDULES.map((s) => s.name);
		expect(new Set(names).size).toBe(names.length);
	});

	it("uses Europe/Paris timezone for every schedule", () => {
		for (const schedule of SCHEDULES) {
			expect(schedule.timeZone).toBe("Europe/Paris");
		}
	});

	it("uses valid 5-field cron expressions", () => {
		for (const schedule of SCHEDULES) {
			const fields = schedule.cron.split(/\s+/);
			expect(fields.length).toBe(5);
			expect(schedule.cron).toMatch(/^[\d*,/-]+(\s+[\d*,/-]+){4}$/);
		}
	});

	it("includes the four CSE opinion reminder variants", () => {
		const names = SCHEDULES.map((s) => s.name);
		expect(names).toContain("reminder-cse-opinion-compliance");
		expect(names).toContain("reminder-cse-opinion-justify-oct");
		expect(names).toContain("reminder-cse-opinion-justify-dec");
		expect(names).toContain("reminder-cse-opinion-corrective");
		expect(names).toContain("reminder-cse-opinion-joint-eval");
	});
});

describe("registerSchedules", () => {
	let warnSpy: ReturnType<typeof vi.spyOn>;
	let logSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
	});

	afterEach(() => {
		warnSpy.mockRestore();
		logSpy.mockRestore();
	});

	it("disables reminders and warns when DATABASE_URL is missing", async () => {
		const boss = buildBoss();
		await registerSchedules(
			boss as unknown as Parameters<typeof registerSchedules>[0],
			null,
		);
		expect(boss.createQueue).not.toHaveBeenCalled();
		expect(boss.work).not.toHaveBeenCalled();
		expect(boss.schedule).not.toHaveBeenCalled();
		expect(warnSpy).toHaveBeenCalledWith(
			expect.stringContaining("reminders disabled"),
		);
	});

	it("registers all schedules with timezone and cron", async () => {
		const boss = buildBoss();
		const fakeSql = {} as unknown as Parameters<typeof registerSchedules>[1];
		await registerSchedules(
			boss as unknown as Parameters<typeof registerSchedules>[0],
			fakeSql,
		);
		expect(boss.createQueue).toHaveBeenCalledTimes(SCHEDULES.length);
		expect(boss.work).toHaveBeenCalledTimes(SCHEDULES.length);
		expect(boss.schedule).toHaveBeenCalledTimes(SCHEDULES.length);
		for (const schedule of SCHEDULES) {
			expect(boss.schedule).toHaveBeenCalledWith(
				schedule.name,
				schedule.cron,
				{},
				{ tz: "Europe/Paris" },
			);
		}
	});
});
