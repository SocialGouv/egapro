import { beforeEach, describe, expect, it, vi } from "vitest";
import { cseOpinions, declarations, files } from "~/server/db/schema";
import {
	buildFormalNoticeFacts,
	FORMAL_NOTICE_ACTION,
	type FormalNoticeDeclaration,
	findFormalNoticeFile,
	isFormalNoticeAvailable,
	isFormalNoticeAvailableFor,
	loadGapCseOpinions,
	loadGapCseOpinionsFor,
} from "../formalNoticeExposure";

type GapOpinionRow = {
	declarationId: string;
	declarationNumber: number;
	opinion: string | null;
};

type FileRow = { id: string; fileName: string; uploadedAt: Date };

type TableRows = {
	declarations?: FormalNoticeDeclaration[];
	cseOpinions?: GapOpinionRow[];
	files?: FileRow[];
};

function makeDb(rows: TableRows = {}) {
	const rowsFor = (table: unknown): unknown[] => {
		if (table === declarations) return rows.declarations ?? [];
		if (table === cseOpinions) return rows.cseOpinions ?? [];
		if (table === files) return rows.files ?? [];
		throw new Error("unexpected table");
	};
	const from = vi.fn((table: unknown) => ({
		where: vi.fn(() => {
			const result = Promise.resolve(rowsFor(table));
			return Object.assign(result, { limit: vi.fn(() => result) });
		}),
	}));
	const select = vi.fn(() => ({ from }));
	return { db: { select } as never, select, from };
}

function declaration(
	overrides: Partial<FormalNoticeDeclaration> = {},
): FormalNoticeDeclaration {
	return {
		id: "decl-1",
		status: "demarche_completed",
		rulesVersion: "2027.1",
		cseRequired: true,
		firstDeclarationPathChoice: "justify",
		secondDeclarationPathChoice: null,
		...overrides,
	};
}

const UNFAVORABLE_FIRST = { first: "unfavorable", second: null };
const NO_OPINIONS = { first: null, second: null };

beforeEach(() => {
	vi.clearAllMocks();
});

describe("FORMAL_NOTICE_ACTION", () => {
	it("names the ruleset action of the formal notice submission", () => {
		expect(FORMAL_NOTICE_ACTION).toBe("submit_formal_notice_joint_evaluation");
	});
});

describe("buildFormalNoticeFacts", () => {
	it("maps the declaration and both gap opinions onto the engine facts", () => {
		expect(
			buildFormalNoticeFacts(
				declaration({
					cseRequired: false,
					firstDeclarationPathChoice: "corrective_action",
					secondDeclarationPathChoice: "justify",
				}),
				{ first: "favorable", second: "unfavorable" },
			),
		).toEqual({
			currentState: "demarche_completed",
			cseRequired: false,
			firstDeclarationPathChoice: "corrective_action",
			secondDeclarationPathChoice: "justify",
			firstDeclarationGapCseOpinion: "favorable",
			secondDeclarationGapCseOpinion: "unfavorable",
		});
	});
});

describe("isFormalNoticeAvailable", () => {
	it("is true for a justified, closed démarche with an unfavorable gap opinion", () => {
		expect(isFormalNoticeAvailable(declaration(), UNFAVORABLE_FIRST)).toBe(
			true,
		);
	});

	it("is true for a justified, closed démarche without CSE", () => {
		expect(
			isFormalNoticeAvailable(declaration({ cseRequired: false }), NO_OPINIONS),
		).toBe(true);
	});

	it("is false when the gap opinion is favorable", () => {
		expect(
			isFormalNoticeAvailable(declaration(), {
				first: "favorable",
				second: null,
			}),
		).toBe(false);
	});

	it("is false while the démarche is not closed", () => {
		expect(
			isFormalNoticeAvailable(
				declaration({ status: "awaiting_cse_opinion" }),
				UNFAVORABLE_FIRST,
			),
		).toBe(false);
	});

	it("is false for another compliance path", () => {
		expect(
			isFormalNoticeAvailable(
				declaration({
					cseRequired: false,
					firstDeclarationPathChoice: "joint_evaluation",
				}),
				NO_OPINIONS,
			),
		).toBe(false);
	});

	it("is false for an unknown rules version instead of throwing", () => {
		expect(
			isFormalNoticeAvailable(
				declaration({ rulesVersion: "9999.0" }),
				UNFAVORABLE_FIRST,
			),
		).toBe(false);
	});
});

describe("loadGapCseOpinions", () => {
	it("returns an empty map without querying when no declaration is given", async () => {
		const { db, select } = makeDb();

		const result = await loadGapCseOpinions(db, []);

		expect(result.size).toBe(0);
		expect(select).not.toHaveBeenCalled();
	});

	it("groups the gap opinions of each declaration by round in a single query", async () => {
		const { db, select } = makeDb({
			cseOpinions: [
				{ declarationId: "decl-1", declarationNumber: 1, opinion: "favorable" },
				{
					declarationId: "decl-1",
					declarationNumber: 2,
					opinion: "unfavorable",
				},
				{
					declarationId: "decl-2",
					declarationNumber: 2,
					opinion: "unfavorable",
				},
				{ declarationId: "decl-3", declarationNumber: 1, opinion: null },
			],
		});

		const result = await loadGapCseOpinions(db, ["decl-1", "decl-2", "decl-3"]);

		expect(select).toHaveBeenCalledTimes(1);
		expect(Object.fromEntries(result)).toEqual({
			"decl-1": { first: "favorable", second: "unfavorable" },
			"decl-2": { first: null, second: "unfavorable" },
			"decl-3": { first: null, second: null },
		});
	});

	it("leaves a declaration without gap opinion out of the map", async () => {
		const { db } = makeDb({ cseOpinions: [] });

		const result = await loadGapCseOpinions(db, ["decl-1"]);

		expect(result.has("decl-1")).toBe(false);
	});
});

describe("loadGapCseOpinionsFor", () => {
	it("returns the opinions of the declaration", async () => {
		const { db } = makeDb({
			cseOpinions: [
				{
					declarationId: "decl-1",
					declarationNumber: 1,
					opinion: "unfavorable",
				},
			],
		});

		expect(await loadGapCseOpinionsFor(db, "decl-1")).toEqual(
			UNFAVORABLE_FIRST,
		);
	});

	it("returns no opinion when none is recorded", async () => {
		const { db } = makeDb();

		expect(await loadGapCseOpinionsFor(db, "decl-1")).toEqual(NO_OPINIONS);
	});
});

describe("isFormalNoticeAvailableFor", () => {
	it("is true when the stored declaration and its gap opinions expose it", async () => {
		const { db } = makeDb({
			declarations: [declaration()],
			cseOpinions: [
				{
					declarationId: "decl-1",
					declarationNumber: 1,
					opinion: "unfavorable",
				},
			],
		});

		expect(await isFormalNoticeAvailableFor(db, "decl-1")).toBe(true);
	});

	it("is false when the stored gap opinion is favorable", async () => {
		const { db } = makeDb({
			declarations: [declaration()],
			cseOpinions: [
				{ declarationId: "decl-1", declarationNumber: 1, opinion: "favorable" },
			],
		});

		expect(await isFormalNoticeAvailableFor(db, "decl-1")).toBe(false);
	});

	it("is false without reading the opinions when the declaration does not exist", async () => {
		const { db, from } = makeDb();

		expect(await isFormalNoticeAvailableFor(db, "missing")).toBe(false);
		expect(from).toHaveBeenCalledTimes(1);
		expect(from).toHaveBeenCalledWith(declarations);
	});
});

describe("findFormalNoticeFile", () => {
	it("returns the deposited report", async () => {
		const file = {
			id: "file-1",
			fileName: "evaluation-mise-en-demeure.pdf",
			uploadedAt: new Date("2027-06-01T10:00:00Z"),
		};
		const { db, from } = makeDb({ files: [file] });

		expect(await findFormalNoticeFile(db, "decl-1")).toEqual(file);
		expect(from).toHaveBeenCalledWith(files);
	});

	it("returns null when no report was deposited", async () => {
		const { db } = makeDb();

		expect(await findFormalNoticeFile(db, "decl-1")).toBeNull();
	});
});
