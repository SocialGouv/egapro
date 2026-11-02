import { TRPCError } from "@trpc/server";
import { redirect } from "next/navigation";

import { CompanyBanner } from "~/modules/declaration-remuneration/shared/CompanyBanner";
import { DeclarationLockAlert } from "~/modules/declaration-remuneration/shared/lock/DeclarationLockAlert";
import { LockProvider } from "~/modules/declaration-remuneration/shared/lock/LockContext";
import { RouteScrollReset } from "~/modules/layout";
import { LOGIN, MY_SPACE } from "~/modules/routes";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { getLockReadState } from "~/server/services/declarationLockService";
import { api } from "~/trpc/server";
import { FormalNoticeForm } from "./FormalNoticeForm";

async function getFormalNoticeOrNull() {
	try {
		return await api.formalNotice.get();
	} catch (error) {
		if (error instanceof TRPCError && error.code === "NOT_FOUND") return null;
		throw error;
	}
}

export async function FormalNoticePage() {
	const session = await auth();
	if (!session?.user) redirect(LOGIN);

	const formalNotice = await getFormalNoticeOrNull();
	if (!formalNotice?.available) redirect(MY_SPACE);

	const [company, { isReadOnly, lockHolder }] = await Promise.all([
		api.company.get({ siren: formalNotice.siren }),
		getLockReadState(db, formalNotice.declarationId, session.user.id),
	]);

	return (
		<main id="content" tabIndex={-1}>
			<RouteScrollReset />
			<CompanyBanner
				company={company}
				currentPageLabel={`Démarche des indicateurs de rémunération ${formalNotice.year}`}
			/>
			<div className="fr-container fr-py-7w">
				<LockProvider holder={lockHolder} isReadOnly={isReadOnly}>
					<div className="fr-grid-row fr-grid-row--center">
						<div className="fr-col-12 fr-col-lg-8">
							{isReadOnly && lockHolder && (
								<DeclarationLockAlert holder={lockHolder} />
							)}
							<FormalNoticeForm existingFile={formalNotice.existingFile} />
						</div>
					</div>
				</LockProvider>
			</div>
		</main>
	);
}
