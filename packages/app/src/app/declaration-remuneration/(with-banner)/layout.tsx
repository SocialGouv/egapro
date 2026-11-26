import { redirect } from "next/navigation";
import {
	DeclarationLayout,
	MissingSiret,
} from "~/modules/declaration-remuneration";
import {
	getCurrentYear,
	getObligationWorkforce,
	hasRequiredDeclarationInfo,
	isCseAnswerLocked,
	isCseRequired,
	isDeclarationWritingClosed,
	resolveCseAnswerForYear,
} from "~/modules/domain";
import { LOGIN, MY_SPACE } from "~/modules/routes";
import { auth } from "~/server/auth";
import {
	isImpersonating,
	resolveAuthorizedSiren,
} from "~/server/auth/companyAccess";
import { db } from "~/server/db";
import { resolveCurrentDeclarationCseState } from "~/server/db/declarationConditions";
import { api } from "~/trpc/server";

/**
 * Wraps the declaration funnel pages (etape, parcours-conformite, etc.)
 * with the standard CompanyBanner + container layout. The recap page
 * lives outside this group on purpose — it follows a different Figma
 * (consultation) frame that uses just a breadcrumb.
 *
 * The parent `declaration-remuneration/layout.tsx` already enforces
 * auth + SIREN; we re-validate here so this layout stays type-safe and
 * self-contained, and so the data fetch can attach to the correct SIREN.
 */
export default async function WithBannerLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();
	if (!session?.user) redirect(LOGIN);

	const siren = await resolveAuthorizedSiren(db, session);
	if (!siren) return <MissingSiret />;

	const year = getCurrentYear();
	const [company, profile, declarationCse] = await Promise.all([
		api.company.get({ siren }),
		api.profile.get().catch(() => null),
		resolveCurrentDeclarationCseState(db, siren, year),
	]);

	const cseApplicable = isCseRequired(
		getObligationWorkforce(company.gipWorkforce),
	);
	// The year's snapshot is the answer that year declared; the live column is
	// only the fallback for years no submission ever filled. The lock follows
	// the same declaration, so a frozen year stops asking the question.
	const cseAnswer = resolveCseAnswerForYear(
		declarationCse?.hasCse ?? null,
		company.hasCse,
	);
	const cseLocked = isCseAnswerLocked(declarationCse?.status ?? null);

	if (
		!isImpersonating(session) &&
		!hasRequiredDeclarationInfo(
			profile?.phone ?? null,
			cseAnswer,
			cseApplicable,
			cseLocked,
		)
	) {
		redirect(MY_SPACE);
	}

	// Kept after the guard: `getOrCreate` inserts a draft declaration, and a
	// visitor bounced back to Mon espace must not leave one behind.
	const declarationData = await api.declaration.getOrCreate();
	const declaration = declarationData.declaration;

	const lockAcquisitionSuspended = isDeclarationWritingClosed(
		declaration.status,
		declarationData.isFirstDeclarationLocked,
		declarationData.lastTransmission,
	);

	return (
		<DeclarationLayout
			company={company}
			declarationId={declaration.id}
			declarationYear={declaration.year}
			lockAcquisitionSuspended={lockAcquisitionSuspended}
		>
			{children}
		</DeclarationLayout>
	);
}
