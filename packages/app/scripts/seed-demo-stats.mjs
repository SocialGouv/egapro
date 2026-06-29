#!/usr/bin/env node
//
// Seed declarations and journey events for the admin/public stats charts
// (K1 taux de déclaration, K4 délai par étape, K5 taux d'abandon, K7
// distribution des écarts, K19 funnel de complétion).
//
// Seeds ~48 declarations covering every non-terminal FSM state so the charts
// always show a realistic distribution: wizard stucks (steps 0..5), submit
// + path_choice stucks, awaiting_cse_opinion, awaiting_revision_choice,
// completed declarations through every path, plus 6 previous-year completed
// declarations for the K1 YoY tile.
//
// All seeded SIRENs are prefixed `999` so they never collide with real data,
// and `--clean` wipes them in one pass.
//
// Usage:
//   DATABASE_URL=postgres://... node packages/app/scripts/seed-demo-stats.mjs [--year=2026] [--clean]
//
// Local docker stack (run from a worktree root):
//   DATABASE_URL=$(grep ^DATABASE_URL packages/app/.env.local | cut -d= -f2-) \
//     node packages/app/scripts/seed-demo-stats.mjs --year=2026
//
// Review app on Kubernetes via port-forward:
//   1. kubectl -n <namespace> port-forward svc/pg-rw 5550:5432 &
//   2. DATABASE_URL=$(kubectl -n <namespace> get secret pg-app \
//        -o jsonpath='{.data.DATABASE_URL}' | base64 -d \
//        | sed "s|@[^/]*|@localhost:5550|") \
//        node packages/app/scripts/seed-demo-stats.mjs --year=2026
//   3. (when done) re-run with --clean to wipe the seeded rows.
//
// `STEP_DURATION_MIN_SAMPLE = 5` in adminStats means each transition needs
// at least 5 declarations to render percentiles — the seed set is sized to
// clear that threshold on every step/milestone of every chart.

import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(__dirname, "..", "package.json"));
const postgres = require("postgres");

const args = Object.fromEntries(
	process.argv.slice(2).map((a) => {
		if (a === "--clean") return ["clean", true];
		const m = a.match(/^--([^=]+)=(.+)$/);
		return m ? [m[1], m[2]] : [a, true];
	}),
);

const KNOWN_ARGS = new Set(["year", "clean"]);
for (const key of Object.keys(args)) {
	if (!KNOWN_ARGS.has(key)) {
		console.error(`ERROR: unknown argument --${key}`);
		process.exit(1);
	}
}

const YEAR = Number.parseInt(args.year ?? "2026", 10);
const CLEAN = !!args.clean;
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
	console.error("ERROR: DATABASE_URL env var required");
	process.exit(1);
}

const SEED_USER_EMAIL = "seed-demo@example.fr";
const SEED_USER_ID = "00000000-9999-4999-8999-000000009999";

// --- Date helpers --------------------------------------------------------

function addDays(isoDate, days) {
	const d = new Date(isoDate);
	d.setUTCDate(d.getUTCDate() + days);
	return d.toISOString();
}

function addHours(isoDate, hours) {
	const d = new Date(isoDate);
	d.setUTCHours(d.getUTCHours() + hours);
	return d.toISOString();
}

function dateUtc(year, monthIdx, day, hour = 10) {
	return new Date(Date.UTC(year, monthIdx, day, hour, 0, 0)).toISOString();
}

// Per-year volume ratio so cumulative curves end at clearly different
// heights on the campaign progression chart: current year = full set,
// each previous year cohort drops by 30 % so 2025 ≈ 70 % of 2026 etc.
// Bottoms at 30 % so even old cohorts produce a visible line.
function yearVolumeRatio(year, refYear) {
	const stepsBack = Math.max(0, refYear - year);
	return Math.max(0.3, 1 - stepsBack * 0.3);
}

// Uniform downsample: keeps `Math.round(arr.length * ratio)` items evenly
// spread across the array so the kept subset still covers the full date
// range (rather than just the first N items / earliest dates).
function sampleUniform(arr, ratio) {
	if (ratio >= 1) return arr;
	const target = Math.round(arr.length * ratio);
	if (target <= 0) return [];
	return arr.filter(
		(_, i) =>
			Math.floor(((i + 1) * target) / arr.length) >
			Math.floor((i * target) / arr.length),
	);
}

// --- Wizard event generator ----------------------------------------------
// Generates the 7 step_change events 0..6 spread over ~stepGapDays each.

function wizardEvents(startIso, maxStep = 6, stepGapDays = 3) {
	const events = [];
	let prev = null;
	let cursor = startIso;
	for (let s = 0; s <= maxStep; s++) {
		const fromLabel = prev === null ? "null" : String(prev);
		events.push({
			type: "step_change",
			round: s,
			value: `from:${fromLabel}|to:${s}`,
			at: cursor,
		});
		prev = s;
		cursor = addDays(cursor, stepGapDays);
	}
	return events;
}

// --- Companies (~30) -----------------------------------------------------
// SIREN prefix 999 marks fake data. workforce drives sizeRange filter +
// cseRequired flag.

// `hasCse` drives the K19 CSE funnel filter (`companies.has_cse = true`).
// We set it to true for every company with workforce >= 100 (the typical
// regulatory threshold for CSE obligation) and for a few smaller ones so the
// funnel reflects realistic variance.

const COMPANIES = [
	// Small (< 50) — wizard stuck cases
	{ siren: "999100001", name: "Démo Brouillon", workforce: 30, hasCse: false },
	{ siren: "999100002", name: "Démo Step1", workforce: 40, hasCse: false },
	{
		siren: "999100003",
		name: "Démo Step3 Stuck",
		workforce: 35,
		hasCse: false,
	},
	{ siren: "999100004", name: "Démo Récap", workforce: 50, hasCse: false },

	// 50-99 — complete direct (no alert)
	{ siren: "999110001", name: "Démo No-Alert 1", workforce: 55, hasCse: false },
	{ siren: "999110002", name: "Démo No-Alert 2", workforce: 60, hasCse: false },
	{ siren: "999110003", name: "Démo No-Alert 3", workforce: 65, hasCse: true },
	{ siren: "999110004", name: "Démo No-Alert 4", workforce: 70, hasCse: true },
	{ siren: "999110005", name: "Démo No-Alert 5", workforce: 75, hasCse: false },
	{ siren: "999110006", name: "Démo No-Alert 6", workforce: 80, hasCse: true },

	// 50-99 — justify
	{ siren: "999120001", name: "Démo Justify 1", workforce: 60, hasCse: false },
	{ siren: "999120002", name: "Démo Justify 2", workforce: 70, hasCse: true },

	// 50-99 — corrective_action + 2nd declaration
	{
		siren: "999130001",
		name: "Démo Corrective 1",
		workforce: 55,
		hasCse: false,
	},
	{
		siren: "999130002",
		name: "Démo Corrective 2",
		workforce: 65,
		hasCse: true,
	},
	{
		siren: "999130003",
		name: "Démo Corrective 3",
		workforce: 75,
		hasCse: true,
	},
	{
		siren: "999130004",
		name: "Démo Corrective 4",
		workforce: 85,
		hasCse: true,
	},
	{
		siren: "999130005",
		name: "Démo Corrective 5",
		workforce: 90,
		hasCse: false,
	},
	{
		siren: "999130006",
		name: "Démo Corrective 6",
		workforce: 95,
		hasCse: true,
	},

	// 50-99 — joint_evaluation round=1
	{
		siren: "999140001",
		name: "Démo JointEval 1",
		workforce: 55,
		hasCse: false,
	},
	{ siren: "999140002", name: "Démo JointEval 2", workforce: 65, hasCse: true },
	{ siren: "999140003", name: "Démo JointEval 3", workforce: 75, hasCse: true },
	{ siren: "999140004", name: "Démo JointEval 4", workforce: 85, hasCse: true },
	{
		siren: "999140005",
		name: "Démo JointEval 5",
		workforce: 90,
		hasCse: false,
	},
	{ siren: "999140006", name: "Démo JointEval 6", workforce: 95, hasCse: true },

	// 100+ — revision cycle (corrective then joint_eval round=2) — all have CSE
	{ siren: "999150001", name: "Démo Revision 1", workforce: 120, hasCse: true },
	{ siren: "999150002", name: "Démo Revision 2", workforce: 140, hasCse: true },
	{ siren: "999150003", name: "Démo Revision 3", workforce: 160, hasCse: true },
	{ siren: "999150004", name: "Démo Revision 4", workforce: 180, hasCse: true },
	{ siren: "999150005", name: "Démo Revision 5", workforce: 200, hasCse: true },
	{ siren: "999150006", name: "Démo Revision 6", workforce: 220, hasCse: true },

	// 100+ — CSE required (cse_opinion_submit) — all have CSE
	{ siren: "999160001", name: "Démo CSE 1", workforce: 110, hasCse: true },
	{ siren: "999160002", name: "Démo CSE 2", workforce: 130, hasCse: true },
	{ siren: "999160003", name: "Démo CSE 3", workforce: 150, hasCse: true },
	{ siren: "999160004", name: "Démo CSE 4", workforce: 170, hasCse: true },
	{ siren: "999160005", name: "Démo CSE 5", workforce: 250, hasCse: true },
	{ siren: "999160006", name: "Démo CSE 6", workforce: 350, hasCse: true },

	// Additional wizard stucks for K5 (steps 2 and 4 — fill gap in coverage)
	{
		siren: "999100005",
		name: "Démo Step2 Stuck",
		workforce: 45,
		hasCse: false,
	},
	{ siren: "999100006", name: "Démo Step4 Stuck", workforce: 60, hasCse: true },

	// Compliance funnel stucks — submitted with alert, no path choice yet
	{
		siren: "999170001",
		name: "Démo Await Path 1",
		workforce: 60,
		hasCse: false,
	},
	{
		siren: "999170002",
		name: "Démo Await Path 2 CSE",
		workforce: 75,
		hasCse: true,
	},

	// Compliance funnel stucks — path chosen but no action submitted
	{
		siren: "999180001",
		name: "Démo Corrective Stuck",
		workforce: 70,
		hasCse: false,
	},
	{
		siren: "999180002",
		name: "Démo Corrective Stuck CSE",
		workforce: 85,
		hasCse: true,
	},
	{
		siren: "999180003",
		name: "Démo JointEval Stuck",
		workforce: 80,
		hasCse: false,
	},

	// CSE funnel stucks — action submitted, awaiting CSE opinion
	{
		siren: "999190001",
		name: "Démo Await CSE Corrective",
		workforce: 110,
		hasCse: true,
	},
	{
		siren: "999190002",
		name: "Démo Await CSE JointEval",
		workforce: 130,
		hasCse: true,
	},
	{
		siren: "999190003",
		name: "Démo Await CSE No-Alert",
		workforce: 150,
		hasCse: true,
	},

	// Revision sub-funnel stucks
	{
		siren: "999195001",
		name: "Démo Revision Chosen Stuck",
		workforce: 160,
		hasCse: true,
	},
	{
		siren: "999195002",
		name: "Démo Await Revision Choice",
		workforce: 180,
		hasCse: true,
	},
];

const ALL_SIRENS = COMPANIES.map((c) => c.siren);

// --- GIP MDS data (K1 — obligated population) ----------------------------
// K1 (`getCampaignStats`) counts obligated companies as those having a
// `app_gip_mds_data` row for the year whose `workforce_ema` clears the
// obligation threshold (triennial: 50-99 OR ≥100, non-triennial: ≥100 only).
// We seed both the current year and the previous year so the YoY delta is
// visible in the K1 tile.

const PREV_YEAR = YEAR - 1;

// --- Declarations --------------------------------------------------------

function declarationStuckAtStep(siren, maxStep, startIso) {
	return {
		siren,
		currentStep: maxStep,
		status: "draft",
		path: null,
		events: wizardEvents(startIso, maxStep),
	};
}

function declarationCompleteDirect(siren, startIso) {
	const wizard = wizardEvents(startIso);
	const submittedAt = wizard[wizard.length - 1].at;
	// Direct complete (no alert): same-day completion, +2h only to keep a
	// strict created_at ordering between submit and demarche_complete.
	const completedAt = addHours(submittedAt, 2);
	return {
		siren,
		currentStep: 6,
		status: "demarche_completed",
		path: null,
		events: [
			...wizard,
			{ type: "submit", round: 1, at: submittedAt },
			{ type: "demarche_complete", round: null, at: completedAt },
		],
	};
}

function declarationJustify(siren, startIso) {
	const wizard = wizardEvents(startIso);
	const submittedAt = wizard[wizard.length - 1].at;
	const pathChoiceAt = addDays(submittedAt, 6);
	const completedAt = addDays(pathChoiceAt, 1);
	return {
		siren,
		currentStep: 6,
		status: "demarche_completed",
		path: "justify",
		events: [
			...wizard,
			{ type: "submit", round: 1, at: submittedAt },
			{ type: "path_choice", round: 1, value: "justify", at: pathChoiceAt },
			{ type: "demarche_complete", round: null, at: completedAt },
		],
	};
}

function declarationCorrective(
	siren,
	startIso,
	daysBeforeChoice = 10,
	daysBeforeAction = 60,
) {
	const wizard = wizardEvents(startIso);
	const submittedAt = wizard[wizard.length - 1].at;
	const pathChoiceAt = addDays(submittedAt, daysBeforeChoice);
	const secondDeclAt = addDays(pathChoiceAt, daysBeforeAction);
	const completedAt = addDays(secondDeclAt, 1);
	return {
		siren,
		currentStep: 6,
		status: "demarche_completed",
		path: "corrective_action",
		events: [
			...wizard,
			{ type: "submit", round: 1, at: submittedAt },
			{
				type: "path_choice",
				round: 1,
				value: "corrective_action",
				at: pathChoiceAt,
			},
			{ type: "second_declaration_submit", round: 2, at: secondDeclAt },
			{ type: "demarche_complete", round: null, at: completedAt },
		],
	};
}

function declarationJointEvaluation(
	siren,
	startIso,
	daysBeforeChoice = 8,
	daysBeforeAction = 45,
) {
	const wizard = wizardEvents(startIso);
	const submittedAt = wizard[wizard.length - 1].at;
	const pathChoiceAt = addDays(submittedAt, daysBeforeChoice);
	const jointEvalAt = addDays(pathChoiceAt, daysBeforeAction);
	const completedAt = addDays(jointEvalAt, 1);
	return {
		siren,
		currentStep: 6,
		status: "demarche_completed",
		path: "joint_evaluation",
		events: [
			...wizard,
			{ type: "submit", round: 1, at: submittedAt },
			{
				type: "path_choice",
				round: 1,
				value: "joint_evaluation",
				at: pathChoiceAt,
			},
			{ type: "joint_evaluation_submit", round: 1, at: jointEvalAt },
			{ type: "demarche_complete", round: null, at: completedAt },
		],
	};
}

function declarationRevision(siren, startIso) {
	const wizard = wizardEvents(startIso);
	const submittedAt = wizard[wizard.length - 1].at;
	const pathChoiceAt = addDays(submittedAt, 8);
	const secondDeclAt = addDays(pathChoiceAt, 55);
	const revisionChoiceAt = addDays(secondDeclAt, 5);
	const jointEvalRevAt = addDays(revisionChoiceAt, 70);
	const completedAt = addDays(jointEvalRevAt, 2);
	return {
		siren,
		currentStep: 6,
		status: "demarche_completed",
		path: "corrective_action",
		secondPath: "joint_evaluation",
		events: [
			...wizard,
			{ type: "submit", round: 1, at: submittedAt },
			{
				type: "path_choice",
				round: 1,
				value: "corrective_action",
				at: pathChoiceAt,
			},
			{ type: "second_declaration_submit", round: 2, at: secondDeclAt },
			{
				type: "path_choice",
				round: 2,
				value: "joint_evaluation",
				at: revisionChoiceAt,
			},
			{ type: "joint_evaluation_submit", round: 2, at: jointEvalRevAt },
			{ type: "demarche_complete", round: null, at: completedAt },
		],
	};
}

function declarationSubmittedAwaitingPath(siren, startIso) {
	const wizard = wizardEvents(startIso);
	return {
		siren,
		currentStep: 6,
		status: "awaiting_compliance_path_choice",
		path: null,
		events: [
			...wizard,
			{ type: "submit", round: 1, at: wizard[wizard.length - 1].at },
		],
	};
}

function declarationPathChosenNoAction(siren, startIso, path) {
	const wizard = wizardEvents(startIso);
	const submittedAt = wizard[wizard.length - 1].at;
	const pathChoiceAt = addDays(submittedAt, 9);
	const status =
		path === "corrective_action"
			? "corrective_actions_chosen"
			: "joint_evaluation_chosen";
	return {
		siren,
		currentStep: 6,
		status,
		path,
		events: [
			...wizard,
			{ type: "submit", round: 1, at: submittedAt },
			{ type: "path_choice", round: 1, value: path, at: pathChoiceAt },
		],
	};
}

function declarationAwaitingCseAfterCorrective(siren, startIso) {
	const wizard = wizardEvents(startIso);
	const submittedAt = wizard[wizard.length - 1].at;
	const pathChoiceAt = addDays(submittedAt, 7);
	const secondDeclAt = addDays(pathChoiceAt, 55);
	return {
		siren,
		currentStep: 6,
		status: "awaiting_cse_opinion",
		path: "corrective_action",
		events: [
			...wizard,
			{ type: "submit", round: 1, at: submittedAt },
			{
				type: "path_choice",
				round: 1,
				value: "corrective_action",
				at: pathChoiceAt,
			},
			{ type: "second_declaration_submit", round: 2, at: secondDeclAt },
		],
	};
}

function declarationAwaitingCseAfterJointEval(siren, startIso) {
	const wizard = wizardEvents(startIso);
	const submittedAt = wizard[wizard.length - 1].at;
	const pathChoiceAt = addDays(submittedAt, 6);
	const jointEvalAt = addDays(pathChoiceAt, 40);
	return {
		siren,
		currentStep: 6,
		status: "awaiting_cse_opinion",
		path: "joint_evaluation",
		events: [
			...wizard,
			{ type: "submit", round: 1, at: submittedAt },
			{
				type: "path_choice",
				round: 1,
				value: "joint_evaluation",
				at: pathChoiceAt,
			},
			{ type: "joint_evaluation_submit", round: 1, at: jointEvalAt },
		],
	};
}

function declarationAwaitingCseNoAlert(siren, startIso) {
	const wizard = wizardEvents(startIso);
	return {
		siren,
		currentStep: 6,
		status: "awaiting_cse_opinion",
		path: null,
		events: [
			...wizard,
			{ type: "submit", round: 1, at: wizard[wizard.length - 1].at },
		],
	};
}

function declarationAwaitingRevisionChoice(siren, startIso) {
	const wizard = wizardEvents(startIso);
	const submittedAt = wizard[wizard.length - 1].at;
	const pathChoiceAt = addDays(submittedAt, 8);
	const secondDeclAt = addDays(pathChoiceAt, 55);
	return {
		siren,
		currentStep: 6,
		status: "awaiting_revision_choice",
		path: "corrective_action",
		events: [
			...wizard,
			{ type: "submit", round: 1, at: submittedAt },
			{
				type: "path_choice",
				round: 1,
				value: "corrective_action",
				at: pathChoiceAt,
			},
			{ type: "second_declaration_submit", round: 2, at: secondDeclAt },
		],
	};
}

function declarationRevisionChosenNoSubmit(siren, startIso) {
	const wizard = wizardEvents(startIso);
	const submittedAt = wizard[wizard.length - 1].at;
	const pathChoiceAt = addDays(submittedAt, 8);
	const secondDeclAt = addDays(pathChoiceAt, 55);
	const revisionChoiceAt = addDays(secondDeclAt, 5);
	return {
		siren,
		currentStep: 6,
		status: "revised_joint_evaluation_chosen",
		path: "corrective_action",
		secondPath: "joint_evaluation",
		events: [
			...wizard,
			{ type: "submit", round: 1, at: submittedAt },
			{
				type: "path_choice",
				round: 1,
				value: "corrective_action",
				at: pathChoiceAt,
			},
			{ type: "second_declaration_submit", round: 2, at: secondDeclAt },
			{
				type: "path_choice",
				round: 2,
				value: "joint_evaluation",
				at: revisionChoiceAt,
			},
		],
	};
}

function declarationCseRequired(siren, startIso) {
	const wizard = wizardEvents(startIso);
	const submittedAt = wizard[wizard.length - 1].at;
	const pathChoiceAt = addDays(submittedAt, 7);
	const secondDeclAt = addDays(pathChoiceAt, 50);
	const cseAt = addDays(secondDeclAt, 30);
	const completedAt = addDays(cseAt, 2);
	return {
		siren,
		currentStep: 6,
		status: "demarche_completed",
		path: "corrective_action",
		cseRequired: true,
		events: [
			...wizard,
			{ type: "submit", round: 1, at: submittedAt },
			{
				type: "path_choice",
				round: 1,
				value: "corrective_action",
				at: pathChoiceAt,
			},
			{ type: "second_declaration_submit", round: 2, at: secondDeclAt },
			{ type: "cse_opinion_submit", round: 2, at: cseAt },
			{ type: "demarche_complete", round: null, at: completedAt },
		],
	};
}

// Minimal previous-year `demarche_completed` declaration. We only need the
// final state for K1 (no wizard/journey events) — keep the dataset compact.
function previousYearCompleted(siren) {
	const submittedAt = dateUtc(PREV_YEAR, 1, 15);
	const completedAt = dateUtc(PREV_YEAR, 2, 1);
	return {
		siren,
		year: PREV_YEAR,
		currentStep: 6,
		status: "demarche_completed",
		path: null,
		events: [
			{ type: "submit", round: 1, at: submittedAt },
			{ type: "demarche_complete", round: null, at: completedAt },
		],
	};
}

// Half of the 100+ companies submitted last year → ~50 % previous-year rate
// so the YoY delta is non-trivial in the K1 tile (current year ≈ 100 %).
const RAW_PREVIOUS_YEAR_DECLARATIONS = [
	previousYearCompleted("999150001"),
	previousYearCompleted("999150002"),
	previousYearCompleted("999150003"),
	previousYearCompleted("999160001"),
	previousYearCompleted("999160002"),
	previousYearCompleted("999160003"),
];

const HAS_CSE_BY_SIREN = new Map(COMPANIES.map((c) => [c.siren, !!c.hasCse]));

// Inject `cse_opinion_submit` right before `demarche_complete` on every
// declaration whose company has CSE — the FSM (v2027.1) requires every
// `cseRequired = true` declaration to transit through `awaiting_cse_opinion`
// before reaching `demarche_completed`, regardless of the path (no-alert,
// justify, corrective, joint eval, revision). The seed bypasses the FSM by
// inserting events directly, so we apply the same invariant manually.
function applyCseTransform(decl) {
	if (!HAS_CSE_BY_SIREN.get(decl.siren)) return decl;
	if (decl.status !== "demarche_completed") {
		return { ...decl, cseRequired: true };
	}
	const completeIdx = decl.events.findIndex(
		(e) => e.type === "demarche_complete",
	);
	if (completeIdx === -1) return { ...decl, cseRequired: true };
	if (decl.events.some((e) => e.type === "cse_opinion_submit")) {
		return { ...decl, cseRequired: true };
	}
	const completeEvent = decl.events[completeIdx];
	const prevEvent = decl.events[completeIdx - 1];
	const cseAt = prevEvent
		? addDays(prevEvent.at, 14)
		: addDays(completeEvent.at, -1);
	const safeCseAt =
		new Date(cseAt) < new Date(completeEvent.at)
			? cseAt
			: addDays(completeEvent.at, -1);
	const cseEvent = {
		type: "cse_opinion_submit",
		round: prevEvent?.round === 2 ? 2 : 1,
		at: safeCseAt,
	};
	const newCompleteAt = addDays(safeCseAt, 2);
	const shiftedComplete = { ...completeEvent, at: newCompleteAt };
	const events = [
		...decl.events.slice(0, completeIdx),
		cseEvent,
		shiftedComplete,
	];
	return { ...decl, cseRequired: true, events };
}

const RAW_DECLARATIONS = [
	// 4 wizard stuck (different steps for K5)
	{
		siren: "999100001",
		currentStep: 0,
		status: "draft",
		path: null,
		events: [
			{
				type: "step_change",
				round: 0,
				value: "from:null|to:0",
				at: dateUtc(YEAR, 2, 18),
			},
		],
	},
	declarationStuckAtStep("999100002", 1, dateUtc(YEAR, 2, 10)),
	declarationStuckAtStep("999100003", 3, dateUtc(YEAR, 1, 5)),
	declarationStuckAtStep("999100004", 5, dateUtc(YEAR, 1, 1)),

	// 6 complete direct (no alert)
	declarationCompleteDirect("999110001", dateUtc(YEAR, 0, 2)),
	declarationCompleteDirect("999110002", dateUtc(YEAR, 0, 4)),
	declarationCompleteDirect("999110003", dateUtc(YEAR, 0, 6)),
	declarationCompleteDirect("999110004", dateUtc(YEAR, 0, 8)),
	declarationCompleteDirect("999110005", dateUtc(YEAR, 0, 10)),
	declarationCompleteDirect("999110006", dateUtc(YEAR, 0, 12)),

	// 2 justify
	declarationJustify("999120001", dateUtc(YEAR, 0, 3)),
	declarationJustify("999120002", dateUtc(YEAR, 0, 5)),

	// 6 corrective_action + 2nd declaration
	declarationCorrective("999130001", dateUtc(YEAR, 0, 4), 8, 50),
	declarationCorrective("999130002", dateUtc(YEAR, 0, 6), 12, 65),
	declarationCorrective("999130003", dateUtc(YEAR, 0, 8), 10, 55),
	declarationCorrective("999130004", dateUtc(YEAR, 0, 10), 7, 70),
	declarationCorrective("999130005", dateUtc(YEAR, 0, 12), 15, 45),
	declarationCorrective("999130006", dateUtc(YEAR, 0, 14), 9, 60),

	// 6 joint_evaluation round=1
	declarationJointEvaluation("999140001", dateUtc(YEAR, 0, 5), 6, 40),
	declarationJointEvaluation("999140002", dateUtc(YEAR, 0, 7), 10, 50),
	declarationJointEvaluation("999140003", dateUtc(YEAR, 0, 9), 8, 35),
	declarationJointEvaluation("999140004", dateUtc(YEAR, 0, 11), 12, 55),
	declarationJointEvaluation("999140005", dateUtc(YEAR, 0, 13), 7, 45),
	declarationJointEvaluation("999140006", dateUtc(YEAR, 0, 15), 9, 50),

	// 6 revision cycle (corrective → 2nd_decl → revision joint_eval round=2)
	declarationRevision("999150001", dateUtc(YEAR, 0, 2)),
	declarationRevision("999150002", dateUtc(YEAR, 0, 3)),
	declarationRevision("999150003", dateUtc(YEAR, 0, 4)),
	declarationRevision("999150004", dateUtc(YEAR, 0, 5)),
	declarationRevision("999150005", dateUtc(YEAR, 0, 6)),
	declarationRevision("999150006", dateUtc(YEAR, 0, 7)),

	// 6 CSE required
	declarationCseRequired("999160001", dateUtc(YEAR, 0, 2)),
	declarationCseRequired("999160002", dateUtc(YEAR, 0, 3)),
	declarationCseRequired("999160003", dateUtc(YEAR, 0, 4)),
	declarationCseRequired("999160004", dateUtc(YEAR, 0, 5)),
	declarationCseRequired("999160005", dateUtc(YEAR, 0, 6)),
	declarationCseRequired("999160006", dateUtc(YEAR, 0, 7)),

	// Additional wizard stucks (steps 2 and 4 for K5 coverage)
	declarationStuckAtStep("999100005", 2, dateUtc(YEAR, 1, 10)),
	declarationStuckAtStep("999100006", 4, dateUtc(YEAR, 1, 15)),

	// Compliance funnel stucks — submitted with alert, awaiting path choice
	declarationSubmittedAwaitingPath("999170001", dateUtc(YEAR, 1, 20)),
	declarationSubmittedAwaitingPath("999170002", dateUtc(YEAR, 1, 22)),

	// Compliance funnel stucks — path chosen but action not yet submitted
	declarationPathChosenNoAction(
		"999180001",
		dateUtc(YEAR, 1, 5),
		"corrective_action",
	),
	declarationPathChosenNoAction(
		"999180002",
		dateUtc(YEAR, 1, 8),
		"corrective_action",
	),
	declarationPathChosenNoAction(
		"999180003",
		dateUtc(YEAR, 1, 12),
		"joint_evaluation",
	),

	// CSE funnel stucks — action submitted, awaiting CSE opinion
	declarationAwaitingCseAfterCorrective("999190001", dateUtc(YEAR, 0, 8)),
	declarationAwaitingCseAfterJointEval("999190002", dateUtc(YEAR, 0, 10)),
	declarationAwaitingCseNoAlert("999190003", dateUtc(YEAR, 1, 25)),

	// Revision sub-funnel stucks
	declarationRevisionChosenNoSubmit("999195001", dateUtc(YEAR, 0, 4)),
	declarationAwaitingRevisionChoice("999195002", dateUtc(YEAR, 0, 6)),
];

const DECLARATIONS = RAW_DECLARATIONS.map(applyCseTransform);
const PREVIOUS_YEAR_DECLARATIONS =
	RAW_PREVIOUS_YEAR_DECLARATIONS.map(applyCseTransform);

async function main() {
	const sql = postgres(DATABASE_URL, { max: 1 });

	if (CLEAN) {
		console.log(`[seed-demo] cleaning SIRENs ${ALL_SIRENS.length} entries`);
		await sql`
			DELETE FROM app_declaration_status_history
			WHERE declaration_id IN (
				SELECT id FROM app_declaration WHERE siren = ANY(${ALL_SIRENS})
			)
		`;
		await sql`DELETE FROM app_declaration WHERE siren = ANY(${ALL_SIRENS})`;
		await sql`DELETE FROM app_gip_mds_data WHERE siren = ANY(${ALL_SIRENS})`;
		await sql`DELETE FROM app_user_company WHERE siren = ANY(${ALL_SIRENS})`;
		await sql`DELETE FROM app_company WHERE siren = ANY(${ALL_SIRENS})`;
		console.log(`[seed-demo] clean done.`);
		await sql.end();
		return;
	}

	console.log(
		`[seed-demo] year=${YEAR}, ${COMPANIES.length} companies, ${DECLARATIONS.length} declarations + ${PREVIOUS_YEAR_DECLARATIONS.length} prev-year (${PREV_YEAR})`,
	);

	// Spread the volume reduction uniformly across the array so the kept
	// declarations still cover the full date range. Otherwise the cohort
	// curve would stop early (slice(0, N) only keeps the earliest dates).
	const ratio = yearVolumeRatio(YEAR, new Date().getUTCFullYear());
	const ALL_DECLARATIONS = [
		...sampleUniform(DECLARATIONS, ratio),
		...PREVIOUS_YEAR_DECLARATIONS,
	];

	// Single transaction: either the whole dataset lands or none of it, so an
	// interrupted run never leaves a half-seeded DB behind.
	await sql.begin(async (tx) => {
		await tx`
			INSERT INTO app_user (id, email, first_name, last_name, is_admin)
			VALUES (${SEED_USER_ID}, ${SEED_USER_EMAIL}, 'Seed', 'Demo', false)
			ON CONFLICT (id) DO NOTHING
		`;

		for (const c of COMPANIES) {
			await tx`
				INSERT INTO app_company (siren, name, workforce, has_cse, created_at, updated_at)
				VALUES (${c.siren}, ${c.name}, ${c.workforce}, ${c.hasCse ?? false}, NOW(), NOW())
				ON CONFLICT (siren) DO UPDATE SET
					name = EXCLUDED.name,
					workforce = EXCLUDED.workforce,
					has_cse = EXCLUDED.has_cse,
					updated_at = NOW()
			`;
			await tx`
				INSERT INTO app_user_company (user_id, siren)
				VALUES (${SEED_USER_ID}, ${c.siren})
				ON CONFLICT (user_id, siren) DO NOTHING
			`;

			for (const yr of [YEAR, PREV_YEAR]) {
				await tx`
					INSERT INTO app_gip_mds_data (siren, year, workforce_ema, imported_at)
					VALUES (${c.siren}, ${yr}, ${c.workforce}, NOW())
					ON CONFLICT (siren, year) DO UPDATE SET
						workforce_ema = EXCLUDED.workforce_ema,
						imported_at = NOW()
				`;
			}
		}

		for (const d of ALL_DECLARATIONS) {
			const year = d.year ?? YEAR;
			const earliest = d.events[0].at;
			const latest = d.events[d.events.length - 1].at;

			await tx`
				DELETE FROM app_declaration_status_history
				WHERE declaration_id IN (
					SELECT id FROM app_declaration WHERE siren = ${d.siren} AND year = ${year}
				)
			`;
			await tx`DELETE FROM app_declaration WHERE siren = ${d.siren} AND year = ${year}`;

			const inserted = await tx`
				INSERT INTO app_declaration (
					id, siren, year, declarant_id, current_step, status,
					first_declaration_path_choice, second_declaration_path_choice,
					cse_required,
					created_at, updated_at
				) VALUES (
					gen_random_uuid(), ${d.siren}, ${year}, ${SEED_USER_ID},
					${d.currentStep}, ${d.status},
					${d.path ?? null}, ${d.secondPath ?? null},
					${d.cseRequired ?? false},
					${earliest}, ${latest}
				)
				RETURNING id
			`;
			const declId = inserted[0].id;

			for (const ev of d.events) {
				await tx`
					INSERT INTO app_declaration_status_history
						(id, declaration_id, event_type, value, round, actor_user_id, created_at)
					VALUES (
						gen_random_uuid(), ${declId}, ${ev.type},
						${ev.value ?? null}, ${ev.round ?? null},
						${SEED_USER_ID}, ${ev.at}
					)
				`;
			}
			console.log(
				`  → ${d.siren} year=${d.year ?? YEAR} (${d.events.length} events, status=${d.status})`,
			);
		}
	});

	console.log(
		`[seed-demo] done. Login as admin (test@fia1.fr), then visit /admin/stats/campagne (K1, K2, K4) or /admin/stats/plateforme (K19)`,
	);
	await sql.end();
}

main().catch((err) => {
	console.error("[seed-demo] FAILED:", err);
	process.exit(1);
});
