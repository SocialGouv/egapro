import { redirect } from "next/navigation";
import {
	DeclarationLayout,
	MissingSiret,
} from "~/modules/declaration-remuneration";
import { auth } from "~/server/auth";
import { getEffectiveSiren } from "~/server/auth/companyAccess";
import { db } from "~/server/db";
import { getActiveLock } from "~/server/services/declarationLockService";
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
	if (!session?.user) redirect("/login");

	const siren = getEffectiveSiren(session);
	if (!siren) return <MissingSiret />;

	const [company, declarationData] = await Promise.all([
		api.company.get({ siren }),
		api.declaration.getOrCreate(),
	]);

	const declaration = declarationData.declaration;
	const activeLock = await getActiveLock(db, declaration.id);
	const isReadOnly =
		activeLock !== null && activeLock.userId !== session.user.id;
	const lockHolder = isReadOnly
		? {
				firstName: activeLock.firstName,
				lastName: activeLock.lastName,
				email: activeLock.email,
			}
		: null;

	return (
		<DeclarationLayout
			company={company}
			declarationYear={declaration.year}
			isReadOnly={isReadOnly}
			lockHolder={lockHolder}
		>
			{children}
		</DeclarationLayout>
	);
}
