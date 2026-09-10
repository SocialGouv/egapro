import type { Route } from "next";
import type { mySpaceHistoryHref } from "./accountRoutes";
import type { adminDeclarationHref } from "./adminRoutes";
import type { apiV1FileHref } from "./apiRoutes";
import type {
	ComplianceStepRoute,
	CseOpinionStepRoute,
} from "./complianceRoutes";
import type {
	RemunerationStepRoute,
	RepresentationStepRoute,
} from "./declarationRoutes";
import type { observatoryCompanyHref, referentHref } from "./publicRoutes";

// What a link-rendering component takes instead of `string`, so a path naming no
// route stops at the component boundary rather than being laundered through it.
// `Route<string>` already spans the static routes, their query and hash variants
// and absolute URLs; the dynamic families are spelled out because Next resolves
// the dynamic arm of `Route<T>` only for a literal `T`, and a prop is never one.
export type AppHref =
	| Route<string>
	| RemunerationStepRoute
	| RepresentationStepRoute
	| ComplianceStepRoute
	| CseOpinionStepRoute
	| ReturnType<typeof observatoryCompanyHref>
	| ReturnType<typeof referentHref>
	| ReturnType<typeof adminDeclarationHref>
	| ReturnType<typeof mySpaceHistoryHref>
	| ReturnType<typeof apiV1FileHref>;
