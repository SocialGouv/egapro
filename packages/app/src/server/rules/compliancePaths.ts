import { COMPLIANCE_PATHS, type CompliancePathValue } from "~/modules/domain";
import { listBundledRulesVersions, loadRules, type Rules } from "./engine";

export type PathChoiceRound = 1 | 2;

function isCompliancePath(value: string): value is CompliancePathValue {
	return (COMPLIANCE_PATHS as readonly string[]).includes(value);
}

// Read off the `path_choice` events rather than restated: the copied-by-hand
// list is what made the spec advertise `corrective_action` at round 2, which no
// ruleset has ever emitted.
export function collectCompliancePathsByRound(
	rulesets: readonly Rules[],
): Record<PathChoiceRound, CompliancePathValue[]> {
	const seen: Record<PathChoiceRound, Set<CompliancePathValue>> = {
		1: new Set(),
		2: new Set(),
	};

	for (const rules of rulesets) {
		for (const transition of rules.transitions) {
			for (const event of transition.events) {
				if (event.type !== "path_choice") continue;
				if (event.value === undefined || event.round === undefined) continue;
				if (!isCompliancePath(event.value)) continue;
				seen[event.round].add(event.value);
			}
		}
	}

	return {
		1: COMPLIANCE_PATHS.filter((path) => seen[1].has(path)),
		2: COMPLIANCE_PATHS.filter((path) => seen[2].has(path)),
	};
}

// Unioned over every bundled ruleset: a declaration keeps the version it was
// submitted under, so a path dropped by a newer ruleset is still served for the
// older declarations that chose it.
export function listCompliancePathsByRound(): Record<
	PathChoiceRound,
	CompliancePathValue[]
> {
	return collectCompliancePathsByRound(
		listBundledRulesVersions().map(loadRules),
	);
}
