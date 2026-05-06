import { getDefaultCampaignDeadlines } from "~/modules/domain";

import { type DraftPayload, draftPayloadSchema } from "./draftSchema";

const STORAGE_KEY_PREFIX = "egapro:declaration-draft:";
const DRAFT_TTL_MS = 30 * 24 * 3600 * 1000;

function getStorage(): Storage | null {
	if (typeof window === "undefined") return null;
	return window.localStorage;
}

function getStorageKey(userId: string, siren: string, year: number): string {
	return `${STORAGE_KEY_PREFIX}${userId}:${siren}:${year}`;
}

function isExpired(payload: DraftPayload, now: number): boolean {
	if (now - payload.timestamp > DRAFT_TTL_MS) return true;
	const deadline = getDefaultCampaignDeadlines(
		payload.year,
	).decl1ModificationDeadline;
	return now > deadline.getTime();
}

export function readDraft(
	userId: string,
	siren: string,
	year: number,
): DraftPayload | null {
	const storage = getStorage();
	if (!storage) return null;
	const key = getStorageKey(userId, siren, year);
	const raw = storage.getItem(key);
	if (raw === null) return null;
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		storage.removeItem(key);
		return null;
	}
	const result = draftPayloadSchema.safeParse(parsed);
	if (!result.success) {
		storage.removeItem(key);
		return null;
	}
	if (isExpired(result.data, Date.now())) {
		storage.removeItem(key);
		return null;
	}
	return result.data;
}

export function writeDraft(
	userId: string,
	siren: string,
	year: number,
	payload: DraftPayload,
): void {
	const storage = getStorage();
	if (!storage) return;
	storage.setItem(getStorageKey(userId, siren, year), JSON.stringify(payload));
}

export function clearDraft(userId: string, siren: string, year: number): void {
	const storage = getStorage();
	if (!storage) return;
	storage.removeItem(getStorageKey(userId, siren, year));
}
