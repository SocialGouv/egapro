import { redirect } from "next/navigation";
import { CseOpinionLayout } from "~/modules/cseOpinion";
import { auth } from "~/server/auth";
import { getEffectiveSiren } from "~/server/auth/companyAccess";
import { db } from "~/server/db";
import { getActiveLock } from "~/server/services/declarationLockService";
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
