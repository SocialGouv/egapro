import { type Browser, expect } from "@playwright/test";
import { TEST_SIREN } from "../constants";

// Dev gateway shared secret — the deterministic local value from `.env.example`.
// Not a secret. In prod the value is injected into the `X-Gateway-Forwarded`
// header by the APISIX `proxy-rewrite` plugin; the E2E server runs with the same
// value so the middleware's constant-time check passes.
export const DEV_GATEWAY_SHARED_SECRET =
	"dev-gateway-shared-secret-minimum-32-chars";

export const SUIT_EXPORT_PATH = "/api/v1/export/declarations";

export type SuitNextStep = {
	Identifiant_transition: string;
	Action: string;
	Etat_cible: string;
	Libelle: string | null;
	Condition?: string;
};

export type SuitParcours = {
	Annee: number;
	Effectif: number | null;
	Tranche_effectif: string | null;
	Regime_obligations: string;
	Statut: string;
	Annulee: boolean;
	Parcours_de_conformite_requis: boolean;
	Parcours_de_conformite_revision_requis: boolean;
	Avis_CSE_requis: boolean;
	Indicateur_G_requis: boolean;
	Version_regles: string | null;
	Prochaines_etapes_possibles: SuitNextStep[];
};

export type SuitDeclaration = {
	SIREN: string;
	Parcours: SuitParcours;
	Date_modification: string | null;
	Date_annulation: string | null;
	Historique_statuts: Array<{ Statut: string; Libelle_statut: unknown }>;
} & Record<string, unknown>;

const DAY_MS = 86_400_000;

function dayString(offsetDays: number): string {
	return new Date(Date.now() + offsetDays * DAY_MS).toISOString().slice(0, 10);
}

/** Window wide enough to catch anything the running spec just wrote, whatever the clock. */
export function suitExportUrl(): string {
	return `${SUIT_EXPORT_PATH}?date_begin=${dayString(-1)}&date_end=${dayString(1)}`;
}

async function callSuitExport(
	browser: Browser,
	headers: Record<string, string>,
): Promise<{
	status: number;
	body: { Declarations: SuitDeclaration[] } | null;
}> {
	// The gateway is machine-to-machine: a session cookie must never be what grants
	// access, so every call goes out from a storage-state-free context.
	const anonCtx = await browser.newContext({ storageState: undefined });
	try {
		const response = await anonCtx.request.get(suitExportUrl(), { headers });
		const status = response.status();
		return { status, body: status === 200 ? await response.json() : null };
	} finally {
		await anonCtx.close();
	}
}

/** Status of a gateway call made without the shared secret. */
export async function suitExportStatusWithoutSecret(
	browser: Browser,
): Promise<number> {
	return (await callSuitExport(browser, {})).status;
}

/** Every exported declaration of the shared test company, newest window. */
export async function fetchSuitDeclarations(
	browser: Browser,
): Promise<SuitDeclaration[]> {
	const { status, body } = await callSuitExport(browser, {
		"X-Gateway-Forwarded": DEV_GATEWAY_SHARED_SECRET,
	});
	expect(status).toBe(200);
	return (body?.Declarations ?? []).filter(
		(entry) => entry.SIREN === TEST_SIREN,
	);
}

/**
 * The most recently modified active (non-cancelled) exported declaration of the test
 * company — i.e. the one the calling spec just walked through the funnel. Picking the
 * latest rather than asserting a single row keeps the contract assertions independent
 * of the year-pinned declarations other specs may have left behind.
 */
export async function fetchActiveSuitDeclaration(
	browser: Browser,
): Promise<SuitDeclaration> {
	const active = (await fetchSuitDeclarations(browser))
		.filter((entry) => !entry.Parcours.Annulee)
		.sort((a, b) =>
			String(b.Date_modification).localeCompare(String(a.Date_modification)),
		);
	expect(
		active.length,
		"an active declaration of the test company is exported",
	).toBeGreaterThan(0);
	return active[0] as SuitDeclaration;
}
