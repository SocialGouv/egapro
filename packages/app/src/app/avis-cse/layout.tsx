import { redirect } from "next/navigation";
import { CseOpinionLayout } from "~/modules/cseOpinion";
import { getPostComplianceDestination } from "~/modules/declaration-remuneration/shared/complianceNavigation";
import { getObligationWorkforce, isCseOpinionRequired } from "~/modules/domain";
import { auth } from "~/server/auth";
import { getEffectiveSiren } from "~/server/auth/companyAccess";
import { db } from "~/server/db";
import { getLockReadState } from "~/server/services/declarationLockService";
import { api } from "~/trpc/server";

export default async function CseOpinionRootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();

	if (!session?.user) {
		redirect("/login");
	}

	const siren = getEffectiveSiren(session);
	if (!siren) {
		redirect("/");
	}

	const [company, declarationData] = await Promise.all([
		api.company.get({ siren }),
		api.declaration.getOrCreate(),
	]);

	// Reads the company's live answer rather than the declaration snapshot, so a
	// démarche parked here by a stale snapshot recovers on its own.
	const cseOpinionRequired = isCseOpinionRequired({
		workforce: getObligationWorkforce(company.gipWorkforce),
		hasCse: company.hasCse,
	});

	// This funnel's fields are all required, so landing here with no opinion to
	// transmit is a dead end.
	if (!cseOpinionRequired) {
		redirect(getPostComplianceDestination(cseOpinionRequired));
	}

	const declaration = declarationData.declaration;
	const { isReadOnly, lockHolder } = await getLockReadState(
		db,
		declaration.id,
		session.user.id,
	);

	return (
		<CseOpinionLayout
			company={company}
			declarationYear={declaration.year}
			isReadOnly={isReadOnly}
			lockHolder={lockHolder}
		>
			{children}
		</CseOpinionLayout>
	);
}
