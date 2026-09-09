function trimTrailingSlash(url: string): string {
	return url.replace(/\/$/, "");
}

// Environment-specific base URL, injected per deployment (prod / alpha / review
// app) via EGAPRO_PUBLIC_URL. Falls back to production.
//
// The paths below MIRROR `packages/app/src/modules/routes`. This package has no
// dependency on the app, no `paths` in its tsconfig, and `next.config.js` keeps
// it outside the bundler (`serverExternalPackages`), so it cannot import that
// module — sharing one would mean a third workspace package. The mirror is held
// by a test on the app side, which *can* import this one:
// `app/src/modules/routes/__tests__/notificationsParity.test.ts`. Same
// arrangement as `../../dates.ts` and the campaign deadlines it mirrors.
//
// The flow resolves the declaration from the session
// (`api.declaration.getOrCreate`), so no siren/year query is used — an
// unauthenticated click is bounced to `/login?callbackUrl=…` by the app
// middleware and lands on the target page after ProConnect sign-in.
export function getPublicUrl(): string {
	const url = process.env.EGAPRO_PUBLIC_URL ?? "https://egapro.travail.gouv.fr";
	return trimTrailingSlash(url);
}

export function getLoginUrl(): string {
	return `${getPublicUrl()}/login`;
}

export function getMySpaceUrl(): string {
	return `${getPublicUrl()}/mon-espace`;
}

export function getDeclarationUrl(): string {
	return `${getPublicUrl()}/declaration-remuneration`;
}

export function getCompliancePathUrl(): string {
	return `${getPublicUrl()}/declaration-remuneration/parcours-conformite`;
}

export function getCorrectiveActionsUrl(): string {
	return `${getPublicUrl()}/declaration-remuneration/parcours-conformite/etape/1`;
}

export function getJointEvaluationUrl(): string {
	return `${getPublicUrl()}/declaration-remuneration/parcours-conformite/evaluation-conjointe`;
}

export function getAvisCseUrl(): string {
	return `${getPublicUrl()}/avis-cse`;
}

export function getAssetUrl(path: string): string {
	const cleaned = path.replace(/^\/+/, "");
	return `${getPublicUrl()}/assets/email/${cleaned}`;
}

export function getImageUrl(path: string): string {
	const cleaned = path.replace(/^\/+/, "");
	return `${getPublicUrl()}/assets/images/mails/${cleaned}`;
}
