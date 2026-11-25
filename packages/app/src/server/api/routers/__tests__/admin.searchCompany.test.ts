import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/server/auth", () => ({ auth: vi.fn() }));
vi.mock("~/server/db", () => ({ db: {} }));
vi.mock("~/server/services/weez");

const CURRENT_YEAR = 2031;
const SIREN = "123456789";

const WEEZ_COMPANY = {
	name: "Société Démo",
	address: "1 rue de la Démo",
	nafCode: "62.01Z",
	nafLabel: "Programmation informatique",
	region: null,
	departmentCode: null,
	departmentLabel: null,
	countryCode: null,
	countryLabel: "FRANCE",
	// Weez/INSEE headcount, deliberately far from the GIP one.
	workforce: 500,
	statutDiffusion: null,
};

type GipRow = { workforceEma: string | null };

type StoredCompanyRow = {
	siren: string;
	name: string;
	address: string | null;
	countryCode: string | null;
	countryLabel: string | null;
	departmentLabel: string | null;
	nafCode: string | null;
};

function buildDb(gipRows: GipRow[], storedRows: StoredCompanyRow[] = []) {
	const gipLimit = vi.fn().mockResolvedValue(gipRows);
	const gipWhere = vi.fn().mockReturnValue({ limit: gipLimit });
	const gipFrom = vi.fn().mockReturnValue({ where: gipWhere });

	const storedLimit = vi.fn().mockResolvedValue(storedRows);
	const storedWhere = vi.fn().mockReturnValue({ limit: storedLimit });
	const storedFrom = vi.fn().mockReturnValue({ where: storedWhere });

	const select = vi
		.fn()
		.mockReturnValueOnce({ from: gipFrom })
		.mockReturnValueOnce({ from: storedFrom });

	return { select, __gipLimit: gipLimit, __storedLimit: storedLimit };
}

const STORED_COMPANY: StoredCompanyRow = {
	siren: SIREN,
	name: "Société Démo",
	address: "1 rue de la Démo",
	countryCode: null,
	countryLabel: "FRANCE",
	departmentLabel: null,
	nafCode: "62.01Z",
};

async function callSearchCompany(
	gipRows: Array<{ workforceEma: string | null }>,
	storedRows: StoredCompanyRow[] = [],
) {
	const { adminRouter } = await import("../admin");
	const caller = adminRouter.createCaller({
		db: buildDb(gipRows, storedRows),
		session: {
			user: {
				id: "admin-1",
				email: "admin@example.fr",
				isAdmin: true,
				adminMfaAt: Math.floor(Date.now() / 1000),
			},
			expires: "",
		},
		headers: new Headers(),
	} as never);
	return caller.searchCompany({ siren: SIREN });
}

describe("adminRouter.searchCompany", () => {
	beforeEach(async () => {
		vi.useFakeTimers({ toFake: ["Date"] });
		vi.setSystemTime(new Date(`${CURRENT_YEAR}-06-15T12:00:00Z`));
		const { fetchCompanyBySiren } = await import("~/server/services/weez");
		vi.mocked(fetchCompanyBySiren).mockResolvedValue(WEEZ_COMPANY);
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it("rejects a non-admin caller", async () => {
		const { adminRouter } = await import("../admin");
		const caller = adminRouter.createCaller({
			db: buildDb([]),
			session: {
				user: { id: "u", email: "u@example.fr", isAdmin: false },
				expires: "",
			},
			headers: new Headers(),
		} as never);

		await expect(caller.searchCompany({ siren: SIREN })).rejects.toThrow();
	});

	it("keeps the identity fields on Weez", async () => {
		const result = await callSearchCompany([{ workforceEma: "120.00" }]);

		expect(result).toMatchObject({
			siren: SIREN,
			name: WEEZ_COMPANY.name,
			address: WEEZ_COMPANY.address,
			nafCode: WEEZ_COMPANY.nafCode,
		});
	});

	it("reads the headcount from the GIP file, not from Weez", async () => {
		const result = await callSearchCompany([{ workforceEma: "120.00" }]);

		expect(result.workforce).toBe(120);
		expect(result.workforce).not.toBe(WEEZ_COMPANY.workforce);
	});

	it("floors the numeric(9,2) GIP headcount so 99,97 never reads as 100", async () => {
		const result = await callSearchCompany([{ workforceEma: "99.97" }]);

		expect(result.workforce).toBe(99);
	});

	// The back-office is not a user-facing surface: the agent instructing the
	// case needs the exact figure, never the `< 50` bracket.
	it("returns the exact headcount of a voluntary-tier company", async () => {
		const result = await callSearchCompany([{ workforceEma: "37.00" }]);

		expect(result.workforce).toBe(37);
	});

	it("returns a null headcount when the company is absent from the GIP file", async () => {
		const result = await callSearchCompany([]);

		expect(result.workforce).toBeNull();
	});

	it("returns a null headcount when the GIP row carries no workforce", async () => {
		const result = await callSearchCompany([{ workforceEma: null }]);

		expect(result.workforce).toBeNull();
	});

	it("dates the headcount with the current campaign year", async () => {
		const result = await callSearchCompany([{ workforceEma: "120.00" }]);

		expect(result.workforceYear).toBe(CURRENT_YEAR);
	});

	it("reads a single GIP row", async () => {
		const db = buildDb([{ workforceEma: "120.00" }]);
		const { adminRouter } = await import("../admin");
		const caller = adminRouter.createCaller({
			db,
			session: {
				user: {
					id: "admin-1",
					email: "admin@example.fr",
					isAdmin: true,
					adminMfaAt: Math.floor(Date.now() / 1000),
				},
				expires: "",
			},
			headers: new Headers(),
		} as never);

		await caller.searchCompany({ siren: SIREN });

		expect(db.__gipLimit).toHaveBeenCalledWith(1);
	});

	it("rejects an unknown SIREN with NOT_FOUND", async () => {
		const { fetchCompanyBySiren } = await import("~/server/services/weez");
		vi.mocked(fetchCompanyBySiren).mockResolvedValue(null);

		await expect(callSearchCompany([])).rejects.toMatchObject({
			code: "NOT_FOUND",
		});
	});

	it("wraps a Weez outage into an internal error when nothing is stored locally", async () => {
		const { fetchCompanyBySiren } = await import("~/server/services/weez");
		vi.mocked(fetchCompanyBySiren).mockRejectedValue(new Error("Weez down"));
		vi.spyOn(console, "error").mockImplementation(() => undefined);

		await expect(callSearchCompany([])).rejects.toMatchObject({
			code: "INTERNAL_SERVER_ERROR",
			message: expect.stringContaining(
				"registre national des entreprises est momentanément indisponible",
			),
		});
	});

	it("serves the stored identity when Weez is unreachable", async () => {
		const { fetchCompanyBySiren } = await import("~/server/services/weez");
		vi.mocked(fetchCompanyBySiren).mockRejectedValue(new Error("Weez down"));
		vi.spyOn(console, "error").mockImplementation(() => undefined);

		const result = await callSearchCompany(
			[{ workforceEma: "120.00" }],
			[STORED_COMPANY],
		);

		expect(result).toMatchObject({
			siren: SIREN,
			name: STORED_COMPANY.name,
			address: STORED_COMPANY.address,
			nafCode: STORED_COMPANY.nafCode,
			countryLabel: STORED_COMPANY.countryLabel,
			workforce: 120,
			workforceYear: CURRENT_YEAR,
			identityUnavailable: false,
		});
	});

	it("flags the stored placeholder when Weez is unreachable and the identity was never resolved", async () => {
		const { fetchCompanyBySiren } = await import("~/server/services/weez");
		vi.mocked(fetchCompanyBySiren).mockRejectedValue(new Error("Weez down"));
		vi.spyOn(console, "error").mockImplementation(() => undefined);

		const result = await callSearchCompany(
			[],
			[
				{
					siren: SIREN,
					name: `Entreprise ${SIREN}`,
					address: null,
					countryCode: null,
					countryLabel: null,
					departmentLabel: null,
					nafCode: null,
				},
			],
		);

		expect(result.identityUnavailable).toBe(true);
	});

	it("never reads the stored row when Weez answered", async () => {
		const db = buildDb([]);
		const { adminRouter } = await import("../admin");
		const caller = adminRouter.createCaller({
			db,
			session: {
				user: {
					id: "admin-1",
					email: "[EMAIL_REDACTED]",
					isAdmin: true,
					adminMfaAt: Math.floor(Date.now() / 1000),
				},
				expires: "",
			},
			headers: new Headers(),
		} as never);

		const result = await caller.searchCompany({ siren: SIREN });

		expect(db.__storedLimit).not.toHaveBeenCalled();
		expect(result).toMatchObject({ identityUnavailable: false });
	});
});
