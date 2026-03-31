import type { ExportRow } from "./types";

export type CseOpinionRow = {
	type: string;
	opinion: string | null;
	opinionDate: string | null;
};

// ── CSE opinions ─────────────────────────────────────────────────────

type CseFields = Pick<
	ExportRow,
	| "cseOpinion1Type"
	| "cseOpinion1Opinion"
	| "cseOpinion1Date"
	| "cseOpinion2Type"
	| "cseOpinion2Opinion"
	| "cseOpinion2Date"
	| "cseOpinion3Type"
	| "cseOpinion3Opinion"
	| "cseOpinion3Date"
	| "cseOpinion4Type"
	| "cseOpinion4Opinion"
	| "cseOpinion4Date"
>;

export function mapCseOpinions(opinions: CseOpinionRow[]): CseFields {
	return {
		cseOpinion1Type: opinions[0]?.type ?? null,
		cseOpinion1Opinion: opinions[0]?.opinion ?? null,
		cseOpinion1Date: opinions[0]?.opinionDate ?? null,
		cseOpinion2Type: opinions[1]?.type ?? null,
		cseOpinion2Opinion: opinions[1]?.opinion ?? null,
		cseOpinion2Date: opinions[1]?.opinionDate ?? null,
		cseOpinion3Type: opinions[2]?.type ?? null,
		cseOpinion3Opinion: opinions[2]?.opinion ?? null,
		cseOpinion3Date: opinions[2]?.opinionDate ?? null,
		cseOpinion4Type: opinions[3]?.type ?? null,
		cseOpinion4Opinion: opinions[3]?.opinion ?? null,
		cseOpinion4Date: opinions[3]?.opinionDate ?? null,
	};
}
