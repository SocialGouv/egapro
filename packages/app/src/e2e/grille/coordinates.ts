import { isCseRequired, isIndicatorGRequired } from "~/modules/domain";

export const CAMPAIGN_YEARS = [
	2027, 2028, 2029, 2030, 2031, 2032, 2033,
] as const;

export const TRANCHES = [
	{ effmax: "49", workforce: 30, label: "Moins de 50 salariés" },
	{ effmax: "99", workforce: 75, label: "50 à 99 salariés" },
	{ effmax: "149", workforce: 120, label: "100 à 149 salariés" },
	{ effmax: "249", workforce: 200, label: "150 à 249 salariés" },
	{ effmax: "250P", workforce: 250, label: "250 salariés et plus" },
] as const;

export type Tranche = (typeof TRANCHES)[number];

export type Coordinate = {
	id: string;
	year: number;
	effmax: string;
	workforce: number;
	caseNumber: number;
	fiche: string;
	indicatorGRequired: boolean;
	hasCse: boolean | null;
	rappel: string;
};

const RAPPELS: Record<string, string> = {
	"CAS-01": "sans CSE · aucun écart → fin de démarche",
	"CAS-02": "avec CSE · aucun écart → avis CSE « exactitude »",
	"CAS-03": "sans CSE · écart ≥ 5 % → justification des écarts",
	"CAS-04": "avec CSE · écart ≥ 5 % → justification + avis CSE",
	"CAS-05": "sans CSE · écart ≥ 5 % → évaluation conjointe",
	"CAS-06": "avec CSE · écart ≥ 5 % → évaluation conjointe + avis CSE",
	"CAS-07": "sans CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. sans écart",
	"CAS-08":
		"avec CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. sans écart + avis CSE",
	"CAS-09":
		"sans CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → justification",
	"CAS-10":
		"avec CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → justification + avis CSE",
	"CAS-11":
		"sans CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → évaluation conjointe",
	"CAS-12":
		"avec CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → évaluation conjointe + avis CSE",
	"CAS-01-6IND": "sans CSE → fin de démarche directe",
	"CAS-02-6IND": "avec CSE → avis CSE « exactitude »",
	"CAS-13": "aucun écart → fin de démarche directe",
	"CAS-14": "écart ≥ 5 % → fin de démarche directe (aucune obligation)",
	"CAS-13-6IND": "6 premiers indicateurs → fin de démarche directe",
};

function padCase(caseNumber: number): string {
	return String(caseNumber).padStart(2, "0");
}

/**
 * Cases an Excel cell carries — one half of the grid's cardinality. Tranches
 * >= 100 enumerate the 12 compliance cases in a seven-indicator year and the
 * two CSE variants otherwise; tranches < 100 (July 2026 arbitrage: no CSE, no
 * gap obligations) carry CAS-13/14 with indicator G and CAS-13 alone without.
 * Crossed with the years each tranche owes indicator G (isIndicatorGRequired,
 * the other half), this is what makes the per-sheet totals fall out at
 * 14 / 9 / 34 / 44 / 84 = 185 — asserted in coordinates.test.ts, never fed in.
 */
function caseNumbersFor(
	requiresCompliance: boolean,
	sevenIndicators: boolean,
): number[] {
	if (!requiresCompliance) {
		return sevenIndicators ? [13, 14] : [13];
	}
	return sevenIndicators ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] : [1, 2];
}

function ficheFor(caseNumber: number, sevenIndicators: boolean): string {
	return `CAS-${padCase(caseNumber)}${sevenIndicators ? "" : "-6IND"}`;
}

function hasCseFor(
	caseNumber: number,
	requiresCompliance: boolean,
): boolean | null {
	if (requiresCompliance) {
		return caseNumber % 2 === 0;
	}
	return caseNumber === 14 ? true : null;
}

export function buildGrid(): Coordinate[] {
	const grid: Coordinate[] = [];
	for (const year of CAMPAIGN_YEARS) {
		for (const tranche of TRANCHES) {
			const { effmax, workforce } = tranche;
			const sevenIndicators = isIndicatorGRequired(workforce, year);
			const requiresCompliance = isCseRequired(workforce);
			for (const caseNumber of caseNumbersFor(
				requiresCompliance,
				sevenIndicators,
			)) {
				const fiche = ficheFor(caseNumber, sevenIndicators);
				grid.push({
					id: `${year}-${effmax}-CAS${padCase(caseNumber)}`,
					year,
					effmax,
					workforce,
					caseNumber,
					fiche,
					indicatorGRequired: sevenIndicators,
					hasCse: hasCseFor(caseNumber, requiresCompliance),
					rappel: RAPPELS[fiche] ?? "",
				});
			}
		}
	}
	return grid;
}

export function pickCoordinate(
	grid: Coordinate[],
	criteria: { fiche: string; effmax?: string; year?: number },
): Coordinate {
	const match = grid.find(
		(coordinate) =>
			coordinate.fiche === criteria.fiche &&
			(criteria.effmax === undefined ||
				coordinate.effmax === criteria.effmax) &&
			(criteria.year === undefined || coordinate.year === criteria.year),
	);
	if (!match) {
		throw new Error(
			`No coordinate matches ${JSON.stringify(criteria)} in the derived grid`,
		);
	}
	return match;
}
