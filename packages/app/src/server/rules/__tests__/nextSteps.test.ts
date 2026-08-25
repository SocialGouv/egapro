import { describe, expect, it } from "vitest";
import type { DeclarationFsmStatus } from "~/modules/domain";
import {
	type Facts,
	isKnownRulesVersion,
	loadRules,
	type Rules,
} from "../engine";
import {
	DEFAULT_RULES_VERSION,
	listNextTransitions,
	loadRulesWithFallback,
} from "../nextSteps";
import type { Predicate } from "../schema";

const bundled = loadRules(DEFAULT_RULES_VERSION);

type SyntheticTransition = {
	id: string;
	action?: string;
	from?: DeclarationFsmStatus[];
	to?: DeclarationFsmStatus;
	matchPayload?: Record<string, unknown>;
	guard?: Predicate;
};

type SyntheticExtras = {
	computations?: Rules["computations"];
	thresholds?: Rules["thresholds"];
};

function makeRules(
	transitions: SyntheticTransition[],
	extras: SyntheticExtras = {},
): Rules {
	const built: Rules["transitions"] = transitions.map((transition) => ({
		action: "act",
		events: [],
		from: ["draft"],
		to: "demarche_completed",
		...transition,
	}));
	return {
		version: "test",
		thresholds: extras.thresholds ?? {},
		stages: [{ id: 1, name: "test" }],
		states: [{ id: "draft", stage: 1 }],
		computations: extras.computations,
		transitions: built,
	};
}

/** Runs a guard alone through `listNextTransitions` and returns its Kleene outcome: `"excluded"` (decided false), `null` (decided true) or the residual predicate (undecided). */
function guardOutcome(
	guard: Predicate | undefined,
	facts: Facts,
	extras: SyntheticExtras = {},
): "excluded" | Predicate | null {
	const [entry] = listNextTransitions(
		makeRules([{ id: "t", guard }], extras),
		"draft",
		facts,
	);
	return entry === undefined ? "excluded" : entry.residualGuard;
}

const KNOWN_FACTS: Facts = { known: true };
const TRUE_LEAF: Predicate = { fact: "known", op: "==", value: true };
const FALSE_LEAF: Predicate = { fact: "known", op: "!=", value: true };
const UNKNOWN_LEAF: Predicate = { fact: "future", op: "==", value: true };
const OTHER_UNKNOWN_LEAF: Predicate = {
	fact: "otherFuture",
	op: "==",
	value: false,
};

describe("isKnownRulesVersion", () => {
	it("reconnaît la version embarquée", () => {
		expect(isKnownRulesVersion("2027.1")).toBe(true);
	});

	it.each(["1999.9", "2027.2", ""])("rejette la version %o", (version) => {
		expect(isKnownRulesVersion(version)).toBe(false);
	});
});

describe("DEFAULT_RULES_VERSION", () => {
	it("vaut 2027.1 et désigne une version embarquée", () => {
		expect(DEFAULT_RULES_VERSION).toBe("2027.1");
		expect(isKnownRulesVersion(DEFAULT_RULES_VERSION)).toBe(true);
	});
});

describe("loadRulesWithFallback", () => {
	it.each([
		["null", null],
		["undefined", undefined],
		["chaîne vide", ""],
		["version inconnue", "1999.9"],
		["version future non embarquée", "2028.1"],
	])("retombe sur 2027.1 pour %s", (_label, version) => {
		expect(() => loadRulesWithFallback(version)).not.toThrow();
		expect(loadRulesWithFallback(version).version).toBe("2027.1");
	});

	it("retourne le ruleset embarqué pour la version reconnue", () => {
		expect(loadRulesWithFallback("2027.1")).toBe(bundled);
	});

	it("retourne le même ruleset pour une version absente et pour la version reconnue", () => {
		expect(loadRulesWithFallback(null)).toBe(loadRulesWithFallback("2027.1"));
	});

	// Critère d'acceptation : « ne throw jamais sur une version absente, vide ou
	// inconnue » — S7 exige qu'une déclaration historique ne produise pas de 500.
	it.each([
		"constructor",
		"toString",
		"valueOf",
		"__proto__",
		"hasOwnProperty",
	])("ne throw pas pour la version inconnue %o héritée d'Object.prototype", (version) => {
		expect(() => loadRulesWithFallback(version)).not.toThrow();
		expect(loadRulesWithFallback(version).version).toBe("2027.1");
	});
});

describe("listNextTransitions — scénarios normatifs du ruleset 2027.1", () => {
	it("awaiting_compliance_path_choice avec CSE : 3 branches décidées, sans la variante sans CSE", () => {
		expect(
			listNextTransitions(bundled, "awaiting_compliance_path_choice", {
				cseRequired: true,
			}),
		).toEqual([
			{
				id: "choose_path_initial_justify_with_cse",
				action: "choose_compliance_path",
				to: "awaiting_cse_opinion",
				residualGuard: null,
			},
			{
				id: "choose_path_initial_corrective_action",
				action: "choose_compliance_path",
				to: "corrective_actions_chosen",
				residualGuard: null,
			},
			{
				id: "choose_path_initial_joint_evaluation",
				action: "choose_compliance_path",
				to: "joint_evaluation_chosen",
				residualGuard: null,
			},
		]);
	});

	it("corrective_actions_chosen avec CSE : 2 branches indécises, résidus dénudés", () => {
		expect(
			listNextTransitions(bundled, "corrective_actions_chosen", {
				cseRequired: true,
			}),
		).toEqual([
			{
				id: "submit_second_declaration_persistent_gap",
				action: "submit_second_declaration",
				to: "awaiting_revision_choice",
				residualGuard: { fact: "action.stillHasGap", op: "==", value: true },
			},
			{
				id: "submit_second_declaration_resolved_with_cse",
				action: "submit_second_declaration",
				to: "awaiting_cse_opinion",
				residualGuard: { fact: "action.stillHasGap", op: "==", value: false },
			},
		]);
	});

	it("corrective_actions_chosen sans CSE : la branche sans CSE remplace celle avec CSE", () => {
		expect(
			listNextTransitions(bundled, "corrective_actions_chosen", {
				cseRequired: false,
			}),
		).toEqual([
			{
				id: "submit_second_declaration_persistent_gap",
				action: "submit_second_declaration",
				to: "awaiting_revision_choice",
				residualGuard: { fact: "action.stillHasGap", op: "==", value: true },
			},
			{
				id: "submit_second_declaration_resolved_without_cse",
				action: "submit_second_declaration",
				to: "demarche_completed",
				residualGuard: { fact: "action.stillHasGap", op: "==", value: false },
			},
		]);
	});

	it("demarche_completed : submit_cse_opinion reste offerte, la liste n'est pas vide", () => {
		expect(
			listNextTransitions(bundled, "demarche_completed", { cseRequired: true }),
		).toEqual([
			{
				id: "submit_cse_opinion",
				action: "submit_cse_opinion",
				to: "demarche_completed",
				residualGuard: null,
			},
		]);
	});

	it.each(
		bundled.states.map((state) => state.id),
	)("sans aucun fait connu, l'état %s conserve toutes ses transitions dans l'ordre du ruleset", (status) => {
		const expected = bundled.transitions.filter((transition) =>
			transition.from.includes(status),
		);
		const actual = listNextTransitions(bundled, status, {});

		expect(actual.map((entry) => entry.id)).toEqual(
			expected.map((transition) => transition.id),
		);
		for (const [index, transition] of expected.entries()) {
			expect(actual[index]?.residualGuard === null).toBe(
				transition.guard === undefined,
			);
		}
	});

	it("ne déduplique ni par action ni par destination", () => {
		const entries = listNextTransitions(
			bundled,
			"awaiting_revision_choice",
			{},
		);

		expect(
			entries.filter((entry) => entry.action === "submit_second_declaration"),
		).toHaveLength(3);
		expect(
			entries.filter((entry) => entry.to === "awaiting_cse_opinion"),
		).toHaveLength(2);
		expect(
			entries.filter((entry) => entry.to === "demarche_completed"),
		).toHaveLength(2);
	});

	it("ne trie pas : l'ordre de déclaration du ruleset est restitué tel quel", () => {
		const rules = makeRules([{ id: "zeta" }, { id: "alpha" }, { id: "mid" }]);

		expect(
			listNextTransitions(rules, "draft", {}).map((entry) => entry.id),
		).toEqual(["zeta", "alpha", "mid"]);
	});

	it("ne mute ni le ruleset ni les faits reçus", () => {
		const rulesSnapshot = JSON.stringify(bundled);
		const facts: Facts = { cseRequired: true };

		listNextTransitions(bundled, "corrective_actions_chosen", facts);

		expect(JSON.stringify(bundled)).toBe(rulesSnapshot);
		expect(facts).toEqual({ cseRequired: true });
	});
});

describe("listNextTransitions — filtrage sur `from` et `matchPayload`", () => {
	it("écarte les transitions dont `from` ne contient pas l'état courant", () => {
		const rules = makeRules([
			{ id: "from_draft", from: ["draft"] },
			{ id: "from_elsewhere", from: ["demarche_completed"] },
			{ id: "from_both", from: ["demarche_completed", "draft"] },
		]);

		expect(
			listNextTransitions(rules, "draft", {}).map((entry) => entry.id),
		).toEqual(["from_draft", "from_both"]);
	});

	it("n'exclut jamais sur `matchPayload`, même quand le payload connu contredit la variante", () => {
		const rules = makeRules([
			{ id: "justify", matchPayload: { path: "justify" } },
			{ id: "corrective", matchPayload: { path: "corrective_action" } },
			{ id: "no_payload" },
		]);

		expect(
			listNextTransitions(rules, "draft", {
				action: { path: "justify" },
			}).map((entry) => entry.id),
		).toEqual(["justify", "corrective", "no_payload"]);
	});

	it("offre les 3 variantes de choix du ruleset malgré un `action.path` connu", () => {
		expect(
			listNextTransitions(bundled, "awaiting_compliance_path_choice", {
				cseRequired: true,
				action: { path: "justify" },
			}).map((entry) => entry.id),
		).toEqual([
			"choose_path_initial_justify_with_cse",
			"choose_path_initial_corrective_action",
			"choose_path_initial_joint_evaluation",
		]);
	});
});

describe("Kleene — feuilles `fact`", () => {
	it("garde sans résidu une transition sans garde", () => {
		expect(guardOutcome(undefined, KNOWN_FACTS)).toBeNull();
	});

	it("décide vrai quand le fait est connu et satisfait la comparaison", () => {
		expect(guardOutcome(TRUE_LEAF, KNOWN_FACTS)).toBeNull();
	});

	it("écarte la transition quand le fait connu contredit la comparaison", () => {
		expect(guardOutcome(FALSE_LEAF, KNOWN_FACTS)).toBe("excluded");
	});

	it("rend la feuille elle-même en résidu quand le fait est absent", () => {
		expect(guardOutcome(UNKNOWN_LEAF, KNOWN_FACTS)).toEqual(UNKNOWN_LEAF);
	});

	it.each([
		["==", 100, 100, true],
		["==", 100, 42, false],
		["!=", 100, 42, true],
		["!=", 100, 100, false],
		[">", 100, 42, true],
		[">", 42, 100, false],
		[">=", 100, 100, true],
		[">=", 41, 42, false],
		["<", 42, 100, true],
		["<", 100, 42, false],
		["<=", 100, 100, true],
		["<=", 100, 42, false],
	] as const)("applique l'opérateur %s (%d vs %d) comme le moteur", (op, factValue, compareValue, expected) => {
		const guard = { fact: "workforce", op, value: compareValue } as Predicate;

		expect(guardOutcome(guard, { workforce: factValue })).toBe(
			expected ? null : "excluded",
		);
	});

	it.each([
		["appartenance vérifiée", "justify", null],
		["appartenance refusée", "unknown_path", "excluded"],
	])("applique l'opérateur `in` — %s", (_label, factValue, expected) => {
		const guard: Predicate = {
			fact: "path",
			op: "in",
			value: ["justify", "corrective_action"],
		};

		expect(guardOutcome(guard, { path: factValue })).toBe(expected);
	});

	it("résout `threshold` contre les seuils du ruleset", () => {
		const guard: Predicate = {
			fact: "workforce",
			op: ">=",
			threshold: "phase2SizeMin",
		};
		const extras: SyntheticExtras = { thresholds: { phase2SizeMin: 100 } };

		expect(guardOutcome(guard, { workforce: 100 }, extras)).toBeNull();
		expect(guardOutcome(guard, { workforce: 99 }, extras)).toBe("excluded");
	});

	it("décide faux quand le seuil nommé est absent du ruleset", () => {
		const guard: Predicate = {
			fact: "workforce",
			op: ">=",
			threshold: "absentThreshold",
		};

		expect(guardOutcome(guard, { workforce: 300 })).toBe("excluded");
	});

	it("décide faux plutôt que de lever sur un nœud de comparaison sans `value` ni `threshold`", () => {
		const guard = { fact: "known", op: "==" } as unknown as Predicate;

		expect(guardOutcome(guard, KNOWN_FACTS)).toBe("excluded");
	});

	it("résout les chemins pointés", () => {
		const guard: Predicate = {
			fact: "action.stillHasGap",
			op: "==",
			value: true,
		};

		expect(guardOutcome(guard, { action: { stillHasGap: true } })).toBeNull();
		expect(guardOutcome(guard, { action: { stillHasGap: false } })).toBe(
			"excluded",
		);
	});

	it("rend indécis un chemin pointé traversant un intermédiaire nul ou absent", () => {
		const guard: Predicate = {
			fact: "action.stillHasGap",
			op: "==",
			value: true,
		};

		expect(guardOutcome(guard, { action: null })).toEqual(guard);
		expect(guardOutcome(guard, {})).toEqual(guard);
	});

	it("lève sur un opérateur inconnu", () => {
		const guard = {
			fact: "known",
			op: "~=",
			value: true,
		} as unknown as Predicate;

		expect(() => guardOutcome(guard, KNOWN_FACTS)).toThrow(
			'Unknown operator: "~="',
		);
	});

	it("lève sur un nœud de prédicat non reconnu", () => {
		const guard = {} as unknown as Predicate;

		expect(() => guardOutcome(guard, KNOWN_FACTS)).toThrow(
			"Unrecognized predicate node",
		);
	});
});

describe("Kleene — un fait `null` est connu, seul un fait absent est indécis", () => {
	it("`isNull` décide vrai sur un fait explicitement nul", () => {
		expect(
			guardOutcome(
				{ fact: "cancelledAt", op: "isNull" },
				{ cancelledAt: null },
			),
		).toBeNull();
		expect(
			guardOutcome(
				{ fact: "cancelledAt", op: "isNull" },
				{ cancelledAt: "2027-01-01" },
			),
		).toBe("excluded");
	});

	it("`isNotNull` décide faux sur un fait explicitement nul", () => {
		expect(
			guardOutcome(
				{ fact: "cancelledAt", op: "isNotNull" },
				{ cancelledAt: null },
			),
		).toBe("excluded");
		expect(
			guardOutcome(
				{ fact: "cancelledAt", op: "isNotNull" },
				{ cancelledAt: "2027-01-01" },
			),
		).toBeNull();
	});

	// Divergence assumée avec `evaluatePredicate` d'engine.ts, où `isNull` répond
	// `true` sur un fait absent : à l'export, l'absence signifie « pas encore su ».
	it.each([
		"isNull",
		"isNotNull",
	] as const)("`%s` reste indécis quand la clé du fait est absente", (op) => {
		const guard: Predicate = { fact: "cancelledAt", op };

		expect(guardOutcome(guard, KNOWN_FACTS)).toEqual(guard);
	});

	it("distingue un fait nul d'un fait absent dans une comparaison", () => {
		const guard: Predicate = { fact: "gap", op: "==", value: null };

		expect(guardOutcome(guard, { gap: null })).toBeNull();
		expect(guardOutcome(guard, {})).toEqual(guard);
	});
});

describe("Kleene — `all`", () => {
	it.each([
		["tous vrais", [TRUE_LEAF, TRUE_LEAF], null],
		["un faux", [TRUE_LEAF, FALSE_LEAF], "excluded"],
		["un faux prime sur un indécis", [FALSE_LEAF, UNKNOWN_LEAF], "excluded"],
		["conjonction vide", [], null],
	])("%s", (_label, children, expected) => {
		expect(guardOutcome({ all: children as Predicate[] }, KNOWN_FACTS)).toBe(
			expected,
		);
	});

	it("élague les enfants vrais et dénude le résidu à un seul enfant", () => {
		expect(
			guardOutcome({ all: [UNKNOWN_LEAF, TRUE_LEAF] }, KNOWN_FACTS),
		).toEqual(UNKNOWN_LEAF);
	});

	it("conserve un `all` quand plusieurs enfants restent indécis", () => {
		expect(
			guardOutcome(
				{ all: [TRUE_LEAF, UNKNOWN_LEAF, OTHER_UNKNOWN_LEAF] },
				KNOWN_FACTS,
			),
		).toEqual({ all: [UNKNOWN_LEAF, OTHER_UNKNOWN_LEAF] });
	});
});

describe("Kleene — `any`", () => {
	it.each([
		["tous faux", [FALSE_LEAF, FALSE_LEAF], "excluded"],
		["un vrai", [FALSE_LEAF, TRUE_LEAF], null],
		["un vrai prime sur un indécis", [TRUE_LEAF, UNKNOWN_LEAF], null],
		["disjonction vide", [], "excluded"],
	])("%s", (_label, children, expected) => {
		expect(guardOutcome({ any: children as Predicate[] }, KNOWN_FACTS)).toBe(
			expected,
		);
	});

	it("élague les enfants faux et dénude le résidu à un seul enfant", () => {
		expect(
			guardOutcome({ any: [FALSE_LEAF, UNKNOWN_LEAF] }, KNOWN_FACTS),
		).toEqual(UNKNOWN_LEAF);
	});

	it("conserve un `any` quand plusieurs enfants restent indécis", () => {
		expect(
			guardOutcome(
				{ any: [FALSE_LEAF, UNKNOWN_LEAF, OTHER_UNKNOWN_LEAF] },
				KNOWN_FACTS,
			),
		).toEqual({ any: [UNKNOWN_LEAF, OTHER_UNKNOWN_LEAF] });
	});
});

describe("Kleene — `not`", () => {
	it("inverse un enfant décidé", () => {
		expect(guardOutcome({ not: TRUE_LEAF }, KNOWN_FACTS)).toBe("excluded");
		expect(guardOutcome({ not: FALSE_LEAF }, KNOWN_FACTS)).toBeNull();
	});

	it("laisse l'indécis indécis et enveloppe son résidu", () => {
		expect(guardOutcome({ not: UNKNOWN_LEAF }, KNOWN_FACTS)).toEqual({
			not: UNKNOWN_LEAF,
		});
	});

	it("enveloppe le résidu déjà élagué de son enfant", () => {
		expect(
			guardOutcome({ not: { all: [TRUE_LEAF, UNKNOWN_LEAF] } }, KNOWN_FACTS),
		).toEqual({ not: UNKNOWN_LEAF });
	});
});

describe("Kleene — `compute`", () => {
	const computations: Rules["computations"] = {
		decidedTrue: TRUE_LEAF,
		decidedFalse: FALSE_LEAF,
		undecided: { all: [TRUE_LEAF, UNKNOWN_LEAF] },
		chained: { compute: "undecided" },
	};

	it("décide comme la computation résolue", () => {
		expect(
			guardOutcome({ compute: "decidedTrue" }, KNOWN_FACTS, { computations }),
		).toBeNull();
		expect(
			guardOutcome({ compute: "decidedFalse" }, KNOWN_FACTS, { computations }),
		).toBe("excluded");
	});

	it("rend le nœud `compute` lui-même en résidu, sans déplier la computation", () => {
		expect(
			guardOutcome({ compute: "undecided" }, KNOWN_FACTS, { computations }),
		).toEqual({ compute: "undecided" });
	});

	it("rend le nœud `compute` le plus externe pour une computation chaînée", () => {
		expect(
			guardOutcome({ compute: "chained" }, KNOWN_FACTS, { computations }),
		).toEqual({ compute: "chained" });
	});

	it("lève sur une computation inconnue", () => {
		expect(() =>
			guardOutcome({ compute: "absente" }, KNOWN_FACTS, { computations }),
		).toThrow('Unknown computation: "absente"');
	});

	it("lève sur une computation inconnue quand le ruleset n'en déclare aucune", () => {
		expect(() => guardOutcome({ compute: "absente" }, KNOWN_FACTS)).toThrow(
			'Unknown computation: "absente"',
		);
	});

	it("décide les gardes composées de `compute` du ruleset 2027.1", () => {
		const facts: Facts = {
			workforce: 300,
			indicatorGCalculated: true,
			gap: 10,
			hasCse: true,
		};

		expect(
			listNextTransitions(bundled, "draft", facts).map((entry) => entry.id),
		).toEqual(["submit_to_compliance_path_choice"]);
	});

	it("remonte des résidus `compute` et `not` depuis draft sans faits connus", () => {
		expect(listNextTransitions(bundled, "draft", {})).toEqual([
			{
				id: "submit_to_compliance_path_choice",
				action: "submit",
				to: "awaiting_compliance_path_choice",
				residualGuard: { compute: "phase2Required" },
			},
			{
				id: "submit_to_cse_opinion_directly",
				action: "submit",
				to: "awaiting_cse_opinion",
				residualGuard: {
					all: [
						{ not: { compute: "phase2Required" } },
						{ compute: "cseRequired" },
					],
				},
			},
			{
				id: "submit_to_demarche_completed_directly",
				action: "submit",
				to: "demarche_completed",
				residualGuard: {
					all: [
						{ not: { compute: "phase2Required" } },
						{ not: { compute: "cseRequired" } },
					],
				},
			},
		]);
	});
});
