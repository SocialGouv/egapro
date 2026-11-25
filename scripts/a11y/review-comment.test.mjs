import assert from "node:assert/strict";
import { test } from "node:test";

import {
	indexStandard,
	loadStandard,
	MARKER,
	mergeSection,
	parseTextMessages,
	renderRendered,
	renderSkipped,
	renderStatic,
	rgaaForRendered,
} from "./review-comment.mjs";

const index = indexStandard(loadStandard());

const audit = {
	version: "9.6.5",
	scope: { files: 2 },
	findings: [
		{
			ruleId: "control-label-missing",
			file: "src/app/plan-du-site/page.tsx",
			line: 14,
			severity: "bloquant",
			message: "Form field <input> has no label — no associated label.",
			criteriaId: "11.1",
			criteriaIds: ["11.1"],
			wcag: "4.1.2",
		},
	],
};

const text = `Non-conformités détectées (1) :
  🔴 [11.1] src/app/plan-du-site/page.tsx:14  Champ de formulaire <input> sans étiquette — aucun label associé.
`;

test("the engine's French messages are read from its text output", () => {
	const messages = parseTextMessages(text);
	assert.equal(
		messages.get("11.1|src/app/plan-du-site/page.tsx|14"),
		"Champ de formulaire <input> sans étiquette — aucun label associé.",
	);
});

test("static section: findings by RGAA criterion, French message, HTML escaped", () => {
	const out = renderStatic({ audit, text, base: "origin/alpha", index });
	assert.match(out, /#### 🔴 Bloquant/);
	assert.match(
		out,
		/\*\*RGAA 11\.1\*\* \(WCAG 4\.1\.2\) — Chaque champ de formulaire/,
	);
	assert.match(
		out,
		/`src\/app\/plan-du-site\/page\.tsx:14` — Champ de formulaire &lt;input&gt; sans étiquette/,
	);
	assert.match(out, /dont \*\*1 bloquante\(s\)\*\*/);
	assert.match(out, /Verdict : bloquant/);
});

test("static section without findings says so", () => {
	const out = renderStatic({
		audit: { version: "9.6.5", scope: { files: 0 }, findings: [] },
		text: "",
		base: "origin/alpha",
		index,
	});
	assert.match(out, /Aucune non-conformité détectée/);
	assert.match(out, /pas de non-conformité bloquante/);
});

test("rendered findings are attached to their RGAA criterion, not their WCAG one", () => {
	assert.deepEqual(
		rgaaForRendered({ axeRule: "label", criteriaId: "4.1.2" }, index),
		["11.1"],
	);
	assert.deepEqual(
		rgaaForRendered(
			{ axeRule: "reflow-zoom", engine: "reflow-zoom", criteriaId: "1.4.4" },
			index,
		),
		["10.4"],
	);
	assert.ok(
		rgaaForRendered(
			{ axeRule: "color-contrast", criteriaId: "1.4.3" },
			index,
		).includes("3.2"),
	);
});

test("rendered section: only new findings, unmeasured pages block, unmapped files named", () => {
	const scan = {
		scanned: ["https://pr.example/plan-du-site"],
		gate: {
			new: [
				{
					criteriaId: "1.3.1",
					axeRule: "label",
					severity: "bloquant",
					message: "Champ sans étiquette",
					selector: "input[name=q]",
					page: "https://pr.example/plan-du-site",
				},
			],
			known: 3,
			notMeasured: [
				{ page: "https://pr.example/mon-espace", reason: "redirection" },
			],
			knownNotMeasured: 0,
		},
	};
	const out = renderRendered({
		scan,
		affected: {
			unresolved: ["/referents/[id]"],
			unmapped: ["src/modules/x.ts"],
		},
		baseUrl: "https://base.example",
		prUrl: "https://pr.example",
		index,
	});
	assert.match(out, /\*\*RGAA 11\.1\*\* \(WCAG 1\.3\.1\)/);
	assert.match(
		out,
		/`\/plan-du-site` `input\[name=q\]` — Champ sans étiquette/,
	);
	assert.match(out, /Pages atteintes mais non rendues \(bloquant\)/);
	assert.match(out, /`\/mon-espace` — redirection/);
	assert.match(out, /route sans URL connue : `\/referents\/\[id\]`/);
	assert.match(out, /n'atteint aucune page : `src\/modules\/x\.ts`/);
	assert.match(out, /Préexistant, hors périmètre : 3 constat/);
	assert.match(out, /Verdict : bloquant/);
});

test("rendered section with nothing new passes", () => {
	const out = renderRendered({
		scan: {
			scanned: [],
			gate: { new: [], known: 0, notMeasured: [], knownNotMeasured: 0 },
		},
		affected: null,
		baseUrl: "https://base.example",
		prUrl: "https://pr.example",
		index,
	});
	assert.match(out, /Aucune non-conformité nouvelle/);
	assert.match(out, /rien de nouveau/);
});

test("merge keeps the other section and replaces its own", () => {
	const first = mergeSection("", "static", "STATIC v1");
	assert.ok(first.startsWith(MARKER));
	assert.match(first, /STATIC v1/);
	assert.match(first, /En attente du déploiement/);
	const second = mergeSection(
		first,
		"rendered",
		renderSkipped("pas de préversion"),
	);
	assert.match(second, /STATIC v1/);
	assert.match(second, /Non lancé : pas de préversion/);
	const third = mergeSection(second, "static", "STATIC v2");
	assert.doesNotMatch(third, /STATIC v1/);
	assert.match(third, /STATIC v2/);
	assert.match(third, /Non lancé : pas de préversion/);
	assert.throws(() => mergeSection(third, "other", "x"));
});
