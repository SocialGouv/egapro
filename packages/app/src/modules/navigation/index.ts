// Where "in state X the user goes to Y" is decided, once.
//
// It used to be decided twice — `declaration-remuneration/shared/complianceNavigation.ts`
// for the funnel and `my-space/declarationProcessState.ts` for the panel CTA —
// two exhaustive switches agreeing on 6 of the 8 states and drifting apart on
// the other two by accident rather than by decision.
//
// This module is a sibling of `~/modules/routes` rather than a file inside
// `declaration-remuneration` because all three surfaces consume it, and two of
// them (Mon espace, `app/avis-cse`) cannot import that feature's barrel without
// dragging its server-touching tree into a client bundle. Its import surface is
// `~/modules/routes` (strings) and `~/modules/domain` (types only), which
// `__tests__/moduleBoundaries.test.ts` keeps true.
//
// The engine stays the authority: `server/rules/__tests__/fsmMirrors.conformance.test.ts`
// derives its expectations from `loadRules(...)`, states and transitions alike.

export type {
	CseOpinionOrigin,
	CseOpinionOriginContext,
} from "./shared/remunerationDemarcheNavigation";
export {
	CSE_OPINION_PREVIOUS_HREF,
	getCompliancePathHref,
	getCompliancePathPreviousHref,
	getCseOpinionPreviousHref,
	getCurrentStageHref,
	getDemarcheStageHref,
	getPostComplianceDestination,
	resolveCseOpinionOrigin,
} from "./shared/remunerationDemarcheNavigation";
