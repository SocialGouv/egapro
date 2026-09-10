// Where "in state X the user goes to Y" is decided, once (#4113 merged the two
// switches that used to decide it). A sibling of `~/modules/routes` rather than
// a file in `declaration-remuneration`, because Mon espace and `app/avis-cse`
// cannot import that feature's barrel without dragging its server-touching tree
// into a client bundle — `__tests__/moduleBoundaries.test.ts` holds the line.

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
