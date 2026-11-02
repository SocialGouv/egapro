import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	auth: vi.fn(),
	resolveAuthorizedSiren: vi.fn(),
	select: vi.fn(),
	companyGet: vi.fn(),
	fileGet: vi.fn(),
	notFound: vi.fn(() => {
		throw new Error("NEXT_NOT_FOUND");
	}),
}));

vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));
vi.mock("~/server/auth", () => ({ auth: mocks.auth }));
vi.mock("~/server/auth/companyAccess", () => ({
	resolveAuthorizedSiren: mocks.resolveAuthorizedSiren,
}));
vi.mock("~/server/db", () => ({ db: { select: mocks.select } }));
vi.mock("~/trpc/server", () => ({
	api: {
		company: { get: mocks.companyGet },
		jointEvaluation: { getFile: mocks.fileGet },
	},
}));
vi.mock("../JointEvaluationView", () => ({
	JointEvaluationView: (props: Record<string, unknown>) => props,
}));

import { JointEvaluationViewPage } from "../JointEvaluationViewPage";

function queueSelect(rows: unknown[]) {
	const chain = {
		from: vi.fn(),
		where: vi.fn(),
		orderBy: vi.fn(),
		limit: vi.fn(),
	};
	chain.from.mockReturnValue(chain);
	chain.where.mockReturnValue(chain);
	chain.orderBy.mockReturnValue(chain);
	chain.limit.mockResolvedValue(rows);
	mocks.select.mockReturnValueOnce(chain);
}

const declaration = {
	id: "declaration-1",
	declarantId: "declarant-1",
	year: 2027,
	secondDeclReferencePeriodStart: "2026-02-01",
	secondDeclReferencePeriodEnd: "2027-01-31",
};

describe("JointEvaluationViewPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.auth.mockResolvedValue({ user: { id: "declarant-1" } });
		mocks.resolveAuthorizedSiren.mockResolvedValue("123456789");
	});

	it("does not reveal a report without its transmission event", async () => {
		queueSelect([declaration]);
		queueSelect([]);
		await expect(JointEvaluationViewPage()).rejects.toThrow("NEXT_NOT_FOUND");
		expect(mocks.fileGet).not.toHaveBeenCalled();
	});

	it("does not reveal a transmitted report if its active file is missing", async () => {
		queueSelect([declaration]);
		queueSelect([{ createdAt: new Date("2027-04-03T12:00:00Z"), round: 2 }]);
		queueSelect([
			{
				firstName: "Marie",
				lastName: "Dupont",
				email: "marie@example.fr",
				phone: null,
			},
		]);
		mocks.companyGet.mockResolvedValue({ siren: "123456789" });
		mocks.fileGet.mockResolvedValue(null);
		await expect(JointEvaluationViewPage()).rejects.toThrow("NEXT_NOT_FOUND");
	});

	it("does not associate an old submission with a later draft replacement file", async () => {
		queueSelect([declaration]);
		queueSelect([{ createdAt: new Date("2027-04-03T12:00:00Z"), round: 1 }]);
		queueSelect([
			{
				firstName: "Marie",
				lastName: "Dupont",
				email: "marie@example.fr",
				phone: null,
			},
		]);
		mocks.companyGet.mockResolvedValue({ siren: "123456789" });
		mocks.fileGet.mockResolvedValue({
			id: "unsubmitted-replacement",
			fileName: "rapport-second-tour.pdf",
			uploadedAt: new Date("2027-04-04T10:00:00Z"),
		});
		await expect(JointEvaluationViewPage()).rejects.toThrow("NEXT_NOT_FOUND");
	});

	it("uses the second round reference period after the second round submission", async () => {
		queueSelect([declaration]);
		queueSelect([{ createdAt: new Date("2027-04-03T12:00:00Z"), round: 2 }]);
		queueSelect([
			{
				firstName: "Marie",
				lastName: "Dupont",
				email: "marie@example.fr",
				phone: null,
			},
		]);
		mocks.companyGet.mockResolvedValue({ siren: "123456789" });
		mocks.fileGet.mockResolvedValue({
			id: "file-1",
			fileName: "rapport.pdf",
			uploadedAt: new Date("2027-04-02T10:00:00Z"),
		});
		const element = await JointEvaluationViewPage();
		expect(element.props.referencePeriod).toBe("01/02/2026 - 31/01/2027");
		expect(element.props.file.id).toBe("file-1");
	});
});
