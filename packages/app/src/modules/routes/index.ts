// Two invariants make this module worth importing rather than typing a string.
//
// The compiler checks the paths: every literal goes through `route()`, so one
// naming no page fails `next build` at its declaration. The few paths Next
// generates no type for are marked `unroutedPath()`.
//
// Nothing here reaches the server: strings and `import type` only, no edge to
// Drizzle, tRPC or `~/server`. That is what lets a client component import this
// barrel instead of the submodule dance `my-space/declarationProcessState.ts`
// used to need, and `__tests__/moduleBoundaries.test.ts` keeps it true.
//
// A route no code references has no constant here — the filesystem is its source
// of truth. The OpenAPI documents keep their own strings: they are an external
// contract in `{param}` notation, not hrefs. And `packages/notifications`, which
// cannot import this module, mirrors it in `mails/shared/urls.ts` under the
// watch of `__tests__/notificationsParity.test.ts`.

export {
	LOGIN,
	MY_SPACE,
	MY_SPACE_COMPANIES,
	mySpaceHistoryHref,
} from "./shared/accountRoutes";
export {
	ADMIN,
	ADMIN_DECLARATIONS,
	ADMIN_IMPERSONATE,
	ADMIN_MFA_RESUME,
	ADMIN_NAV_LINKS,
	ADMIN_REFERENTS,
	ADMIN_SETTINGS,
	ADMIN_STATS,
	ADMIN_STATS_CAMPAIGN,
	ADMIN_STATS_PLATFORM,
	adminDeclarationHref,
} from "./shared/adminRoutes";
export {
	API_AUTH_LOGOUT,
	API_DECLARATION_LOCK_RELEASE,
	API_DECLARATION_PDF,
	API_E2E_CLOCK,
	API_PREFILL_PDF,
	API_PUBLIC_DECLARATIONS,
	API_PUBLIC_DECLARATIONS_EXPORT,
	API_PUBLIC_OPENAPI,
	API_PUBLIC_REPRESENTATIONS,
	API_PUBLIC_REPRESENTATIONS_EXPORT,
	API_REPRESENTATION_PDF,
	API_SEARCH,
	API_TEST_SENTRY,
	API_TRANSMITTED_PDF,
	API_TRPC,
	API_UPLOAD,
	API_V1_EXPORT_DECLARATIONS,
	API_V1_FILES,
	API_V1_OPENAPI,
	API_V1_PREFIX,
	apiV1FileHref,
} from "./shared/apiRoutes";
export type { AppHref } from "./shared/appHref";
export type {
	ComplianceStep,
	ComplianceStepRoute,
	CseOpinionStep,
	CseOpinionStepRoute,
} from "./shared/complianceRoutes";
export {
	COMPLIANCE_CONFIRMATION,
	COMPLIANCE_JOINT_EVALUATION,
	COMPLIANCE_PATH,
	COMPLIANCE_STEP_NUMBERS,
	CSE_OPINION,
	CSE_OPINION_CONFIRMATION,
	CSE_OPINION_STEP_NUMBERS,
	complianceStepHref,
	cseOpinionStepHref,
	toComplianceStep,
	toCseOpinionStep,
} from "./shared/complianceRoutes";
export type {
	RemunerationStep,
	RemunerationStepRoute,
	RepresentationStep,
	RepresentationStepRoute,
} from "./shared/declarationRoutes";
export {
	clampRepresentationStep,
	DECLARATION_REMUNERATION,
	DECLARATION_REMUNERATION_RECAP,
	DECLARATION_REMUNERATION_RECAP_CORRECTION,
	DECLARATION_REPRESENTATION,
	DECLARATION_REPRESENTATION_CONFIRMATION,
	FIRST_REMUNERATION_STEP,
	FIRST_REPRESENTATION_STEP,
	LAST_REMUNERATION_STEP,
	LAST_REPRESENTATION_STEP,
	REMUNERATION_STEP_NUMBERS,
	REPRESENTATION_STEP_NUMBERS,
	remunerationStepHref,
	representationStepHref,
	toRemunerationStep,
	toRepresentationStep,
} from "./shared/declarationRoutes";
export type { PublicPage } from "./shared/publicRoutes";
export {
	ACCESSIBILITY,
	CONTACT,
	COOKIES,
	CRAWLER_DISALLOWED_PREFIXES,
	FAQ,
	getIndexablePublicPages,
	getPublicPages,
	HELP,
	HOME,
	LEGAL_NOTICE,
	MAINTENANCE,
	OBSERVATORY_SEARCH,
	observatoryCompanyHref,
	PRIVACY,
	PUBLIC_PAGES,
	REFERENTS,
	referentHref,
	SITE_MAP,
	TEST_ERROR,
} from "./shared/publicRoutes";
export { route, routeWithQuery, runtimeRoute } from "./shared/routeContract";
