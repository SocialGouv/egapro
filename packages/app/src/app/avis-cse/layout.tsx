import { redirect } from "next/navigation";
import { CseOpinionLayout } from "~/modules/cseOpinion";
import {
	getObligationWorkforce,
	isCseOpinionRequired,
	isSecondDeclarationResubmissionPending,
} from "~/modules/domain";
import { getPostComplianceDestination } from "~/modules/navigation";
import { complianceStepHref, LOGIN } from "~/modules/routes";
import { auth } from "~/server/auth";
import { resolveAuthorizedSiren } from "~/server/auth/companyAccess";
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
		redirect(LOGIN);
	}

	const siren = await resolveAuthorizedSiren(db, session);
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

	// The opinions must not be transmitted over numbers the declarant has since
	// rewritten without re-submitting: send them back to the recap to do it.
	if (isSecondDeclarationResubmissionPending(declaration)) {
		redirect(complianceStepHref(3));
	}

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
