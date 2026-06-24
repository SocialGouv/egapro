import { redirect } from "next/navigation";
import { CseOpinionLayout } from "~/modules/cseOpinion";
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
